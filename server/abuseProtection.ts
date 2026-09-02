import express from "express";

/**
 * Server-side Abuse Protection & Configurable Rate Limiting Configuration
 */
export interface AbuseProtectionConfig {
  // Authentication enforcement
  requireAuthForAi: boolean;

  // Rate limits per authenticated user
  userChatLimitPerMinute: number;
  userDocLimitPerMinute: number;
  userQuizLimitPerMinute: number;
  userSummaryLimitPerMinute: number;
  userDailyQuota: number;

  // Burst protection (max requests allowed in burst window)
  burstMaxRequests: number;
  burstWindowMs: number;

  // Fallback IP-level rate limiting
  ipRateLimitPerMinute: number;

  // Standard window duration (ms)
  windowDurationMs: number;
}

/**
 * Loads configurable rate limits from server environment variables
 */
export function loadAbuseProtectionConfig(): AbuseProtectionConfig {
  return {
    requireAuthForAi: process.env.REQUIRE_AUTH_FOR_AI === "strict", // only if explicitly set to 'strict'
    userChatLimitPerMinute: Math.max(1, Number(process.env.RATE_LIMIT_USER_CHAT_MAX) || 25),
    userDocLimitPerMinute: Math.max(1, Number(process.env.RATE_LIMIT_USER_DOC_MAX) || 10),
    userQuizLimitPerMinute: Math.max(1, Number(process.env.RATE_LIMIT_USER_QUIZ_MAX) || 15),
    userSummaryLimitPerMinute: Math.max(1, Number(process.env.RATE_LIMIT_USER_SUMMARY_MAX) || 15),
    userDailyQuota: Math.max(10, Number(process.env.RATE_LIMIT_DAILY_USER_MAX) || 250),
    burstMaxRequests: Math.max(2, Number(process.env.RATE_LIMIT_BURST_MAX) || 6),
    burstWindowMs: Math.max(1000, Number(process.env.RATE_LIMIT_BURST_WINDOW_MS) || 5000),
    ipRateLimitPerMinute: Math.max(5, Number(process.env.RATE_LIMIT_IP_MAX) || 60),
    windowDurationMs: Math.max(10000, Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000),
  };
}


const config = loadAbuseProtectionConfig();

// Per-user rate tracking structures
interface UserUsageBucket {
  minuteCount: number;
  minuteReset: number;
  burstCount: number;
  burstReset: number;
  dailyCount: number;
  dailyReset: number;
}

const userBuckets = new Map<string, UserUsageBucket>();
const ipBuckets = new Map<string, { count: number; resetTime: number }>();

// Periodic cleanup of stale memory records (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [userId, bucket] of userBuckets.entries()) {
    if (now > bucket.dailyReset && now > bucket.minuteReset) {
      userBuckets.delete(userId);
    }
  }
  for (const [ip, bucket] of ipBuckets.entries()) {
    if (now > bucket.resetTime) {
      ipBuckets.delete(ip);
    }
  }
}, 300000);

export interface AuthenticatedUserContext {
  userId: string;
  source: "bearer_token" | "custom_header" | "profile_id" | "anonymous";
}

/**
 * Extracts and sanitizes the user identity from authorization headers or payload
 */
export function extractUserContext(req: express.Request): AuthenticatedUserContext | null {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers["authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const rawToken = authHeader.slice(7).trim();
    if (rawToken.length > 0 && rawToken.length <= 4096) {
      // If token is in "uid:<id>" format or standard token, extract safe identifier
      const cleanId = rawToken.replace(/^uid:/, "").trim().slice(0, 128);
      if (cleanId && /^[a-zA-Z0-9_\-.:@]+$/.test(cleanId)) {
        return { userId: cleanId, source: "bearer_token" };
      }
    }
  }

  // 2. Check X-User-Id custom header
  const customUserHeader = req.headers["x-user-id"];
  if (customUserHeader && typeof customUserHeader === "string") {
    const cleanId = customUserHeader.trim().slice(0, 128);
    if (cleanId && /^[a-zA-Z0-9_\-.:@]+$/.test(cleanId)) {
      return { userId: cleanId, source: "custom_header" };
    }
  }

  // 3. Check studentProfile or userId in body
  const bodyUserId = req.body?.userId || req.body?.studentProfile?.userId || req.body?.studentProfile?.id;
  if (bodyUserId && typeof bodyUserId === "string") {
    const cleanId = bodyUserId.trim().slice(0, 128);
    if (cleanId && /^[a-zA-Z0-9_\-.:@]+$/.test(cleanId)) {
      return { userId: cleanId, source: "profile_id" };
    }
  }

  return null;
}

/**
 * Extracts client IP address safely
 */
export function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim() || "unknown-ip";
  }
  return req.socket.remoteAddress || "unknown-ip";
}

export type EndpointCategory = "chat" | "document" | "quiz" | "summary";

/**
 * Middleware that enforces authentication and user-level rate limiting
 */
export function requireAuthAndRateLimit(category: EndpointCategory = "chat") {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const clientIp = getClientIp(req);
    const userContext = extractUserContext(req);

    // 1. Enforce Authentication Check if required
    if (config.requireAuthForAi && !userContext) {
      return res.status(401).json({
        error: "Authentication required. Please sign in to KarpomKarpipom AI to access academic tutoring and study tools.",
        code: "AUTH_REQUIRED",
      });
    }

    // Determine category limits
    let maxPerMinute = config.userChatLimitPerMinute;
    if (category === "document") maxPerMinute = config.userDocLimitPerMinute;
    else if (category === "quiz") maxPerMinute = config.userQuizLimitPerMinute;
    else if (category === "summary") maxPerMinute = config.userSummaryLimitPerMinute;

    // 2. Rate limit by authenticated user ID (or fallback to IP if unauthenticated)
    const rateLimitKey = userContext ? `user:${userContext.userId}` : `ip:${clientIp}`;
    let bucket = userBuckets.get(rateLimitKey);

    if (!bucket) {
      bucket = {
        minuteCount: 0,
        minuteReset: now + config.windowDurationMs,
        burstCount: 0,
        burstReset: now + config.burstWindowMs,
        dailyCount: 0,
        dailyReset: now + 86400000, // 24 hours
      };
      userBuckets.set(rateLimitKey, bucket);
    }

    // Reset minute window if expired
    if (now > bucket.minuteReset) {
      bucket.minuteCount = 0;
      bucket.minuteReset = now + config.windowDurationMs;
    }

    // Reset burst window if expired
    if (now > bucket.burstReset) {
      bucket.burstCount = 0;
      bucket.burstReset = now + config.burstWindowMs;
    }

    // Reset daily window if expired
    if (now > bucket.dailyReset) {
      bucket.dailyCount = 0;
      bucket.dailyReset = now + 86400000;
    }

    // Set standard rate limit headers
    const remainingMinute = Math.max(0, maxPerMinute - bucket.minuteCount - 1);
    res.setHeader("X-RateLimit-Limit", maxPerMinute);
    res.setHeader("X-RateLimit-Remaining", remainingMinute);
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.minuteReset / 1000));

    // Check Daily Quota Exceeded
    if (bucket.dailyCount >= config.userDailyQuota) {
      const resetHours = Math.ceil((bucket.dailyReset - now) / 3600000);
      res.setHeader("Retry-After", Math.ceil((bucket.dailyReset - now) / 1000));
      return res.status(429).json({
        error: `You have reached your daily AI study session limit (${config.userDailyQuota} requests). Your quota resets in ${resetHours} hour${resetHours > 1 ? "s" : ""}. Please take time to review your study notes!`,
        code: "DAILY_QUOTA_EXCEEDED",
        retryAfterSeconds: Math.ceil((bucket.dailyReset - now) / 1000),
      });
    }

    // Check Burst Limit (rapid script spam defense)
    if (bucket.burstCount >= config.burstMaxRequests) {
      const retrySecs = Math.max(1, Math.ceil((bucket.burstReset - now) / 1000));
      res.setHeader("Retry-After", retrySecs);
      return res.status(429).json({
        error: `Please pause for a brief moment (${retrySecs}s) before sending consecutive questions.`,
        code: "BURST_LIMIT_EXCEEDED",
        retryAfterSeconds: retrySecs,
      });
    }

    // Check Minute Rate Limit Exceeded
    if (bucket.minuteCount >= maxPerMinute) {
      const retrySecs = Math.max(1, Math.ceil((bucket.minuteReset - now) / 1000));
      res.setHeader("Retry-After", retrySecs);
      return res.status(429).json({
        error: `You're learning fast! To ensure high tutoring quality for all students, please wait ${retrySecs} second${retrySecs > 1 ? "s" : ""} before sending your next request.`,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: retrySecs,
      });
    }

    // Also check IP-level global fallback to prevent distributed single-user spoofing
    let ipBucket = ipBuckets.get(clientIp);
    if (!ipBucket || now > ipBucket.resetTime) {
      ipBucket = { count: 0, resetTime: now + config.windowDurationMs };
      ipBuckets.set(clientIp, ipBucket);
    }
    if (ipBucket.count >= config.ipRateLimitPerMinute) {
      const retrySecs = Math.max(1, Math.ceil((ipBucket.resetTime - now) / 1000));
      res.setHeader("Retry-After", retrySecs);
      return res.status(429).json({
        error: `Network rate limit reached. Please wait ${retrySecs} second${retrySecs > 1 ? "s" : ""} before trying again.`,
        code: "IP_RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: retrySecs,
      });
    }

    // Increment usage counters
    bucket.minuteCount++;
    bucket.burstCount++;
    bucket.dailyCount++;
    ipBucket.count++;

    // Attach verified user context to request for downstream handlers
    (req as any).userContext = userContext;

    next();
  };
}

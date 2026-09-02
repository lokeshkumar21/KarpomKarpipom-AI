import mammoth from "mammoth";

export interface ProcessedDocumentResult {
  fileName: string;
  fileSize: number;
  mimeType: string;
  docType: "pdf" | "docx" | "txt" | "markdown" | "other";
  wordCount: number;
  charCount: number;
  previewSnippet: string;
  extractedText?: string;
  base64Data?: string;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_EXTRACTED_CHARS = 50000;

/**
 * Sanitizes uploaded filenames against directory traversal and malicious characters
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== "string") {
    return "uploaded_document";
  }
  // Remove null bytes, path separators, and normalize
  const cleaned = rawName
    .replace(/[\0\x00-\x1F\x7F]/g, "")
    .replace(/[/\\]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .trim();
  return cleaned.slice(0, 150) || "uploaded_document";
}

/**
 * Validates and extracts educational content from PDF, DOCX, TXT, and Markdown files
 */
export async function processUploadedDocument(
  fileBuffer: Buffer,
  rawFileName: string,
  providedMimeType?: string
): Promise<ProcessedDocumentResult> {
  const fileName = sanitizeFileName(rawFileName);

  // 1. Check file size
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error(
      `The file "${fileName}" is empty (0 bytes). Please upload a document containing academic material.`
    );
  }

  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (fileBuffer.length / (1024 * 1024)).toFixed(1);
    throw new Error(
      `The file "${fileName}" is ${sizeInMB}MB, which exceeds the maximum limit of 20MB. Please upload a smaller document or chapter excerpt.`
    );
  }

  const ext = fileName.toLowerCase().split(".").pop() || "";
  let docType: ProcessedDocumentResult["docType"] = "other";
  let mimeType = providedMimeType || "application/octet-stream";
  let extractedText = "";
  let previewSnippet = "";
  let wordCount = 0;
  let charCount = 0;

  // Reject known dangerous/executable file extensions
  const dangerousExts = ["exe", "bat", "sh", "bin", "cmd", "vbs", "ps1", "jar", "wasm", "dll", "so", "php", "pl"];
  if (dangerousExts.includes(ext)) {
    throw new Error(`Executable file types are strictly prohibited for academic uploads.`);
  }

  // 2. Identify and validate file type
  if (ext === "pdf" || mimeType.includes("pdf")) {
    docType = "pdf";
    mimeType = "application/pdf";

    // Validate PDF header magic bytes (%PDF)
    const headerStr = fileBuffer.slice(0, 10).toString("ascii");
    if (!headerStr.includes("%PDF")) {
      throw new Error(
        `The file "${fileName}" is corrupted or is not a valid PDF document. Please verify the file integrity.`
      );
    }

    const base64Data = fileBuffer.toString("base64");
    charCount = fileBuffer.length;
    // Estimated words for UI preview
    wordCount = Math.round(fileBuffer.length / 50);
    previewSnippet = `[PDF Document: ${fileName} - Prepared for multimodal AI analysis including equations, diagrams, tables, and text]`;

    return {
      fileName,
      fileSize: fileBuffer.length,
      mimeType,
      docType,
      wordCount,
      charCount,
      previewSnippet,
      base64Data,
    };
  } else if (ext === "docx" || mimeType.includes("wordprocessingml") || mimeType.includes("msword")) {
    docType = "docx";
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Validate ZIP magic bytes (PK\x03\x04) for DOCX
    const magicHeader = fileBuffer.slice(0, 4);
    if (magicHeader.length < 4 || magicHeader[0] !== 0x50 || magicHeader[1] !== 0x4B) {
      throw new Error(
        `The file "${fileName}" is not a valid Word (.docx) package.`
      );
    }

    try {
      const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = mammothResult.value?.trim() || "";

      if (!extractedText) {
        throw new Error(
          `No readable text could be extracted from "${fileName}". The DOCX document might be empty, password-protected, or composed purely of scanned images.`
        );
      }

      if (extractedText.length > MAX_EXTRACTED_CHARS) {
        extractedText = extractedText.slice(0, MAX_EXTRACTED_CHARS) + "\n\n[Document excerpt truncated for optimal analysis]";
      }

      charCount = extractedText.length;
      wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      previewSnippet =
        extractedText.length > 300
          ? extractedText.substring(0, 300).trim() + "..."
          : extractedText;

      return {
        fileName,
        fileSize: fileBuffer.length,
        mimeType,
        docType,
        wordCount,
        charCount,
        previewSnippet,
        extractedText,
        base64Data: fileBuffer.toString("base64"),
      };
    } catch (err: any) {
      if (err.message && err.message.includes("No readable text")) {
        throw err;
      }
      throw new Error(
        `Failed to parse DOCX document "${fileName}": ${err.message || "Invalid or corrupt Word format"}`
      );
    }
  } else if (
    ext === "txt" ||
    ext === "md" ||
    ext === "csv" ||
    ext === "json" ||
    ext === "py" ||
    ext === "cpp" ||
    ext === "c" ||
    ext === "java" ||
    mimeType.startsWith("text/")
  ) {
    docType = ext === "md" ? "markdown" : "txt";
    mimeType = ext === "md" ? "text/markdown" : "text/plain";

    // Quick check for binary ELF / PE executable signatures in text uploads
    if (fileBuffer.length >= 4) {
      if (
        (fileBuffer[0] === 0x7F && fileBuffer[1] === 0x45 && fileBuffer[2] === 0x4C && fileBuffer[3] === 0x46) || // ELF
        (fileBuffer[0] === 0x4D && fileBuffer[1] === 0x5A) // MZ (Windows PE)
      ) {
        throw new Error(`Executable binary files cannot be processed as text documents.`);
      }
    }

    try {
      extractedText = fileBuffer.toString("utf-8").trim();
      if (!extractedText) {
        throw new Error(
          `The text document "${fileName}" is empty. Please upload a file with study notes or code.`
        );
      }

      if (extractedText.length > MAX_EXTRACTED_CHARS) {
        extractedText = extractedText.slice(0, MAX_EXTRACTED_CHARS) + "\n\n[Document excerpt truncated for optimal analysis]";
      }

      charCount = extractedText.length;
      wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      previewSnippet =
        extractedText.length > 300
          ? extractedText.substring(0, 300).trim() + "..."
          : extractedText;

      return {
        fileName,
        fileSize: fileBuffer.length,
        mimeType,
        docType,
        wordCount,
        charCount,
        previewSnippet,
        extractedText,
        base64Data: fileBuffer.toString("base64"),
      };
    } catch (err: any) {
      throw new Error(`Failed to decode text document "${fileName}": ${err.message}`);
    }
  } else {
    throw new Error(
      `Unsupported file type for "${fileName}". KarpomKarpipom AI supports PDF (.pdf), Word (.docx), and Text (.txt, .md, .csv) documents.`
    );
  }
}

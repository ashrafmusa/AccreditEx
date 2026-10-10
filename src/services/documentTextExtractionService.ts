import type { DocumentTextExtraction } from "@/types";
import { readFileAsArrayBuffer } from "@/services/documentImportService";

export const DOCUMENT_EXTRACTION_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxPages: 50,
  maxCharacters: 100_000,
} as const;

export const extractionWarningKey = (result: DocumentTextExtraction): string | null => {
  if (result.limitations.includes("sizeLimit")) return "documentExtractionSizeLimit";
  if (result.status === "failed") return "documentExtractionFailed";
  if (result.status === "unsupported") return "documentExtractionUnsupported";
  if (result.status === "empty") return "documentExtractionEmpty";
  if (result.status === "truncated") return "documentExtractionTruncated";
  if (result.limitations.includes("ocrUnavailable")) return "documentExtractionNoOcr";
  return null;
};

/** Reads only a user-selected File. Never retrieves attachment URLs or performs OCR. */
export async function extractDocumentText(file: File): Promise<DocumentTextExtraction> {
  const result: DocumentTextExtraction = {
    sourceFileName: file.name,
    text: "",
    status: "empty",
    extractedAt: new Date().toISOString(),
    pagesProcessed: 0,
    totalPages: null,
    limitations: [],
  };
  if (file.size > DOCUMENT_EXTRACTION_LIMITS.maxBytes) {
    return { ...result, status: "failed", limitations: ["sizeLimit"] };
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "tif", "tiff", "bmp"].includes(extension || "")) {
    return { ...result, status: "unsupported", limitations: ["ocrUnavailable"] };
  }
  const append = (text: string) => {
    const remaining = DOCUMENT_EXTRACTION_LIMITS.maxCharacters - result.text.length;
    if (text.length > remaining && !result.limitations.includes("characterLimit")) {
      result.limitations.push("characterLimit");
    }
    result.text += text.slice(0, remaining);
  };

  try {
    if (file.type === "application/pdf" || extension === "pdf") {
      const pdfjs = await import("pdfjs-dist");
      const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdfjs.getDocument({
        data: new Uint8Array(await readFileAsArrayBuffer(file)),
        isEvalSupported: false,
        useSystemFonts: true,
      });
      try {
        const pdf = await task.promise;
        result.totalPages = pdf.numPages;
        if (pdf.numPages > DOCUMENT_EXTRACTION_LIMITS.maxPages) result.limitations.push("pageLimit");
        // Even text-bearing PDFs may contain scanned pages or image-only sections.
        result.limitations.push("ocrUnavailable");
        for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, DOCUMENT_EXTRACTION_LIMITS.maxPages); pageNumber++) {
          if (result.text.length >= DOCUMENT_EXTRACTION_LIMITS.maxCharacters) {
            if (!result.limitations.includes("characterLimit")) result.limitations.push("characterLimit");
            break;
          }
          const page = await pdf.getPage(pageNumber);
          try {
            const content = await page.getTextContent();
            for (const item of content.items) {
              if ("str" in item) append(`${item.str}${item.hasEOL ? "\n" : " "}`);
              if (result.text.length >= DOCUMENT_EXTRACTION_LIMITS.maxCharacters) break;
            }
            append("\n");
            result.pagesProcessed++;
          } finally {
            page.cleanup();
          }
        }
      } finally {
        await task.destroy();
      }
    } else if (extension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = await import("mammoth");
      const { value, messages } = await mammoth.extractRawText({ arrayBuffer: await readFileAsArrayBuffer(file) });
      append(value);
      result.limitations.push("ocrUnavailable");
      if (messages.some((message) => message.type === "error")) throw new Error("Document parser reported an error");
    } else if (extension === "txt" || file.type === "text/plain") {
      const buffer = await readFileAsArrayBuffer(file);
      append(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
    } else {
      return { ...result, status: "unsupported", limitations: ["unsupportedFormat"] };
    }
    result.text = result.text.trim();
    result.status = !result.text ? "empty"
      : result.limitations.some((limit) => limit === "pageLimit" || limit === "characterLimit") ? "truncated" : "extracted";
    return result;
  } catch {
    // Partial parser output must never appear to be a successful extraction.
    return { ...result, text: "", status: "failed", limitations: [...result.limitations, "parseFailed"] };
  }
}

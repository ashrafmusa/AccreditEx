import { TextDecoder, TextEncoder } from "util";
import { DOCUMENT_EXTRACTION_LIMITS, extractDocumentText, extractionWarningKey } from "@/services/documentTextExtractionService";
import { readFileAsArrayBuffer } from "@/services/documentImportService";
import { en } from "@/data/locales/en/documents";
import { ar } from "@/data/locales/ar/documents";

jest.mock("@/services/documentImportService", () => ({ readFileAsArrayBuffer: jest.fn() }));
jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: jest.fn(),
}));
jest.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  __esModule: true, default: "/assets/pdf.worker.min-local.mjs",
}), { virtual: true });
jest.mock("mammoth", () => ({ extractRawText: jest.fn() }));

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { extractRawText } from "mammoth";

const pdfFile = () => new File(["pdf"], "policy.pdf", { type: "application/pdf" });
const configurePdf = (pages: number, texts: string[] = ["Readable policy text"]) => {
  const cleanup = jest.fn();
  const getPage = jest.fn(async (pageNumber: number) => ({
    getTextContent: jest.fn(async () => ({
      items: [{ str: texts[(pageNumber - 1) % texts.length], hasEOL: true }, { type: "beginMarkedContent" }],
    })),
    cleanup,
  }));
  const destroy = jest.fn(async () => undefined);
  jest.mocked(getDocument).mockReturnValue({
    promise: Promise.resolve({ numPages: pages, getPage }),
    destroy,
  } as unknown as ReturnType<typeof getDocument>);
  return { getPage, cleanup, destroy };
};

describe("bounded local attachment text extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder, configurable: true });
    jest.mocked(readFileAsArrayBuffer).mockResolvedValue(new ArrayBuffer(4));
    jest.mocked(extractRawText).mockResolvedValue({ value: "DOCX policy text", messages: [] });
  });

  it("extracts PDF text using a locally bundled worker and cleans up parsing resources", async () => {
    // Arrange
    const { cleanup, destroy } = configurePdf(2, ["First page", "Second page"]);

    // Act
    const result = await extractDocumentText(pdfFile());

    // Assert
    expect(result).toMatchObject({
      sourceFileName: "policy.pdf", text: "First page\n\nSecond page", status: "extracted",
      pagesProcessed: 2, totalPages: 2, limitations: ["ocrUnavailable"],
    });
    expect(GlobalWorkerOptions.workerSrc).toBe("/assets/pdf.worker.min-local.mjs");
    expect(getDocument).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Uint8Array), isEvalSupported: false }));
    expect(getDocument).not.toHaveBeenCalledWith(expect.objectContaining({ url: expect.anything() }));
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(extractionWarningKey(result)).toBe("documentExtractionNoOcr");
  });

  it("never parses more than 50 PDF pages and records omitted coverage", async () => {
    // Arrange
    const { getPage } = configurePdf(75);

    // Act
    const result = await extractDocumentText(pdfFile());

    // Assert
    expect(result.status).toBe("truncated");
    expect(result).toMatchObject({ totalPages: 75, pagesProcessed: 50 });
    expect(result.limitations).toContain("pageLimit");
    expect(getPage).toHaveBeenCalledTimes(50);
    expect(getPage).not.toHaveBeenCalledWith(51);
    expect(extractionWarningKey(result)).toBe("documentExtractionTruncated");
  });

  it("caps PDF text at 100,000 characters and stops further page parsing", async () => {
    // Arrange
    const { getPage } = configurePdf(10, ["x".repeat(150_000)]);

    // Act
    const result = await extractDocumentText(pdfFile());

    // Assert
    expect(result.text).toHaveLength(DOCUMENT_EXTRACTION_LIMITS.maxCharacters);
    expect(result.status).toBe("truncated");
    expect(result.limitations).toContain("characterLimit");
    expect(getPage).toHaveBeenCalledTimes(1);
  });

  it("reports scanned PDFs as empty without fabricating image evidence", async () => {
    // Arrange
    configurePdf(3, [""]);

    // Act
    const result = await extractDocumentText(pdfFile());

    // Assert
    expect(result).toMatchObject({ text: "", status: "empty", limitations: ["ocrUnavailable"] });
    expect(extractionWarningKey(result)).toBe("documentExtractionEmpty");
  });

  it("extracts DOCX raw text, not HTML or editable draft content", async () => {
    // Arrange
    const file = new File(["docx"], "procedure.docx");

    // Act
    const result = await extractDocumentText(file);

    // Assert
    expect(result).toMatchObject({ sourceFileName: "procedure.docx", text: "DOCX policy text", status: "extracted", totalPages: null });
    expect(extractRawText).toHaveBeenCalledWith({ arrayBuffer: expect.any(ArrayBuffer) });
    expect(result).not.toHaveProperty("content");
    expect(result).not.toHaveProperty("approvedBy");
    expect(extractionWarningKey(result)).toBe("documentExtractionNoOcr");
  });

  it("truncates oversized DOCX extracted text and records the character limit", async () => {
    // Arrange
    jest.mocked(extractRawText).mockResolvedValue({ value: "x".repeat(100_001), messages: [] });

    // Act
    const result = await extractDocumentText(new File(["docx"], "policy.docx"));

    // Assert
    expect(result.text).toHaveLength(100_000);
    expect(result.status).toBe("truncated");
    expect(result.limitations).toContain("characterLimit");
  });

  it("extracts bounded UTF-8 text files from the supplied file only", async () => {
    // Arrange
    const file = new File(["text"], "notes.txt", { type: "text/plain" });
    jest.mocked(readFileAsArrayBuffer).mockResolvedValue(new TextEncoder().encode("نص Policy").buffer as ArrayBuffer);

    // Act
    const result = await extractDocumentText(file);

    // Assert
    expect(readFileAsArrayBuffer).toHaveBeenCalledWith(file);
    expect(result).toMatchObject({ text: "نص Policy", status: "extracted", limitations: [] });
    expect(extractionWarningKey(result)).toBeNull();
    expect(getDocument).not.toHaveBeenCalled();
    expect(extractRawText).not.toHaveBeenCalled();
  });

  it("rejects attachments over 10 MB before reading or parsing them", async () => {
    // Arrange
    const file = pdfFile();
    Object.defineProperty(file, "size", { value: DOCUMENT_EXTRACTION_LIMITS.maxBytes + 1 });

    // Act
    const result = await extractDocumentText(file);

    // Assert
    expect(result).toMatchObject({ status: "failed", text: "", limitations: ["sizeLimit"] });
    expect(readFileAsArrayBuffer).not.toHaveBeenCalled();
    expect(getDocument).not.toHaveBeenCalled();
    expect(extractionWarningKey(result)).toBe("documentExtractionSizeLimit");
  });

  it.each(["scan.png", "legacy.doc", "unknown.zip"])("does not fabricate text for unsupported file %s", async (name) => {
    // Arrange
    const file = new File(["data"], name);

    // Act
    const result = await extractDocumentText(file);

    // Assert
    expect(result).toMatchObject({ status: "unsupported", text: "" });
    expect(readFileAsArrayBuffer).not.toHaveBeenCalled();
    expect(extractionWarningKey(result)).toBe("documentExtractionUnsupported");
  });

  it("clears partial output and reports failure if a later PDF page cannot be parsed", async () => {
    // Arrange
    const { getPage, destroy } = configurePdf(2);
    getPage.mockImplementationOnce(async () => ({
      getTextContent: jest.fn(async () => ({ items: [{ str: "Partial private text", hasEOL: true }, { type: "beginMarkedContent" }] })),
      cleanup: jest.fn(),
    })).mockRejectedValueOnce(new Error("Password protected"));

    // Act
    const result = await extractDocumentText(pdfFile());

    // Assert
    expect(result).toMatchObject({ text: "", status: "failed" });
    expect(result.limitations).toContain("parseFailed");
    expect(destroy).toHaveBeenCalled();
    expect(extractionWarningKey(result)).toBe("documentExtractionFailed");
  });

  it("reports DOCX parser failures explicitly", async () => {
    // Arrange
    jest.mocked(extractRawText).mockRejectedValue(new Error("Corrupt zip"));

    // Act
    const result = await extractDocumentText(new File(["docx"], "broken.docx"));

    // Assert
    expect(result).toMatchObject({ status: "failed", text: "", limitations: ["parseFailed"] });
    expect(extractionWarningKey(result)).toBe("documentExtractionFailed");
  });

  it("rejects parser-reported DOCX errors instead of treating partial text as evidence", async () => {
    // Arrange
    jest.mocked(extractRawText).mockResolvedValue({ value: "Partial text", messages: [{ type: "error", message: "Broken document" }] });

    // Act
    const result = await extractDocumentText(new File(["docx"], "broken.docx"));

    // Assert
    expect(result).toMatchObject({ status: "failed", text: "" });
    expect(result.limitations).toContain("parseFailed");
  });

  it("localizes all extraction warnings and disclaims image-based clinical claims", () => {
    // Arrange
    const keys = Object.keys(en).filter((key) => key.startsWith("documentExtraction")) as (keyof typeof en)[];

    // Act / Assert
    keys.forEach((key) => {
      expect(en[key]).toBeTruthy();
      expect(ar[key as keyof typeof ar]).toBeTruthy();
    });
    expect(en.documentExtractionUnsupported).toContain("no clinical findings");
    expect(ar.documentExtractionUnsupported).toContain("لم تُستنتج نتائج سريرية");
    expect(en.documentExtractionNotice).toContain("does not approve");
  });
});

import { parseDocumentAnalysis } from "@/utils/aiDocumentAnalysis";
import { aiDocumentToHtml, documentDownload } from "@/utils/aiDocumentFormat";
import { aiAgentService } from "@/services/aiAgentService";
import { AIDocumentGeneratorService } from "@/services/aiDocumentGeneratorService";

jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { chat: jest.fn() },
}));
jest.mock("@/data/templateLibrary", () => ({
  templateLibrary: [{ id: "policy", name: "Policy", description: "Policy", sections: ["Purpose"] }],
}));
const payload = () => ({
  contentScore: 0, readabilityScore: null, grammarScore: 100, structureScore: 70,
  complianceIssues: [], improvementSuggestions: [],
});

describe("Trustworthy document analysis", () => {
  it("preserves zero and null scores without fabricated defaults", () => {
    // Arrange
    const raw = JSON.stringify(payload());
    // Act
    const result = parseDocumentAnalysis(raw, "Policy");
    // Assert
    expect(result.contentScore).toBe(0);
    expect(result.readabilityScore).toBeNull();
    expect(result.grammarScore).toBe(100);
  });

  it("represents missing metrics as not assessed", () => {
    // Arrange / Act
    const result = parseDocumentAnalysis('{"complianceIssues":[],"improvementSuggestions":[]}', "");
    // Assert
    expect(result.contentScore).toBeNull();
    expect(result.structureScore).toBeNull();
  });

  it.each([-1, 101, "75", false])("rejects invalid score %s", (score) => {
    // Arrange
    const raw = JSON.stringify({ ...payload(), contentScore: score });
    // Act / Assert
    expect(() => parseDocumentAnalysis(raw, "")).toThrow("Invalid AI analysis metric");
  });

  it.each(["", "Score: 75", "[]", "{}", '{"complianceIssues":[],"improvementSuggestions":[42]}'])(
    "rejects malformed or incomplete analysis: %s", (raw) => {
      // Act / Assert
      expect(() => parseDocumentAnalysis(raw, "")).toThrow();
    },
  );

  it("accepts exact Arabic document evidence", () => {
    // Arrange
    const issue = { type: "warning", section: "الهوية", issue: "تحقق", recommendation: "راجع السياسة", evidence: "عينة واحدة" };
    // Act
    const result = parseDocumentAnalysis(JSON.stringify({ ...payload(), complianceIssues: [issue] }), "<p>عينة واحدة</p>");
    // Assert
    expect(result.complianceIssues[0].evidence).toBe("عينة واحدة");
  });

  it("rejects invented evidence", () => {
    // Arrange
    const issue = { type: "warning", section: "Labels", issue: "Missing", recommendation: "Check", evidence: "invented quote" };
    // Act / Assert
    expect(() => parseDocumentAnalysis(JSON.stringify({ ...payload(), complianceIssues: [issue] }), "Real document"))
      .toThrow("unverifiable document evidence");
  });
});

describe("Document formats and service reliability", () => {
  beforeEach(() => jest.resetAllMocks());

  it("downloads using the correct MIME and extension", () => {
    // Assert
    expect(documentDownload.html.extension).toBe("html");
    expect(documentDownload.markdown.extension).toBe("md");
    expect(documentDownload.text.extension).toBe("txt");
    expect(documentDownload.text.mime).toContain("text/plain");
  });

  it("converts Markdown to safe HTML for the document editor", () => {
    // Act
    const html = aiDocumentToHtml("# Policy\n\n**Verify** samples.", "markdown");
    // Assert
    expect(html).toContain("<h1>Policy</h1>");
    expect(html).toContain("<strong>Verify</strong>");
  });

  it("escapes plain text and sanitizes generated HTML", () => {
    // Act / Assert
    expect(aiDocumentToHtml("<script>alert(1)</script>", "text")).toContain("&lt;script&gt;");
    expect(aiDocumentToHtml('<p onclick="alert(1)">Policy</p><script>alert(1)</script>', "html"))
      .toBe("<p>Policy</p>");
  });

  it.each(["markdown", "text", "html"] as const)("honors generation format %s and skips unrequested assessments", async (format) => {
    // Arrange
    const chat = jest.mocked(aiAgentService.chat);
    chat.mockResolvedValueOnce({ response: "- Check labels", thread_id: "", timestamp: "" });
    chat.mockResolvedValueOnce({ response: format === "html" ? "<h2>Policy</h2>" : "Policy body", thread_id: "", timestamp: "" });
    // Act
    const result = await new AIDocumentGeneratorService().generateDocument({ templateId: "policy", context: {}, preferences: { format } });
    // Assert
    expect(result.format).toBe(format);
    expect(result.complianceIssues).toEqual([]);
    expect(chat).toHaveBeenCalledTimes(2);
    if (format !== "html") {
      expect(result.content).not.toContain("<table");
      expect(chat.mock.calls[1][0]).toContain("OUTPUT OVERRIDE");
    }
  });

  it("propagates unavailable analysis rather than success-shaped defaults", async () => {
    // Arrange
    jest.mocked(aiAgentService.chat).mockRejectedValueOnce(new Error("offline"));
    // Act / Assert
    await expect(new AIDocumentGeneratorService().analyzeDocument("Policy")).rejects.toThrow("offline");
  });
});

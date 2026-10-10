import { aiAgentService } from "@/services/aiAgentService";
import { AIDocumentGeneratorService } from "@/services/aiDocumentGeneratorService";

jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { chat: jest.fn() },
}));
jest.mock("@/data/templateLibrary", () => ({
  templateLibrary: [{
    id: "test-policy",
    name: "Laboratory Policy",
    description: "Labeling policy",
    sections: ["Purpose", "Procedure"],
  }],
}));

describe("Document generator output language", () => {
  const service = new AIDocumentGeneratorService();
  const chat = jest.mocked(aiAgentService.chat);

  beforeEach(() => {
    jest.clearAllMocks();
    chat.mockResolvedValue({
      response: "No gaps identified.",
      thread_id: "test",
      timestamp: "2026-10-10",
    });
  });

  it.each(["en", "ar"] as const)("requests and returns %s despite bilingual context", async (language) => {
    // Arrange
    const body = language === "ar"
      ? '<h2>سياسة المختبر</h2><p>يجب التحقق من هوية العينة.</p>'
      : "<h2>Laboratory Policy</h2><p>Verify specimen identity.</p>";
    chat.mockResolvedValueOnce({ response: "- Verify labels", thread_id: "test", timestamp: "" });
    chat.mockResolvedValueOnce({ response: body, thread_id: "test", timestamp: "" });

    // Act
    const result = await service.generateDocument({
      templateId: "test-policy", language,
      context: { existingContent: "المختبر Laboratory" },
    });

    // Assert
    const languageName = language === "ar" ? "Arabic" : "English";
    expect(chat.mock.calls[0][0]).toContain(`list of suggestions in ${languageName}`);
    expect(chat.mock.calls[1][0]).toContain(`HTML content in ${languageName}`);
    expect(result.language).toBe(language);
    expect(result.content).toContain(body);
    expect(result.content).toContain(`dir="${language === "ar" ? "rtl" : "ltr"}"`);
    expect(result.content).toContain(language === "ar" ? "عنوان الوثيقة" : "Document Title");
  });

  it("defaults legacy callers to English", async () => {
    // Arrange
    chat.mockResolvedValueOnce({ response: "- Check labels", thread_id: "", timestamp: "" });
    chat.mockResolvedValueOnce({ response: "<h2>Policy</h2>", thread_id: "", timestamp: "" });

    // Act
    const result = await service.generateDocument({ templateId: "test-policy", context: {} });

    // Assert
    expect(result.language).toBe("en");
    expect(chat.mock.calls[1][0]).toContain("HTML content in English");
  });

  it("removes a model-generated Arabic SOP header before adding the canonical header", async () => {
    // Arrange
    chat.mockResolvedValueOnce({ response: "- Verify", thread_id: "", timestamp: "" });
    chat.mockResolvedValueOnce({
      response: "<table><tr><td>عنوان الوثيقة</td><td>رمز الوثيقة</td><td>تاريخ الإصدار</td></tr></table><h2>السياسة</h2>",
      thread_id: "", timestamp: "",
    });

    // Act
    const result = await service.generateDocument({ templateId: "test-policy", language: "ar", context: {} });

    // Assert
    expect(result.content.match(/<table\b/g)).toHaveLength(1);
    expect(result.content).toContain("عنوان الوثيقة: السياسة");
  });

  it("preserves selected Arabic language during improvements", async () => {
    // Arrange
    chat.mockResolvedValueOnce({ response: "<p>محتوى محسّن</p>", thread_id: "", timestamp: "" });
    chat.mockResolvedValueOnce({
      response: '{"readabilityScore":80,"grammarIssues":0,"clarityScore":80,"professionalismScore":80}',
      thread_id: "", timestamp: "",
    });

    // Act
    const result = await service.improveContent({
      content: "<p>محتوى</p>", language: "ar", suggestions: { fixGrammar: true },
    });

    // Assert
    expect(chat.mock.calls[0][0]).toContain("Write all content in Arabic");
    expect(result.improvedContent).toBe("<p>محتوى محسّن</p>");
  });

  it("does not silently succeed when generation is empty", async () => {
    // Arrange
    chat.mockResolvedValueOnce({ response: "- Check labels", thread_id: "", timestamp: "" });
    chat.mockResolvedValueOnce({ response: "", thread_id: "", timestamp: "" });
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);

    // Act / Assert
    try {
      await expect(service.generateDocument({ templateId: "test-policy", context: {} }))
        .rejects.toThrow("Failed to generate document");
      expect(chat).toHaveBeenCalledTimes(2);
    } finally {
      errorLog.mockRestore();
    }
  });
});

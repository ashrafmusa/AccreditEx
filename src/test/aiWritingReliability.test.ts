import { aiWritingService } from "@/services/aiWritingService";
import { aiAgentService } from "@/services/aiAgentService";

jest.mock("@/services/aiAgentService", () => ({ aiAgentService: { chat: jest.fn() } }));

describe("Grounded AI writing reliability", () => {
  beforeEach(() => jest.resetAllMocks());

  it("propagates provider errors instead of returning the original text as a successful edit", async () => {
    // Arrange
    jest.mocked(aiAgentService.chat).mockRejectedValueOnce(new Error("provider unavailable"));
    // Act / Assert
    await expect(aiWritingService.improveWriting("Original draft")).rejects.toThrow("provider unavailable");
  });

  it("rejects empty generated content explicitly", async () => {
    // Arrange
    jest.mocked(aiAgentService.chat).mockResolvedValueOnce({ response: "", thread_id: "", timestamp: "" });
    // Act / Assert
    await expect(aiWritingService.generateContent("Policy")).rejects.toThrow("empty generated response");
  });

  it("requires source-backed references instead of fabricating compliance identifiers", async () => {
    // Arrange
    const chat = jest.mocked(aiAgentService.chat);
    chat.mockResolvedValueOnce({ response: "<p>Review against supplied requirements.</p>", thread_id: "", timestamp: "" });
    // Act
    await aiWritingService.processText({ command: "add_compliance", text: "Policy" });
    // Assert
    expect(chat.mock.calls[0][0]).toContain("never invent identifiers");
    expect(chat.mock.calls[0][0]).not.toContain("CBAHI ESR-12");
  });
});

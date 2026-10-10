import { aiResponseToPlainText, cleanAIText, normalizeAIResponse } from "@/utils/aiResponse";

const actionBlock =
  "```accreditex-action\n" +
  '{"type":"create_capa","title":"Specimen labeling errors","description":"Audit finding","rootCause":"No double check","correctiveAction":"Introduce two-identifier check","priority":"high"}' +
  "\n```";

describe("aiResponse normalizer", () => {
  it("reads a legacy workflow field and builds summary + sections", () => {
    // Arrange
    const payload = {
      status: "completed",
      action_plan:
        "The lab has two open gaps that need owners.\n\n## Findings\n- Gap A\n\n## Recommended Actions\n1. Assign owner",
    };

    // Act
    const res = normalizeAIResponse(payload, { field: "action_plan", source: "dedicated" });

    // Assert
    expect(res.status).toBe("completed");
    expect(res.summary).toBe("The lab has two open gaps that need owners.");
    expect(res.sections.map((s) => s.heading)).toEqual(["", "Findings", "Recommended Actions"]);
    expect(res.source).toBe("dedicated");
  });

  it("unescapes literal \\n sequences", () => {
    // Arrange
    const raw = "Line one\\nLine two\\nLine three";

    // Act
    const text = cleanAIText(raw);

    // Assert
    expect(text).toBe("Line one\nLine two\nLine three");
  });

  it("unwraps JSON summary_text payloads", () => {
    // Arrange
    const raw = '```json\n{"summary_text":"## Findings\\nAll good","score":90}\n```';

    // Act
    const res = normalizeAIResponse(raw);

    // Assert
    expect(res.contentMarkdown).toBe("## Findings\nAll good");
    expect(res.source).toBe("chat");
  });

  it("extracts action blocks out of the markdown", () => {
    // Arrange
    const raw = `I drafted a CAPA for you.\n\n${actionBlock}`;

    // Act
    const res = normalizeAIResponse(raw);

    // Assert
    expect(res.actions).toHaveLength(1);
    expect(res.actions[0].type).toBe("create_capa");
    expect(res.contentMarkdown).not.toContain("accreditex-action");
  });

  it("maps an ai-response/1 payload including backend actions and confidence", () => {
    // Arrange
    const payload = {
      status: "completed",
      type: "risk_assessment",
      title: "Risk Assessment",
      summary: "Medium overall risk.",
      content_markdown: "Medium overall risk.\n\n## Findings\n- Fire drills overdue",
      actions: [{ type: "create_risk", title: "Fire drills overdue", description: "d", likelihood: 3, impact: 4 }],
      confidence: 0.82,
      model: "llama-3.3-70b",
      meta: { schema_version: "ai-response/1" },
    };

    // Act
    const res = normalizeAIResponse(payload);

    // Assert
    expect(res.type).toBe("risk_assessment");
    expect(res.title).toBe("Risk Assessment");
    expect(res.summary).toBe("Medium overall risk.");
    expect(res.actions).toHaveLength(1);
    expect(res.confidence).toBeCloseTo(0.82);
    expect(res.model).toBe("llama-3.3-70b");
  });

  it("marks chat fallback responses and empty content", () => {
    // Arrange
    const payload = { status: "completed", analysis: "", meta: { route_mode: "chat_fallback" } };

    // Act
    const res = normalizeAIResponse(payload, { field: "analysis" });

    // Assert
    expect(res.status).toBe("empty");
    expect(res.source).toBe("fallback");
    expect(res.confidence).toBeNull();
  });

  it("produces plain text without markdown syntax", () => {
    // Arrange
    const md = "## Title\n**Bold** and `code`";

    // Act
    const text = aiResponseToPlainText(md);

    // Assert
    expect(text).toBe("Title\nBold and code");
  });
});

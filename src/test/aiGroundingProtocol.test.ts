import { parseAIGrounding } from "@/utils/aiGrounding";
import { normalizeAIResponse } from "@/utils/aiResponse";

const evidence = () => ({
  schema: "ai-grounding/1", organizationId: "org-a",
  sources: [{
    ref: "document:policy@v2", kind: "document", id: "policy", organizationId: "org-a",
    title: "Policy", status: "Draft", version: 2, excerpt: "Database text.",
    excerptTruncated: false, links: [],
  }],
  coverage: { available: 1, selected: 1, omitted: 0, limitations: ["Not certified."] },
});

it("preserves server evidence through workflow normalization", () => {
  // Arrange
  const grounding = evidence();
  // Act
  const result = normalizeAIResponse({ response: "Review.", grounding });
  // Assert
  expect(result.grounding).toEqual(grounding);
});

it("rejects server evidence from a different organization", () => {
  // Act / Assert
  expect(() => parseAIGrounding(evidence(), "org-b")).toThrow("Invalid AI evidence provenance");
});

it.each(["count", "scope", "ref", "excerpt", "links", "version"])("rejects malformed evidence %s", failure => {
  // Arrange
  const value = evidence();
  if (failure === "count") value.coverage.selected = 0;
  if (failure === "scope") value.sources[0].organizationId = "org-b";
  if (failure === "ref") value.sources[0].ref = "bad\nref";
  if (failure === "excerpt") value.sources[0].excerpt = "x".repeat(651);
  const raw: unknown = failure === "links"
    ? { ...value, sources: [{ ...value.sources[0], links: [{ relation: 4, target: "document:p" }] }] }
    : failure === "version" ? { ...value, sources: [{ ...value.sources[0], version: NaN }] } : value;
  // Act / Assert
  expect(() => parseAIGrounding(raw)).toThrow("Invalid AI evidence provenance");
});

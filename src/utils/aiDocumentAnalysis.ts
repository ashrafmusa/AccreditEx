export interface DocumentAnalysis {
  contentScore: number | null;
  readabilityScore: number | null;
  grammarScore: number | null;
  structureScore: number | null;
  complianceIssues: {
    type: "error" | "warning" | "info";
    section: string;
    issue: string;
    recommendation: string;
    evidence: string;
  }[];
  improvementSuggestions: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function documentEvidencePassages(document: string): string[] {
  return document.split(/<[^>]*>|\r?\n/).map(part => part.trim()).filter(Boolean);
}

export function parseDocumentAnalysis(raw: string, document: string, indexedEvidence = false): DocumentAnalysis {
  const passages = indexedEvidence ? documentEvidencePassages(document) : [];
  let payload: unknown;
  try {
    payload = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    throw new Error("AI analysis is not valid JSON");
  }
  if (!isRecord(payload)) throw new Error("AI analysis must be an object");
  const score = (key: string): number | null => {
    const value = payload[key];
    if (value === undefined || value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Invalid AI analysis metric: ${key}`);
    }
    return value;
  };
  if (!Array.isArray(payload.complianceIssues) || !Array.isArray(payload.improvementSuggestions)) {
    throw new Error("AI analysis is missing findings or recommendations");
  }
  const text = (value: unknown): value is string => typeof value === "string" && !!value.trim();
  const complianceIssues = payload.complianceIssues.map((item): DocumentAnalysis["complianceIssues"][number] => {
    if (!isRecord(item)) throw new Error("AI finding has invalid or unverifiable document evidence");
    let evidence = item.evidence;
    if (indexedEvidence) {
      if (typeof item.evidenceId !== "number" || !Number.isInteger(item.evidenceId) ||
        item.evidenceId < 1 || item.evidenceId > passages.length) {
        throw new Error("AI finding has invalid or unverifiable document evidence");
      }
      evidence = passages[item.evidenceId - 1];
    }
    if ((item.type !== "error" && item.type !== "warning" && item.type !== "info") ||
      !text(item.section) || !text(item.issue) || !text(item.recommendation) ||
      !text(evidence) || !document.includes(evidence)) {
      throw new Error("AI finding has invalid or unverifiable document evidence");
    }
    return {
      type: item.type, section: item.section, issue: item.issue,
      recommendation: item.recommendation, evidence,
    };
  });
  if (!payload.improvementSuggestions.every(text)) throw new Error("Invalid AI recommendations");
  return {
    contentScore: score("contentScore"), readabilityScore: score("readabilityScore"),
    grammarScore: score("grammarScore"), structureScore: score("structureScore"),
    complianceIssues, improvementSuggestions: payload.improvementSuggestions,
  };
}

import type { AIGrounding } from "@/services/aiGroundingService";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length <= max;

function validateAIGrounding(value: unknown, organizationId?: string): asserts value is AIGrounding {
  const invalid = () => new Error("Invalid AI evidence provenance. Please retry.");
  if (!record(value) || value.schema !== "ai-grounding/1" ||
    !text(value.organizationId, 500) ||
    (organizationId !== undefined && value.organizationId !== organizationId) ||
    !Array.isArray(value.sources) || value.sources.length > 7 || !record(value.coverage)) throw invalid();
  const refs = new Set<string>();
  for (const source of value.sources) {
    if (!record(source) || !text(source.ref, 500) || !source.ref.trim() ||
      /[\[\]\r\n]/.test(source.ref) || refs.has(source.ref) ||
      !text(source.kind, 100) || !text(source.id, 500) || !text(source.title, 500) ||
      source.organizationId !== value.organizationId || !text(source.excerpt, 650) ||
      typeof source.excerptTruncated !== "boolean" || !Array.isArray(source.links) ||
      source.links.length > 8 ||
      (source.status !== undefined && !text(source.status, 100)) ||
      (source.version !== undefined && !text(source.version, 100) &&
        !(typeof source.version === "number" && Number.isFinite(source.version)))) throw invalid();
    refs.add(source.ref);
    if (source.links.some(link => !record(link) || !text(link.relation, 100) || !text(link.target, 200))) throw invalid();
  }
  const coverage = value.coverage;
  if (!Number.isInteger(coverage.available) || !Number.isInteger(coverage.selected) ||
    !Number.isInteger(coverage.omitted) || typeof coverage.available !== "number" ||
    typeof coverage.selected !== "number" || typeof coverage.omitted !== "number" ||
    coverage.omitted < 0 || coverage.selected !== value.sources.length ||
    coverage.available !== coverage.selected + coverage.omitted ||
    !Array.isArray(coverage.limitations) || coverage.limitations.length > 30 ||
    coverage.limitations.some(limit => !text(limit, 1000))) throw invalid();
}

export function parseAIGrounding(value: unknown, organizationId?: string): AIGrounding {
  validateAIGrounding(value, organizationId);
  return value;
}

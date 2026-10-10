import type {
  AIResponse,
  AIResponseSection,
  AIResponseSource,
  AIResponseType,
} from "@/types/aiResponse";
import { extractActions, type AIAction } from "@/utils/aiActions";
import { parseAIGrounding } from "@/utils/aiGrounding";

/** Fields that older endpoints / clients used to carry the AI text. */
const CONTENT_FIELDS = [
  "content_markdown",
  "contentMarkdown",
  "action_plan",
  "root_cause_analysis",
  "pdca_improvements",
  "survey_risk_assessment",
  "design_compliance_assessment",
  "analysis",
  "assessment",
  "recommendations",
  "summary_text",
  "response",
  "content",
  "text",
] as const;

const JSON_NARRATIVE_FIELDS = ["summary_text", "summary", "response", "content", "analysis"];
const HEADING = /^\s{0,3}#{1,4}\s+(.+?)\s*#*\s*$/;
const BOLD_HEADING = /^\s*(?:\d+\.\s*)?\*\*([^*]{2,80})\*\*:?\s*$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Pull the narrative out of JSON payloads like {"summary_text": "..."}. */
const unwrapJson = (text: string): string => {
  let candidate = text.trim();
  const fenced = candidate.match(/^`{1,3}(?:json)?\s*([\s\S]*?)\s*`{1,3}$/i);
  if (fenced) candidate = fenced[1].trim();
  if (!candidate.startsWith("{")) return text;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    try {
      parsed = JSON.parse(candidate.replace(/\r?\n/g, "\\n"));
    } catch {
      return text;
    }
  }
  if (!isRecord(parsed)) return text;
  for (const key of JSON_NARRATIVE_FIELDS) {
    const value = parsed[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return text;
};

/** Normalise raw model text: escaped newlines, whole-answer code fences, JSON wrappers. */
export function cleanAIText(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let text = typeof raw === "string" ? raw : JSON.stringify(raw);
  text = unwrapJson(text.trim());
  const escaped = (text.match(/\\n/g) || []).length;
  const real = (text.match(/\n/g) || []).length;
  if (escaped > real) text = text.replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "  ");
  const wholeFence = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (wholeFence) text = wholeFence[1];
  return text.trim();
}

export function parseSections(markdown: string): AIResponseSection[] {
  const sections: AIResponseSection[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    const body = buffer.join("\n").trim();
    if (heading !== null || body) sections.push({ heading: heading ?? "", body });
  };
  for (const line of markdown.split("\n")) {
    const m = line.match(HEADING) || line.match(BOLD_HEADING);
    if (m) {
      flush();
      heading = m[1].trim().replace(/:$/, "");
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections.filter((s) => s.heading || s.body);
}

export function extractSummary(markdown: string, maxChars = 320): string {
  for (const block of markdown.split(/\n\s*\n/)) {
    const lines = block
      .split("\n")
      .filter((l) => l.trim() && !HEADING.test(l) && !BOLD_HEADING.test(l));
    if (!lines.length || lines[0].trim().startsWith("|")) continue;
    const candidate = lines
      .slice(0, 3)
      .map((l) => l.replace(/^[\s>*\-\d.]+/, "").trim())
      .join(" ")
      .replace(/[*_`#]/g, "")
      .trim();
    if (candidate.length < 12) continue;
    if (candidate.length <= maxChars) return candidate;
    const cut = candidate.slice(0, maxChars - 1);
    return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`;
  }
  return "";
}

const pickContent = (raw: Record<string, unknown>, preferred?: string): unknown => {
  if (preferred && typeof raw[preferred] === "string" && raw[preferred]) return raw[preferred];
  for (const field of CONTENT_FIELDS) {
    const value = raw[field];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
};

const toConfidence = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(1, Math.max(0, n > 1 ? n / 100 : n));
};

export interface NormalizeOptions {
  type?: AIResponseType;
  title?: string;
  source?: AIResponseSource;
  /** Legacy field to prefer when reading the content (e.g. "action_plan"). */
  field?: string;
}

/**
 * Convert any AI payload (string, legacy workflow JSON, ai-response/1 JSON,
 * specialist JSON) into the standard AIResponse used by AIResponseView.
 */
export function normalizeAIResponse(raw: unknown, options: NormalizeOptions = {}): AIResponse {
  const record = isRecord(raw) ? raw : {};
  const meta = isRecord(record.meta) ? record.meta : {};
  const rawText = isRecord(raw) ? pickContent(record, options.field) : raw;

  const cleaned = cleanAIText(rawText);
  const { text, actions: parsedActions } = extractActions(cleaned);
  const backendActions = Array.isArray(record.actions)
    ? (record.actions as unknown[])
        .map((a) => extractActions(`\`\`\`accreditex-action\n${JSON.stringify(a)}\n\`\`\``).actions[0])
        .filter((a): a is AIAction => !!a)
    : [];
  const actions = [...parsedActions, ...backendActions].slice(0, 3);
  const markdown = text.trim();

  const sections = Array.isArray(record.sections) && record.sections.length
    ? (record.sections as unknown[]).filter(isRecord).map((s) => ({
        heading: String(s.heading ?? ""),
        body: String(s.body ?? ""),
      }))
    : parseSections(markdown);

  const metaSource = meta.source === "fallback" || meta.route_mode === "chat_fallback" ? "fallback" : undefined;
  const source: AIResponseSource = options.source ?? metaSource ?? (isRecord(raw) ? "dedicated" : "chat");

  return {
    status: record.status === "error" ? "error" : markdown ? "completed" : "empty",
    type: options.type ?? (typeof record.type === "string" ? record.type : "chat"),
    title: options.title ?? (typeof record.title === "string" ? record.title : ""),
    summary: typeof record.summary === "string" && record.summary ? record.summary : extractSummary(markdown),
    contentMarkdown: markdown,
    sections,
    actions,
    confidence: toConfidence(record.confidence ?? meta.quality_confidence),
    grounded: record.grounded === true,
    grounding: record.grounding === undefined ? undefined : parseAIGrounding(record.grounding),
    model: typeof record.model === "string" ? record.model : typeof meta.model === "string" ? meta.model : "",
    generatedAt:
      (typeof record.generated_at === "string" && record.generated_at) ||
      (typeof record.timestamp === "string" && record.timestamp) ||
      new Date().toISOString(),
    source,
  };
}

/** Plain-text version for copying / saving into form fields. */
export function aiResponseToPlainText(response: AIResponse | string): string {
  const md = typeof response === "string" ? cleanAIText(response) : response.contentMarkdown;
  return md
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export interface CreateRiskAction {
  type: "create_risk";
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  mitigationPlan: string;
  category?: string;
}

export type AIAction = CreateRiskAction;

const ACTION_BLOCK = /`{1,3}accreditex-action\s*([\s\S]*?)`{1,3}/g;
const MAX_TEXT = 2000;

const clampScore = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
};

const cleanText = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : "";

/** Validate an untrusted AI payload; returns null if it is not a well-formed action. */
export function validateAction(raw: unknown): AIAction | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === "create_risk") {
    const title = cleanText(obj.title);
    const likelihood = clampScore(obj.likelihood);
    const impact = clampScore(obj.impact);
    if (!title || likelihood === null || impact === null) return null;
    const category = cleanText(obj.category);
    return {
      type: "create_risk",
      title,
      description: cleanText(obj.description),
      likelihood,
      impact,
      mitigationPlan: cleanText(obj.mitigationPlan),
      ...(category ? { category } : {}),
    };
  }
  return null;
}

const parseLenient = (body: string): unknown => {
  const trimmed = body.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Models often emit raw line breaks inside string values
    try {
      return JSON.parse(trimmed.replace(/\r?\n/g, "\\n"));
    } catch {
      const str = (key: string) =>
        trimmed.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,\\s*"|\\}\\s*$)`))?.[1];
      const num = (key: string) =>
        trimmed.match(new RegExp(`"${key}"\\s*:\\s*"?(\\d+)`))?.[1];
      const unescape = (s?: string) =>
        s?.replace(/\\\\n|\\n/g, "\n").replace(/\\"/g, '"');
      return {
        type: trimmed.match(/"type"\s*:\s*"([^"]+)"/)?.[1],
        title: unescape(str("title")),
        description: unescape(str("description")),
        likelihood: num("likelihood"),
        impact: num("impact"),
        mitigationPlan: unescape(str("mitigationPlan")),
      };
    }
  }
};

/** Split an AI reply into display text and validated proposed actions. */
export function extractActions(content: string): {
  text: string;
  actions: AIAction[];
} {
  const actions: AIAction[] = [];
  const text = content
    .replace(ACTION_BLOCK, (_match, body: string) => {
      const action = validateAction(parseLenient(body));
      if (action && actions.length < 3) actions.push(action);
      return "";
    })
    .trim();
  return { text, actions };
}

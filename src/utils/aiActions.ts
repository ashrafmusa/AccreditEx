export interface CreateRiskAction {
  type: "create_risk";
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  mitigationPlan: string;
  category?: string;
}

export interface CreateCapaAction {
  type: "create_capa";
  title: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  projectName?: string;
  dueInDays: number;
}

export type AIAction = CreateRiskAction | CreateCapaAction;

const ACTION_BLOCK = /`{1,3}accreditex-action\s*(\{[\s\S]*?\})\s*`{1,3}/g;
const MAX_TEXT = 2000;

const clampScore = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
};

const cleanText = (value: unknown): string =>
  typeof value === "string"
    ? value
        .replace(/\\r\\n|\\n|\\r/g, "\n")
        .replace(/\\t/g, " ")
        .trim()
        .slice(0, MAX_TEXT)
    : "";

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
  if (obj.type === "create_capa") {
    const title = cleanText(obj.title);
    const correctiveAction = cleanText(obj.correctiveAction);
    if (!title || !correctiveAction) return null;
    const days = Number(obj.dueInDays);
    const projectName = cleanText(obj.projectName);
    return {
      type: "create_capa",
      title,
      rootCause: cleanText(obj.rootCause),
      correctiveAction,
      preventiveAction: cleanText(obj.preventiveAction),
      dueInDays: Number.isFinite(days) ? Math.min(365, Math.max(1, Math.round(days))) : 30,
      ...(projectName ? { projectName } : {}),
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
      const fields = [
        "title",
        "description",
        "mitigationPlan",
        "rootCause",
        "correctiveAction",
        "preventiveAction",
        "projectName",
      ];
      const out: Record<string, unknown> = {
        type: trimmed.match(/"type"\s*:\s*"([^"]+)"/)?.[1],
        likelihood: num("likelihood"),
        impact: num("impact"),
        dueInDays: num("dueInDays"),
      };
      for (const f of fields) out[f] = unescape(str(f));
      return out;
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

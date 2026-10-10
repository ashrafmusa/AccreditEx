import type { AIAction } from "@/utils/aiActions";

/** Standard AI response contract (mirrors backend `ai-response/1`). */
export type AIResponseType =
  | "chat"
  | "action_plan"
  | "root_cause_analysis"
  | "pdca_improvements"
  | "survey_risk_assessment"
  | "design_compliance_assessment"
  | "compliance_check"
  | "risk_assessment"
  | "training_recommendations"
  | "briefing"
  | "analysis"
  | "document"
  | (string & {});

export type AIResponseSource = "dedicated" | "fallback" | "chat";

export interface AIResponseSection {
  heading: string;
  body: string;
}

export interface AIResponse {
  status: "completed" | "empty" | "error";
  type: AIResponseType;
  title: string;
  summary: string;
  contentMarkdown: string;
  sections: AIResponseSection[];
  actions: AIAction[];
  /** 0..1, or null when unknown */
  confidence: number | null;
  grounded: boolean;
  model: string;
  generatedAt: string;
  source: AIResponseSource;
}

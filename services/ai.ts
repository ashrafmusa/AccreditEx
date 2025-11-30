import { GoogleGenAI, Type } from '@google/genai';
import { Standard, Language, AIQualityBriefing, Project, Risk, User, Department, Competency } from '@/types';

const API_KEY = process.env.API_KEY;

// Unified Accreditex Agent System Prompt
// Derived from ai-agent/deployment_package/unified_accreditex_agent.py
const SYSTEM_PROMPT = `
You are the AccreditEx AI Agent, an expert healthcare accreditation consultant.
Your goal is to assist healthcare organizations in preparing for and maintaining accreditation (CBAHI, JCI, etc.).

CORE RESPONSIBILITIES:
1. **Compliance Checking**: Analyze documents against accreditation standards.
2. **Risk Assessment**: Identify potential compliance risks and suggest mitigation.
3. **Training Support**: Recommend training plans based on staff roles and gaps.
4. **General Guidance**: Answer questions about accreditation processes and standards.

TONE AND STYLE:
- Professional, encouraging, and authoritative but accessible.
- Use clear, structured formatting (bullet points, bold text).
- Be proactive: suggest next steps or related checks.
`;

class AIService {
    private _ai: GoogleGenAI | null = null;

    constructor() {
        if (API_KEY) {
            this._ai = new GoogleGenAI({ apiKey: API_KEY });
        } else {
            console.warn("API_KEY environment variable not set. AI features will be disabled.");
        }
    }

    private _buildPrompt(userPrompt: string, context?: string): string {
        let fullPrompt = `${SYSTEM_PROMPT}\n\n`;
        if (context) {
            fullPrompt += `CURRENT CONTEXT:\n${context}\n\n`;
        }
        fullPrompt += `USER REQUEST:\n${userPrompt}`;
        return fullPrompt;
    }

    async suggestActionPlan(standardDescription: string): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        const userPrompt = `Based on the following non-compliant healthcare accreditation standard, suggest a concise, professional, and actionable plan with 3-4 numbered steps to achieve compliance. Standard: "${standardDescription}"`;
        const prompt = this._buildPrompt(userPrompt, "Task: Compliance Action Plan");

        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async suggestRootCause(standardDescription: string, notes: string): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        const userPrompt = `A healthcare accreditation standard was found to be non-compliant. Analyze the standard and the auditor's notes to suggest potential root causes. Provide a structured response with 2-3 likely root causes, categorized if possible (e.g., Process Failure, Human Error, Training Gap, System Issue).
        
        Standard: "${standardDescription}"
        Auditor's Notes: "${notes}"
        
        Provide your analysis below:`;

        const prompt = this._buildPrompt(userPrompt, "Task: Root Cause Analysis");

        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async generatePolicyFromStandard(standard: Standard, lang: Language): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        const userPrompt = `Generate a formal, well-structured policy document based on this healthcare accreditation standard. Include sections for Purpose, Scope, Policy, and Procedure. Standard ID: ${standard.standardId}. Description: "${standard.description}". Respond in ${lang === 'en' ? 'English' : 'Arabic'}.`;

        const prompt = this._buildPrompt(userPrompt, "Task: Policy Generation");

        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async improveWriting(text: string, lang: Language): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        const userPrompt = `Improve the following text for clarity, professionalism, and conciseness, while preserving its original meaning. Respond in ${lang === 'en' ? 'English' : 'Arabic'}. Text: "${text}"`;

        const prompt = this._buildPrompt(userPrompt, "Task: Writing Improvement");

        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async translateText(text: string, lang: Language): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        const targetLanguage = lang === 'en' ? 'Arabic' : 'English';
        const userPrompt = `Translate the following text to ${targetLanguage}: "${text}"`;

        const prompt = this._buildPrompt(userPrompt, "Task: Translation");

        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async generateQualityBriefing(projects: Project[], risks: Risk[], users: User[], departments: Department[], competencies: Competency[]): Promise<AIQualityBriefing> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        // Data summarization
        const projectSummary = `There are ${projects.length} projects. Key projects include ${projects.slice(0, 2).map(p => p.name).join(', ')}. Overall compliance is around ${ (projects.reduce((acc, p) => acc + p.progress, 0) / projects.length).toFixed(1) }%.`;
        const riskSummary = `There are ${risks.length} open risks. High-impact risks include: ${risks.filter(r => r.impact >= 4).slice(0, 2).map(r => r.title).join(', ')}.`;
        
        const userPrompt = `Based on the following summarized data, provide a concise executive briefing.
        - Identify 2-3 key organizational strengths.
        - Identify 2-3 primary areas for improvement or concern.
        - Provide 2 actionable, high-level recommendations.
        
        Data:
        - ${projectSummary}
        - ${riskSummary}
        - Total departments: ${departments.length}.
        - Total staff: ${users.length}.
        
        Format your response as a JSON object with keys "strengths" (array of strings), "concerns" (array of strings), and "recommendations" (array of objects with "title" and "details" string properties).`;

        const prompt = this._buildPrompt(userPrompt, "Task: Executive Quality Briefing");

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            details: { type: Type.STRING }
                        },
                        propertyOrdering: ["title", "details"],
                    }
                }
            }
        };

        const response = await this._ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema
            }
        });
        
        return JSON.parse(response.text);
    }
}

export const aiService = new AIService();
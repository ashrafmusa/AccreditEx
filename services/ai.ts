import { GoogleGenAI, Type } from '@google/genai';
import { Standard, Language, AIQualityBriefing, Project, Risk, User, Department, Competency } from '@/types';

const API_KEY = process.env.API_KEY;

class AIService {
    private _ai: GoogleGenAI | null = null;

    constructor() {
        if (API_KEY) {
            this._ai = new GoogleGenAI({ apiKey: API_KEY });
        } else {
            console.warn("API_KEY environment variable not set. AI features will be disabled.");
        }
    }

    async suggestActionPlan(standardDescription: string): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");
        const prompt = `Based on the following non-compliant healthcare accreditation standard, suggest a concise, professional, and actionable plan with 3-4 numbered steps to achieve compliance. Standard: "${standardDescription}"`;
        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async suggestRootCause(standardDescription: string, notes: string): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");
        const prompt = `A healthcare accreditation standard was found to be non-compliant. Analyze the standard and the auditor's notes to suggest potential root causes. Provide a structured response with 2-3 likely root causes, categorized if possible (e.g., Process Failure, Human Error, Training Gap, System Issue).
        
        Standard: "${standardDescription}"
        Auditor's Notes: "${notes}"
        
        Provide your analysis below:`;
        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async generatePolicyFromStandard(standard: Standard, lang: Language): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");
        const prompt = `Generate a formal, well-structured policy document based on this healthcare accreditation standard. Include sections for Purpose, Scope, Policy, and Procedure. Standard ID: ${standard.standardId}. Description: "${standard.description}". Respond in ${lang === 'en' ? 'English' : 'Arabic'}.`;
        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async improveWriting(text: string, lang: Language): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");
        const prompt = `Improve the following text for clarity, professionalism, and conciseness, while preserving its original meaning. Respond in ${lang === 'en' ? 'English' : 'Arabic'}. Text: "${text}"`;
        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async translateText(text: string, lang: Language): Promise<string> {
        if (!this._ai) throw new Error("AI Service not initialized.");
        const targetLanguage = lang === 'en' ? 'Arabic' : 'English';
        const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;
        const response = await this._ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }

    async generateQualityBriefing(projects: Project[], risks: Risk[], users: User[], departments: Department[], competencies: Competency[]): Promise<AIQualityBriefing> {
        if (!this._ai) throw new Error("AI Service not initialized.");

        // Data summarization
        const projectSummary = `There are ${projects.length} projects. Key projects include ${projects.slice(0, 2).map(p => p.name).join(', ')}. Overall compliance is around ${ (projects.reduce((acc, p) => acc + p.progress, 0) / projects.length).toFixed(1) }%.`;
        const riskSummary = `There are ${risks.length} open risks. High-impact risks include: ${risks.filter(r => r.impact >= 4).slice(0, 2).map(r => r.title).join(', ')}.`;
        
        const prompt = `You are a healthcare quality management consultant. Based on the following summarized data, provide a concise executive briefing.
        - Identify 2-3 key organizational strengths.
        - Identify 2-3 primary areas for improvement or concern.
        - Provide 2 actionable, high-level recommendations.
        
        Data:
        - ${projectSummary}
        - ${riskSummary}
        - Total departments: ${departments.length}.
        - Total staff: ${users.length}.
        
        Format your response as a JSON object with keys "strengths" (array of strings), "concerns" (array of strings), and "recommendations" (array of objects with "title" and "details" string properties).`;

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
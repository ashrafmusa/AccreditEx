/**
 * AI Service - AccreditEx
 *
 * Routes all AI requests through the AccreditEx AI Agent backend
 * (hosted at https://accreditex.onrender.com) instead of calling
 * third-party APIs directly from the browser.
 *
 * The backend is a FastAPI service with a /chat endpoint that handles
 * all AI tasks via the unified AccreditEx agent.
 */

import { aiAgentService } from '@/services/aiAgentService';
import { Standard, Language, AIQualityBriefing, Project, Risk, User, Department, Competency } from '@/types';

class AIService {
    /**
     * Send a prompt to the AccreditEx AI agent and return the text response.
     */
    private async _ask(prompt: string): Promise<string> {
        const response = await aiAgentService.chat(prompt, true);
        return response.response || '';
    }

    async suggestActionPlan(standardDescription: string): Promise<string> {
        const prompt = `Based on the following non-compliant healthcare accreditation standard, suggest a concise, professional, and actionable plan with 3-4 numbered steps to achieve compliance. Standard: "${standardDescription}"`;
        return this._ask(prompt);
    }

    async suggestRootCause(standardDescription: string, notes: string): Promise<string> {
        const prompt = `A healthcare accreditation standard was found to be non-compliant. Analyze the standard and the auditor's notes to suggest potential root causes. Provide a structured response with 2-3 likely root causes, categorized if possible (e.g., Process Failure, Human Error, Training Gap, System Issue).
        
        Standard: "${standardDescription}"
        Auditor's Notes: "${notes}"
        
        Provide your analysis below:`;
        return this._ask(prompt);
    }

    async generatePolicyFromStandard(standard: Standard, lang: Language): Promise<string> {
        const prompt = `Generate a formal, well-structured policy document based on this healthcare accreditation standard. Include sections for Purpose, Scope, Policy, and Procedure. Standard ID: ${standard.standardId}. Description: "${standard.description}". Respond in ${lang === 'en' ? 'English' : 'Arabic'}.`;
        return this._ask(prompt);
    }

    async improveWriting(text: string, lang: Language): Promise<string> {
        const prompt = `Improve the following text for clarity, professionalism, and conciseness, while preserving its original meaning. Respond in ${lang === 'en' ? 'English' : 'Arabic'}. Text: "${text}"`;
        return this._ask(prompt);
    }

    async translateText(text: string, lang: Language): Promise<string> {
        const targetLanguage = lang === 'en' ? 'Arabic' : 'English';
        const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;
        return this._ask(prompt);
    }

    async generateQualityBriefing(projects: Project[], risks: Risk[], users: User[], departments: Department[], _competencies: Competency[]): Promise<AIQualityBriefing> {
        // Data summarization
        const projectSummary = `There are ${projects.length} projects. Key projects include ${projects.slice(0, 2).map(p => p.name).join(', ')}. Overall compliance is around ${(projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1)).toFixed(1)}%.`;
        const riskSummary = `There are ${risks.length} open risks. High-impact risks include: ${risks.filter(r => r.impact >= 4).slice(0, 2).map(r => r.title).join(', ')}.`;

        const prompt = `Based on the following summarized data, provide a concise executive briefing.
        - Identify 2-3 key organizational strengths.
        - Identify 2-3 primary areas for improvement or concern.
        - Provide 2 actionable, high-level recommendations.
        
        Data:
        - ${projectSummary}
        - ${riskSummary}
        - Total departments: ${departments.length}.
        - Total staff: ${users.length}.
        
        IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text).
        The JSON must have these exact keys:
        - "strengths": array of strings
        - "concerns": array of strings  
        - "recommendations": array of objects with "title" and "details" string properties`;

        const rawResponse = await this._ask(prompt);

        // Parse JSON from the response, stripping any markdown fences if present
        const jsonStr = rawResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        try {
            return JSON.parse(jsonStr) as AIQualityBriefing;
        } catch {
            // Fallback: return a structured response from the raw text
            return {
                strengths: ['AI analysis completed — see details in response.'],
                concerns: ['Unable to parse structured response from AI agent.'],
                recommendations: [{ title: 'Review AI Response', details: rawResponse }],
            };
        }
    }
}

export const aiService = new AIService();
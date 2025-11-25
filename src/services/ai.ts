
import {
    Project,
    Risk,
    User,
    Department,
    Competency,
    Standard,
} from '@/types';

class AIService {
    private apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;

    private async _generateContent(prompt: string): Promise<string> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return 'Error generating content from AI.';
        }
    }

    async suggestActionPlan(description: string): Promise<string> {
        const prompt = `Based on the following risk description, suggest a brief, actionable plan: "${description}"`;
        return this._generateContent(prompt);
    }

    async suggestRootCause(
        description: string,
        notes: string
    ): Promise<string> {
        const prompt = `Based on the following risk description: "${description}" and additional notes: "${notes}", suggest a potential root cause.`;
        return this._generateContent(prompt);
    }

    async generatePolicyFromStandard(
        standard: Standard,
        language: 'en' | 'ar'
    ): Promise<string> {
        const prompt = `Based on the following standard: "${standard.description}", generate a policy in ${language}.`;
        return this._generateContent(prompt);
    }

    async improveWriting(text: string, language: 'en' | 'ar'): Promise<string> {
        const prompt = `Improve the following text in ${language}: "${text}"`;
        return this._generateContent(prompt);
    }

    async translateText(text: string, language: 'en' | 'ar'): Promise<string> {
        const prompt = `Translate the following text to ${language}: "${text}"`;
        return this._generateContent(prompt);
    }

    async generateQualityBriefing(
        projects: Project[],
        risks: Risk[],
        users: User[],
        departments: Department[],
        competencies: Competency[]
    ): Promise<string> {
        const prompt = `
        Generate a comprehensive quality and compliance briefing based on the following data:
        - Projects: ${JSON.stringify(projects)}
        - Risks: ${JSON.stringify(risks)}
        - Users: ${JSON.stringify(users)}
        - Departments: ${JSON.stringify(departments)}
        - Competencies: ${JSON.stringify(competencies)}
        `;
        return this._generateContent(prompt);
    }
}

export const aiService = new AIService();
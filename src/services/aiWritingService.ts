/**
 * AI Writing Service
 * Provides AI-powered writing assistance for document editing.
 * Delegates to aiAgentService for actual AI calls.
 *
 * All outputs use well-structured HTML with proper formatting for rich-text display.
 */

import { aiAgentService } from './aiAgentService';

export type AICommand =
    | 'improve'
    | 'simplify'
    | 'expand'
    | 'formalize'
    | 'summarize'
    | 'translate_ar'
    | 'translate_en'
    | 'fix_grammar'
    | 'add_compliance';

/** Shared formatting instructions appended to every prompt */
const HTML_FORMAT_RULES = `
OUTPUT FORMAT RULES — follow these strictly:
- Return ONLY valid HTML content (absolutely NO markdown, NO code fences, NO commentary).
- Use <h2> for main titles, <h3> for section headings, <h4> for subsection headings.
- Use <p> for paragraphs. Never return bare text outside of tags.
- Use <ul>/<ol> with <li> for lists. Prefer <ol> for sequential steps.
- Use <strong> for emphasis and key terms. Use <em> for secondary emphasis.
- Use <table><thead><tbody> for tabular data. Include <th> for header cells.
- Use <blockquote> for important notes, warnings, or callouts.
- Maintain consistent heading hierarchy (h2 → h3 → h4, never skip levels).
- Separate sections with semantic headings, not horizontal rules.
`;

const COMMAND_PROMPTS: Record<AICommand, string> = {
    improve: `You are a senior healthcare documentation editor. Improve the following text for clarity, grammar, and professional tone while preserving the original meaning and structure.

Best-practice standards to apply:
- Use clear, active-voice sentences suitable for healthcare accreditation documents.
- Ensure each paragraph conveys a single idea with a clear topic sentence.
- Use precise medical/regulatory terminology (e.g., "shall" for mandatory, "should" for recommended, "may" for optional).
- Maintain proper heading hierarchy and list formatting.
${HTML_FORMAT_RULES}
Return ONLY the improved text.`,

    simplify: `You are a healthcare plain-language specialist. Simplify the following text so it is clear, accessible, and easy for all staff to understand, while maintaining factual accuracy.

Best-practice standards:
- Target a Grade 8 reading level.
- Replace jargon with plain terms, or define technical terms in parentheses on first use.
- Use short sentences (15-20 words max) and short paragraphs (3-4 sentences).
- Convert complex nested lists into simpler numbered steps.
- Keep all essential safety and compliance information intact.
${HTML_FORMAT_RULES}
Return ONLY the simplified text.`,

    expand: `You are a senior healthcare accreditation consultant. Expand the following text with comprehensive details, real-world examples, and supporting information appropriate for healthcare accreditation documentation.

Best-practice standards:
- Add practical implementation steps and role-specific responsibilities.
- Include relevant references to accreditation standards (CBAHI, JCI, ISO 9001, OSHA) where appropriate.
- Add measurable outcomes, key performance indicators (KPIs), and timelines.
- Include exception handling, escalation pathways, and contingency procedures.
- Add cross-references to related policies or procedures where relevant.
${HTML_FORMAT_RULES}
Return ONLY the expanded text.`,

    formalize: `You are a healthcare regulatory documentation expert. Rewrite the following text in a formal, professional tone that meets healthcare policy and accreditation documentation standards.

Best-practice writing standards:
- Use "shall" for mandatory requirements, "should" for recommendations, "may" for options.
- Write in third person and present tense (e.g., "Staff shall…" not "You should…").
- Use consistent defined terminology throughout; define key terms on first use.
- Apply structured headings: Purpose, Scope, Definitions, Policy/Procedure, Responsibilities, Monitoring, References.
- Number sections and subsections for easy cross-referencing (e.g., 1.0, 1.1, 1.2).
- Include document control metadata placeholders at the top (Document No., Effective Date, Review Date, Version).
${HTML_FORMAT_RULES}
Return ONLY the formalized text.`,

    summarize: `You are a healthcare documentation specialist. Produce a concise executive summary of the following document that captures all critical information.

Best-practice standards:
- Begin with a one-sentence statement of the document's purpose.
- List the 3-5 most critical key points using a bullet list.
- Note any compliance requirements, deadlines, or mandatory actions.
- Keep the summary under 200 words.
- Use bold for critical action items and named standards.
${HTML_FORMAT_RULES}
Return ONLY the summary.`,

    translate_ar: `You are a professional medical translator specializing in English-to-Arabic translation for healthcare institutions.

Best-practice standards:
- Use Modern Standard Arabic (فصحى) suitable for official healthcare documents.
- Preserve ALL HTML tags and structure exactly as they are.
- Only translate the text content inside the tags.
- Add dir="rtl" to every block-level element (<h2>, <h3>, <p>, <ul>, <ol>, <table>, <div>).
- Maintain accurate medical/accreditation terminology. Provide the widely-accepted Arabic equivalent, or transliterate with the English term in parentheses if no standard translation exists.
- Translate section headings consistently (Purpose → الغرض, Scope → النطاق, Definitions → التعريفات, Procedures → الإجراءات, Responsibilities → المسؤوليات, References → المراجع).

Return ONLY the Arabic translation.`,

    translate_en: `You are a professional medical translator specializing in Arabic-to-English translation for healthcare institutions.

Best-practice standards:
- Use formal, professional English appropriate for healthcare accreditation documentation.
- Preserve ALL HTML tags and structure exactly as they are.
- Only translate the text content inside the tags.
- Remove any dir="rtl" attributes from elements.
- Use standard medical/accreditation terminology recognized internationally (CBAHI, JCI, ISO).
- Translate section headings into standard English document headings.

Return ONLY the English translation.`,

    fix_grammar: `You are an expert healthcare document proofreader. Fix all grammar, spelling, punctuation, and typographical errors in the following text.

Best-practice standards:
- Correct subject-verb agreement, tense consistency, and article usage.
- Fix medical term spelling (e.g., "epinepherine" → "epinephrine").
- Ensure proper capitalization of proper nouns, acronyms, and standard names.
- Fix numbered/bulleted list formatting and parallel construction.
- Do NOT change the meaning, tone, or structure of the document.
- Preserve all HTML tags and attributes exactly as they are.
${HTML_FORMAT_RULES}
Return ONLY the corrected text with no commentary.`,

    add_compliance: `You are a healthcare accreditation compliance specialist. Enhance the following text to align with leading healthcare accreditation standards.

Best-practice standards to reference:
- CBAHI (Saudi Central Board for Accreditation of Healthcare Institutions) — Essential Safety Requirements (ESR).
- JCI (Joint Commission International) — International Patient Safety Goals (IPSG).
- ISO 9001:2015 — Quality Management Systems, particularly clauses 7 (Support), 8 (Operation), and 10 (Improvement).
- WHO Patient Safety guidelines where applicable.

Enhancement rules:
- Add specific standard references in parentheses (e.g., "per CBAHI ESR-12" or "JCI IPSG.3").
- Ensure the document addresses: governance, accountability, monitoring, evidence-based practice, and continuous improvement.
- Add measurable compliance indicators, frequency of reviews, and responsible roles.
- Insert a "Compliance Cross-Reference" section at the end mapping requirements to standards.
${HTML_FORMAT_RULES}
Return ONLY the enhanced text.`,
};

class AIWritingService {
    async processText(params: { command: AICommand; text: string }): Promise<string> {
        const promptPrefix = COMMAND_PROMPTS[params.command] || COMMAND_PROMPTS.improve;
        const prompt = `${promptPrefix}\n\nText:\n${params.text}`;
        try {
            const response = await aiAgentService.chat(prompt, true);
            return this.cleanHtml(response.response || params.text);
        } catch (error) {
            console.error('AI writing processText error:', error);
            return params.text;
        }
    }

    async improveWriting(text: string): Promise<string> {
        return this.processText({ command: 'improve', text });
    }

    async generateContent(prompt: string): Promise<string> {
        try {
            const response = await aiAgentService.chat(
                `You are a senior healthcare accreditation documentation specialist. Generate professional, standards-compliant content based on the following instruction.

Best-practice writing standards:
- Structure the output with proper semantic headings (<h2>, <h3>, <h4>).
- Use "shall" for mandatory items, "should" for recommended actions.
- Write in third person, present tense, formal tone.
- Include practical implementation details, roles, timelines, and KPIs where appropriate.
- Reference relevant accreditation standards (CBAHI, JCI, ISO) when applicable.
- Use numbered sections for procedures and bullet lists for requirements.
${HTML_FORMAT_RULES}
Instruction: ${prompt}`,
                true
            );
            return this.cleanHtml(response.response || '');
        } catch (error) {
            console.error('AI writing generateContent error:', error);
            return '';
        }
    }

    async summarize(text: string): Promise<string> {
        return this.processText({ command: 'summarize', text });
    }

    async translate(text: string, targetLang: string): Promise<string> {
        const command: AICommand = targetLang === 'ar' ? 'translate_ar' : 'translate_en';
        return this.processText({ command, text });
    }

    getCommands(): AICommand[] {
        return Object.keys(COMMAND_PROMPTS) as AICommand[];
    }

    /** Strip markdown code fences and ensure valid HTML output */
    private cleanHtml(raw: string): string {
        let html = raw
            .replace(/```html?\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
        // If the response looks like bare text (no HTML tags), wrap in paragraphs
        if (html && !/<[a-z][\s\S]*>/i.test(html)) {
            html = html.split(/\n{2,}/).map(p => `<p>${p.trim()}</p>`).join('\n');
        }
        return html;
    }
}

export const aiWritingService = new AIWritingService();
export default aiWritingService;

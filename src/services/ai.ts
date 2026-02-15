// prettier-ignore
// eslint-disable prettier/prettier
/**
 * AI Service - AccreditEx
 *
 * Routes all AI requests through the AccreditEx AI Agent backend
 * (hosted at https://accreditex.onrender.com) instead of calling
 * third-party APIs directly from the browser.
 *
 * The backend is a FastAPI service with a /chat endpoint that handles
 * all AI tasks via the unified AccreditEx agent.
 *
 * NOTE: Do NOT auto-format this file — template literal prompts are
 * whitespace-sensitive and formatting will break them.
 */

import { aiAgentService } from '@/services/aiAgentService';
import { Standard, Language, AIQualityBriefing, Project, Risk, User, Department, Competency } from '@/types';

/* ------------------------------------------------------------------ */
/*  HTML cleaning helper                                               */
/* ------------------------------------------------------------------ */

function cleanAIHtml(raw: string): string {
    let html = raw
        .replace(/^```html?\s*/i, '')
        .replace(/```\s*$/g, '')
        .trim();

    if (!html.includes('<') || html.startsWith('#')) {
        html = html
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^[-\u2022] (.+)$/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
            .replace(/^(?!<[hulo])((?!\s*$).+)$/gm, '<p>$1</p>')
            .replace(/<p><(h[1-4]|ul|ol|li)/g, '<$1')
            .replace(/<\/(h[1-4]|ul|ol|li)><\/p>/g, '</$1>');
    }

    html = html.replace(/<(h[1-4])>\*\*(.+?)\*\*<\/\1>/g, '<$1>$2</$1>');
    return html;
}

/* ------------------------------------------------------------------ */
/*  Truncation helper                                                  */
/* ------------------------------------------------------------------ */

const MAX_CONTENT_CHARS = 40000;

function truncateContent(text: string): string {
    if (text.length <= MAX_CONTENT_CHARS) return text;
    return text.slice(0, MAX_CONTENT_CHARS) + '\n<!-- content truncated -->';
}

/* ------------------------------------------------------------------ */
/*  Prompt builder helper (avoids formatter-mangled template literals)  */
/* ------------------------------------------------------------------ */

function lines(...parts: string[]): string {
    return parts.join('\n');
}

/* ================================================================== */
/*  AI Service Class                                                   */
/* ================================================================== */

class AIService {
    private async _ask(prompt: string): Promise<string> {
        const response = await aiAgentService.chat(prompt, true);
        return response.response || '';
    }

    private async _askHtml(prompt: string): Promise<string> {
        const raw = await this._ask(prompt);
        return cleanAIHtml(raw);
    }

    /* ---- Plain-text helpers (non-document) ---- */

    async suggestActionPlan(standardDescription: string): Promise<string> {
        const prompt = 'Based on the following non-compliant healthcare accreditation standard, suggest a concise, professional, and actionable plan with 3-4 numbered steps to achieve compliance. Standard: "' + standardDescription + '"';
        return this._ask(prompt);
    }

    async suggestRootCause(standardDescription: string, notes: string): Promise<string> {
        const prompt = lines(
            'A healthcare accreditation standard was found to be non-compliant. Analyze the standard and the auditor\'s notes to suggest potential root causes. Provide a structured response with 2-3 likely root causes, categorized if possible (e.g., Process Failure, Human Error, Training Gap, System Issue).',
            '',
            'Standard: "' + standardDescription + '"',
            'Auditor\'s Notes: "' + notes + '"',
            '',
            'Provide your analysis below:',
        );
        return this._ask(prompt);
    }

    /* ---- Document generation (HTML output) ---- */

    async generatePolicyFromStandard(standard: Standard, lang: Language): Promise<string> {
        const langName = lang === 'en' ? 'English' : 'Arabic';
        const isAr = lang === 'ar';
        const d = isAr ? ' dir="rtl"' : '';

        const h = isAr
            ? { title: '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0648\u062b\u064a\u0642\u0629', purpose: '\u0661. \u0627\u0644\u063a\u0631\u0636', scope: '\u0662. \u0627\u0644\u0646\u0637\u0627\u0642', definitions: '\u0663. \u0627\u0644\u062a\u0639\u0631\u064a\u0641\u0627\u062a', policy: '\u0664. \u0628\u064a\u0627\u0646 \u0627\u0644\u0633\u064a\u0627\u0633\u0629', procedures: '\u0665. \u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a', roles: '\u0666. \u0627\u0644\u0623\u062f\u0648\u0627\u0631 \u0648\u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064a\u0627\u062a', monitoring: '\u0667. \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0648\u0627\u0644\u0627\u0645\u062a\u062b\u0627\u0644', references: '\u0668. \u0627\u0644\u0645\u0631\u0627\u062c\u0639', term: '\u0627\u0644\u0645\u0635\u0637\u0644\u062d', def: '\u0627\u0644\u062a\u0639\u0631\u064a\u0641', role: '\u0627\u0644\u062f\u0648\u0631', resp: '\u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064a\u0629' }
            : { title: 'Document Title', purpose: '1. Purpose', scope: '2. Scope', definitions: '3. Definitions', policy: '4. Policy Statement', procedures: '5. Procedures', roles: '6. Roles & Responsibilities', monitoring: '7. Monitoring & Compliance', references: '8. References', term: 'Term', def: 'Definition', role: 'Role', resp: 'Responsibility' };

        const prompt = lines(
            'You are a senior healthcare accreditation consultant. Generate a COMPLETE, professional policy/procedure document in ' + langName + ' based on this standard.',
            '',
            'Standard ID: ' + standard.standardId,
            'Standard Description: "' + standard.description + '"',
            '',
            'IMPORTANT: Return ONLY valid HTML content (no markdown, no code fences). Use these exact HTML tags for structure:',
            '',
            '<h2' + d + '>' + h.title + '</h2>',
            '<h3' + d + '>' + h.purpose + '</h3>',
            '<p' + d + '>Clear statement of why this policy exists, referencing the standard.</p>',
            '',
            '<h3' + d + '>' + h.scope + '</h3>',
            '<p' + d + '>Who this applies to, which departments, facilities, and settings.</p>',
            '',
            '<h3' + d + '>' + h.definitions + '</h3>',
            '<ul' + d + '>',
            '  <li><strong>' + h.term + ':</strong> ' + h.def + '</li>',
            '</ul>',
            '',
            '<h3' + d + '>' + h.policy + '</h3>',
            '<p' + d + '>The formal policy declarations. Use multiple paragraphs for clarity.</p>',
            '',
            '<h3' + d + '>' + h.procedures + '</h3>',
            '<ol' + d + '>',
            '  <li><strong>Step title:</strong> Detailed description of what must be done, by whom, and when.</li>',
            '</ol>',
            '',
            '<h3' + d + '>' + h.roles + '</h3>',
            '<table' + d + '>',
            '  <thead><tr><th>' + h.role + '</th><th>' + h.resp + '</th></tr></thead>',
            '  <tbody><tr><td>...</td><td>...</td></tr></tbody>',
            '</table>',
            '',
            '<h3' + d + '>' + h.monitoring + '</h3>',
            '<p' + d + '>How compliance will be measured, audited, and reported.</p>',
            '',
            '<h3' + d + '>' + h.references + '</h3>',
            '<ul' + d + '><li>Standard ' + standard.standardId + '</li><li>Related regulations and guidelines</li></ul>',
            '',
            'Requirements:',
            '- Write ALL content in ' + langName + ' \u2014 every heading, paragraph, list item, and table cell must be in ' + langName,
            isAr ? '- Add dir="rtl" attribute to every block-level HTML element (<h2>, <h3>, <p>, <ul>, <ol>, <table>, <div>)' : '- Do NOT add dir attributes',
            '- Write substantive, detailed content for EACH section (not placeholder text)',
            '- Use proper medical/healthcare terminology' + (isAr ? ' in Modern Standard Arabic (\u0641\u0635\u062d\u0649)' : ''),
            '- Include specific, actionable procedures',
            '- Make it ready for use in a real hospital accreditation setting',
            '- Return ONLY the HTML content, nothing else',
        );

        return this._askHtml(prompt);
    }

    /* ---- Improve writing ---- */

    async improveWriting(text: string, lang: Language): Promise<string> {
        const langName = lang === 'en' ? 'English' : 'Arabic';
        const isAr = lang === 'ar';

        const prompt = lines(
            'You are a professional medical document editor. Improve the following document for clarity, professionalism, and completeness while preserving its meaning and structure.',
            '',
            'Rules:',
            '- Return ONLY valid HTML content (no markdown, no code fences)',
            '- Preserve existing HTML structure (headings, lists, tables) and improve them',
            '- If the input has no HTML structure, add proper HTML formatting with <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <table> tags',
            '- Use professional healthcare/medical terminology',
            '- Fix grammar, spelling, and punctuation',
            '- Improve sentence flow and readability',
            '- Add proper section headings if missing',
            '- Write ALL output in ' + langName,
            ...(isAr ? [
                '- Add dir="rtl" attribute to every block-level HTML element (<h2>, <h3>, <p>, <ul>, <ol>, <table>, <div>)',
                '- Use Modern Standard Arabic (\u0641\u0635\u062d\u0649) appropriate for official healthcare documents',
                '- Use Arabic numbering where appropriate',
            ] : []),
            '',
            'Content to improve:',
            truncateContent(text),
        );

        return this._askHtml(prompt);
    }

    /* ---- Translate ---- */

    async translateText(text: string, lang: Language): Promise<string> {
        const targetLanguage = lang === 'en' ? 'Arabic' : 'English';
        const toArabic = targetLanguage === 'Arabic';

        const prompt = lines(
            'Translate the following document to ' + targetLanguage + '.',
            '',
            'Rules:',
            '- Return ONLY the translated HTML content (no markdown, no code fences, no explanations)',
            '- Preserve ALL HTML tags and structure exactly as they are (<h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <strong>, etc.)',
            '- Only translate the text content inside the tags',
            '- Maintain professional medical terminology',
            ...(toArabic ? [
                '- Add dir="rtl" attribute to every block-level HTML element (<h2>, <h3>, <p>, <ul>, <ol>, <table>, <div>)',
                '- Use Modern Standard Arabic (\u0641\u0635\u062d\u0649) appropriate for official documents',
                '- Translate section headings to Arabic (e.g., "Purpose" \u2192 "\u0627\u0644\u063a\u0631\u0636", "Scope" \u2192 "\u0627\u0644\u0646\u0637\u0627\u0642", "Procedures" \u2192 "\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a")',
            ] : [
                '- Remove any dir="rtl" attributes from elements',
                '- Use formal English appropriate for healthcare documents',
            ]),
            '',
            'Content to translate:',
            truncateContent(text),
        );

        return this._askHtml(prompt);
    }

    /* ---- Compliance check ---- */

    async checkCompliance(text: string, standardDescription: string, lang: Language): Promise<{ score: number; findings: string }> {
        const langName = lang === 'en' ? 'English' : 'Arabic';
        const isAr = lang === 'ar';
        const d = isAr ? ' dir="rtl"' : '';

        const prompt = lines(
            'You are a healthcare accreditation compliance auditor. Analyze the following document against the given standard and provide a compliance assessment.',
            '',
            'Standard: "' + standardDescription + '"',
            '',
            'Document content:',
            truncateContent(text),
            '',
            'IMPORTANT: Respond with ONLY a valid JSON object (no markdown, no code fences).',
            'The JSON must have these exact keys:',
            '- "score": a number from 0 to 100 representing the compliance percentage',
            '- "findings": an HTML string with your detailed findings in ' + langName + ', formatted with:',
            '  - <h3' + d + '> for section headings',
            '  - <ul' + d + '>/<li> for bullet points',
            '  - <strong> for emphasis',
            '  - <p' + d + '> for paragraphs',
            ...(isAr ? ['  - Write ALL findings in Modern Standard Arabic (\u0641\u0635\u062d\u0649)'] : []),
        );

        const raw = await this._ask(prompt);
        const jsonStr = raw.replace(/```json?\s*/gi, '').replace(/```\s*$/g, '').trim();

        try {
            const parsed = JSON.parse(jsonStr);
            return {
                score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
                findings: cleanAIHtml(typeof parsed.findings === 'string' ? parsed.findings : JSON.stringify(parsed.findings)),
            };
        } catch {
            return { score: 0, findings: cleanAIHtml(raw) };
        }
    }

    /* ---- Summarize ---- */

    async summarizeContent(text: string, lang: Language): Promise<string> {
        const langName = lang === 'en' ? 'English' : 'Arabic';
        const isAr = lang === 'ar';
        const d = isAr ? ' dir="rtl"' : '';
        const summaryHeading = isAr ? '\u0627\u0644\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u064a' : 'Executive Summary';

        const prompt = lines(
            'You are a healthcare documentation specialist. Summarize the following document concisely while preserving all critical information.',
            '',
            'Rules:',
            '- Return ONLY valid HTML content (no markdown, no code fences)',
            '- Use <h3' + d + '> for "' + summaryHeading + '" heading',
            '- Use <p' + d + '> for summary paragraphs',
            '- Use <ul' + d + '>/<li> for key points',
            '- Use <strong> for emphasis on critical items',
            '- Keep the summary to 3-5 key points maximum',
            '- Maintain professional healthcare terminology',
            '- Write ALL output in ' + langName,
            ...(isAr ? [
                '- Add dir="rtl" attribute to every block-level HTML element',
                '- Use Modern Standard Arabic (\u0641\u0635\u062d\u0649)',
            ] : []),
            '',
            'Document to summarize:',
            truncateContent(text),
        );

        return this._askHtml(prompt);
    }

    /* ---- Quality briefing (JSON output) ---- */

    async generateQualityBriefing(
        projects: Project[],
        risks: Risk[],
        users: User[],
        departments: Department[],
        _competencies: Competency[],
    ): Promise<AIQualityBriefing> {
        const projectSummary = 'There are ' + projects.length + ' projects. Key projects include ' + projects.slice(0, 2).map(p => p.name).join(', ') + '. Overall compliance is around ' + (projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1)).toFixed(1) + '%.';
        const riskSummary = 'There are ' + risks.length + ' open risks. High-impact risks include: ' + risks.filter(r => r.impact >= 4).slice(0, 2).map(r => r.title).join(', ') + '.';

        const prompt = lines(
            'Based on the following summarized data, provide a concise executive briefing.',
            '- Identify 2-3 key organizational strengths.',
            '- Identify 2-3 primary areas for improvement or concern.',
            '- Provide 2 actionable, high-level recommendations.',
            '',
            'Data:',
            '- ' + projectSummary,
            '- ' + riskSummary,
            '- Total departments: ' + departments.length + '.',
            '- Total staff: ' + users.length + '.',
            '',
            'IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text).',
            'The JSON must have these exact keys:',
            '- "strengths": array of strings',
            '- "concerns": array of strings',
            '- "recommendations": array of objects with "title" and "details" string properties',
        );

        const rawResponse = await this._ask(prompt);

        const jsonStr = rawResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        try {
            return JSON.parse(jsonStr) as AIQualityBriefing;
        } catch {
            return {
                strengths: ['AI analysis completed \u2014 see details in response.'],
                concerns: ['Unable to parse structured response from AI agent.'],
                recommendations: [{ title: 'Review AI Response', details: rawResponse }],
            };
        }
    }
}

export const aiService = new AIService();

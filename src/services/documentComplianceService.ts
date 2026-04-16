/**
 * Document Compliance Service
 * Analyzes documents for compliance with JCI/CBAHI standards
 * Provides structure validation, content scoring, and audit recommendations
 */

import { aiAgentService } from './aiAgentService';

export interface ComplianceIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    section?: string;
    suggestion?: string;
}

export interface ComplianceScore {
    overall: number; // 0-100
    completeness: number; // 0-100 —  required sections
    structure: number; // 0-100 — proper hierarchy
    language: number; // 0-100 — compliance terminology
    readability: number; // 0-100 — clarity for staff
    issues: ComplianceIssue[];
}

export interface DocumentStructureAnalysis {
    hasTitle: boolean;
    hasSummary: boolean;
    hasScope: boolean;
    hasObjectives: boolean;
    hasProcedures: boolean;
    hasResponsibilities: boolean;
    hasFrequency: boolean;
    hasApproval: boolean;
    headingCount: number;
    imageCount: number;
    tableCount: number;
    wordCount: number;
    estimatedReadingTime: number; // minutes
}

/**
 * Analyze document structure (HTML)
 */
export function analyzeDocumentStructure(htmlContent: string): DocumentStructureAnalysis {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const text = doc.body.textContent || '';
    const wordCount = text
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0).length;

    // Estimate reading time (avg 200 words per minute)
    const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Extract text and check for section keywords
    const textLC = text.toLowerCase();

    const requiredSections = {
        hasTitle: doc.querySelector('h1') !== null,
        hasSummary: /summary|overview|description/.test(textLC),
        hasScope: /scope|applies|applicable|department|unit/.test(textLC),
        hasObjectives: /objective|goal|aim|purpose/.test(textLC),
        hasProcedures: /procedure|step|process|how to|method/.test(textLC),
        hasResponsibilities: /responsible|responsibility|responsible|role|accountable/.test(textLC),
        hasFrequency: /frequency|periodic|annually|quarterly|monthly|weekly|daily|schedule/.test(textLC),
        hasApproval: /approval|approved|authorize|signature|sponsor|manager/.test(textLC),
    };

    return {
        ...requiredSections,
        headingCount: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        imageCount: doc.querySelectorAll('img').length,
        tableCount: doc.querySelectorAll('table').length,
        wordCount,
        estimatedReadingTime,
    };
}

/**
 * Calculate structure compliance score
 */
export function calculateStructureScore(analysis: DocumentStructureAnalysis): number {
    const requiredSections = [
        analysis.hasTitle,
        analysis.hasSummary,
        analysis.hasScope,
        analysis.hasObjectives,
        analysis.hasProcedures,
        analysis.hasResponsibilities,
        analysis.hasFrequency,
        analysis.hasApproval,
    ];

    const sectionsCovered = requiredSections.filter(Boolean).length;
    const sectionScore = (sectionsCovered / requiredSections.length) * 100;

    // Bonus for proper structure (at least 3 heading levels)
    const structureBonus = analysis.headingCount >= 3 ? 10 : 0;

    return Math.min(100, Math.round(sectionScore + structureBonus));
}

/**
 * Check document for common compliance language patterns
 */
export function analyzeComplianceLanguage(htmlContent: string): number {
    const text = htmlContent.toLowerCase();

    // Compliance terminology keywords
    const complianceTerms = [
        'shall', // mandatory
        'should', // recommended
        'must', // mandatory
        'required', // mandatory
        'approved', // authorization
        'authorized', // authorization
        'responsible', // accountability
        'policy', // governance
        'procedure', // process
        'standard', // baseline
        'frequency', // schedule
        'review', // audit
        'monitor', // oversight
        'document', // record-keeping
        'evidence', // documentation
    ];

    const matches = complianceTerms.filter(term => text.includes(term)).length;
    const score = Math.min(100, (matches / complianceTerms.length) * 50 + 50);

    return Math.round(score);
}

/**
 * Calculate readability score (0-100)
 * Based on word count, sentence structure, and complexity indicators
 */
export function calculateReadabilityScore(htmlContent: string): number {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const text = doc.body.textContent || '';

    // Extract sentences (rough approximation)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (words === 0) return 0;

    const avgWordLength = text.replace(/\s/g, '').length / words;
    const avgSentenceLength = words / Math.max(1, sentences);

    // Flesch-Kincaid inspired scoring
    // Ideal: words per sentence 15-20, letters per word 4-5
    let score = 100;

    if (avgSentenceLength > 25) score -= 20; // long sentences
    if (avgSentenceLength < 8) score -= 10; // very short sentences
    if (avgWordLength > 5.5) score -= 15; // complex words
    if (avgWordLength < 3) score -= 5; // too simple

    return Math.max(0, Math.min(100, score));
}

/**
 * Generate compliance issues based on analysis
 */
export function generateComplianceIssues(analysis: DocumentStructureAnalysis, htmlContent: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Check for missing required sections
    if (!analysis.hasTitle) {
        issues.push({
            id: 'missing-title',
            severity: 'error',
            title: 'Missing Document Title',
            description: 'Document must start with a clear H1 title (e.g., "Procedure: Patient Check-in")',
            suggestion: 'Add a Heading 1 at the beginning with the document name',
        });
    }

    if (!analysis.hasSummary) {
        issues.push({
            id: 'missing-summary',
            severity: 'warning',
            title: 'Missing Summary',
            description: 'No overview or summary section found. Required for policy/procedure compliance.',
            section: 'Structure',
            suggestion: 'Add a summary section after the title describing the document purpose',
        });
    }

    if (!analysis.hasScope) {
        issues.push({
            id: 'missing-scope',
            severity: 'warning',
            title: 'Missing Scope Statement',
            description: 'Scope (applies to, departments, units) not clearly defined.',
            section: 'Structure',
            suggestion: 'Include scope section defining who/what this document applies to',
        });
    }

    if (!analysis.hasObjectives) {
        issues.push({
            id: 'missing-objectives',
            severity: 'warning',
            title: 'Missing Objectives',
            description: 'Document goals/objectives not stated. Required for compliance documentation.',
            section: 'Structure',
            suggestion: 'Add objectives section with clear, measurable goals',
        });
    }

    if (!analysis.hasProcedures) {
        issues.push({
            id: 'missing-procedures',
            severity: 'error',
            title: 'Missing Procedures',
            description: 'No procedural steps found. Critical for compliance documentation.',
            suggestion: 'Add detailed step-by-step procedures using numbered or bulleted lists',
        });
    }

    if (!analysis.hasResponsibilities) {
        issues.push({
            id: 'missing-responsibilities',
            severity: 'warning',
            title: 'Missing Role Responsibilities',
            description: 'Roles and responsibilities for execution not defined.',
            section: 'Structure',
            suggestion: 'Clearly assign responsibilities to specific roles or departments',
        });
    }

    if (!analysis.hasFrequency) {
        issues.push({
            id: 'missing-frequency',
            severity: 'info',
            title: 'Missing Frequency/Schedule',
            description: 'Frequency or schedule for execution not specified.',
            suggestion: 'Add frequency (daily, weekly, monthly, etc.) or schedule for the procedure',
        });
    }

    if (!analysis.hasApproval) {
        issues.push({
            id: 'missing-approval',
            severity: 'warning',
            title: 'Missing Approval Information',
            description: 'Approval, authorization, or signature block not found.',
            section: 'Governance',
            suggestion: 'Include approval dates, authorized personnel, or signature blocks',
        });
    }

    // Structure warnings
    if (analysis.headingCount < 2) {
        issues.push({
            id: 'poor-structure',
            severity: 'warning',
            title: 'Poor Document Structure',
            description: 'Document lacks proper heading hierarchy. Makes navigation difficult.',
            section: 'Structure',
            suggestion: 'Use multiple heading levels (H1, H2, H3) to organize content',
        });
    }

    // Length warnings
    if (analysis.wordCount < 100) {
        issues.push({
            id: 'too-short',
            severity: 'info',
            title: 'Document Very Short',
            description: 'Document is under 100 words. May lack sufficient detail for compliance.',
            suggestion: 'Expand with more detailed procedures, responsibilities, and requirements',
        });
    }

    if (analysis.wordCount > 5000) {
        issues.push({
            id: 'too-long',
            severity: 'info',
            title: 'Document Very Long',
            description: 'Document exceeds 5000 words. Consider breaking into multiple documents.',
            suggestion: 'Consider splitting into sub-procedures or creating an appendix',
        });
    }

    return issues;
}

/**
 * Comprehensive compliance scoring
 */
export function scoreDocumentCompliance(htmlContent: string): ComplianceScore {
    const analysis = analyzeDocumentStructure(htmlContent);
    const structureScore = calculateStructureScore(analysis);
    const languageScore = analyzeComplianceLanguage(htmlContent);
    const readabilityScore = calculateReadabilityScore(htmlContent);
    const completenessScore = structureScore; // Completeness based on required sections

    const issues = generateComplianceIssues(analysis, htmlContent);

    // Weight-based overall score
    const overall = Math.round(
        structureScore * 0.3 + // Structure
        completenessScore * 0.3 + // Completeness
        languageScore * 0.2 + // Language
        readabilityScore * 0.2 // Readability
    );

    return {
        overall,
        completeness: completenessScore,
        structure: structureScore,
        language: languageScore,
        readability: readabilityScore,
        issues: issues.sort((a, b) => {
            const severityOrder = { error: 0, warning: 1, info: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        }),
    };
}

/**
 * Get AI-powered compliance improvement suggestions
 */
export async function getComplianceImprovementSuggestions(
    htmlContent: string,
    standard: 'JCI' | 'CBAHI' | 'MOH' = 'CBAHI'
): Promise<string> {
    const analysis = analyzeDocumentStructure(htmlContent);
    const score = scoreDocumentCompliance(htmlContent);

    const prompt = `You are a healthcare compliance expert specializing in ${standard} accreditation standards.
  
Document Analysis:
- Overall Compliance Score: ${score.overall}/100
- Structure Score: ${score.structure}/100
- Completeness: ${score.completeness}/100
- Language Compliance: ${score.language}/100
- Readability: ${score.readability}/100

Issues Found:
${score.issues.map(i => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join('\n')}

Structure Analysis:
- Has Title: ${analysis.hasTitle}
- Has Summary: ${analysis.hasSummary}
- Has Scope: ${analysis.hasScope}
- Has Objectives: ${analysis.hasObjectives}
- Has Procedures: ${analysis.hasProcedures}
- Has Responsibilities: ${analysis.hasResponsibilities}
- Has Frequency: ${analysis.hasFrequency}
- Has Approval Info: ${analysis.hasApproval}
- Word Count: ${analysis.wordCount}
- Reading Time: ${analysis.estimatedReadingTime} minutes

Provide 3-5 specific recommendations to improve compliance and readiness for ${standard} accreditation review. Focus on high-impact changes that address the issues listed above. Output as HTML list with <ol> and <li> tags.`;

    try {
        const result = await aiAgentService.callAgent(prompt);
        return result || '<ol><li>Unable to generate suggestions. Please review the compliance issues manually.</li></ol>';
    } catch {
        return '<ol><li>Error generating AI suggestions. Please try again.</li></ol>';
    }
}

/**
 * Export compliance report as HTML
 */
export function generateComplianceReport(
    documentName: string,
    score: ComplianceScore,
    analysis: DocumentStructureAnalysis
): string {
    const scoreColor = score.overall >= 80 ? '#10b981' : score.overall >= 60 ? '#f59e0b' : '#ef4444';

    return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f9fafb; }
    .header { color: #1f2937; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
    .score-card { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
    .score { 
      background: white; 
      padding: 20px; 
      border-left: 5px solid ${scoreColor}; 
      border-radius: 4px; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      min-width: 200px;
    }
    .score-label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .score-value { 
      font-size: 36px; 
      font-weight: bold; 
      color: ${scoreColor}; 
      margin: 10px 0;
    }
    .score-bar {
      background: #e5e7eb;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
    }
    .score-fill {
      height: 100%;
      background: ${scoreColor};
    }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; }
    .issue { margin: 12px 0; padding: 12px; border-radius: 4px; }
    .issue.error { background: #fee2e2; border-left: 4px solid #ef4444; color: #991b1b; }
    .issue.warning { background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; }
    .issue.info { background: #dbeafe; border-left: 4px solid #3b82f6; color: #1e40af; }
    .issue-title { font-weight: bold; margin-bottom: 4px; }
    .issue-desc { font-size: 13px; margin-bottom: 4px; }
    .issue-suggestion { font-style: italic; font-size: 12px; }
    .structure-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .structure-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    .structure-table td:first-child { width: 40%; color: #6b7280; }
    .check { color: #10b981; }
    .cross { color: #ef4444; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Document Compliance Report</h1>
    <p><strong>${documentName}</strong> — Generated ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="score-card">
    <div class="score">
      <div class="score-label">Overall Compliance</div>
      <div class="score-value">${score.overall}%</div>
      <div class="score-bar"><div class="score-fill" style="width: ${score.overall}%"></div></div>
    </div>
    <div class="score">
      <div class="score-label">Structure</div>
      <div class="score-value">${score.structure}%</div>
      <div class="score-bar"><div class="score-fill" style="width: ${score.structure}%"></div></div>
    </div>
    <div class="score">
      <div class="score-label">Completeness</div>
      <div class="score-value">${score.completeness}%</div>
      <div class="score-bar"><div class="score-fill" style="width: ${score.completeness}%"></div></div>
    </div>
    <div class="score">
      <div class="score-label">Language</div>
      <div class="score-value">${score.language}%</div>
      <div class="score-bar"><div class="score-fill" style="width: ${score.language}%"></div></div>
    </div>
    <div class="score">
      <div class="score-label">Readability</div>
      <div class="score-value">${score.readability}%</div>
      <div class="score-bar"><div class="score-fill" style="width: ${score.readability}%"></div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Document Structure</div>
    <table class="structure-table">
      <tr><td>Title (H1)</td><td>${analysis.hasTitle ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Summary/Overview</td><td>${analysis.hasSummary ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Scope Statement</td><td>${analysis.hasScope ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Objectives</td><td>${analysis.hasObjectives ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Procedures</td><td>${analysis.hasProcedures ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Responsibilities</td><td>${analysis.hasResponsibilities ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Frequency/Schedule</td><td>${analysis.hasFrequency ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td>Approval Information</td><td>${analysis.hasApproval ? '<span class="check">✓</span>' : '<span class="cross">✗</span>'}</td></tr>
      <tr><td colspan="2"><strong>Metrics:</strong> ${analysis.headingCount} headings, ${analysis.tableCount} tables, ${analysis.imageCount} images, ${analysis.wordCount} words</td></tr>
    </table>
  </div>

  ${score.issues.length > 0 ? `<div class="section">
    <div class="section-title">Compliance Issues (${score.issues.length})</div>
    ${score.issues.map(issue => `
      <div class="issue ${issue.severity}">
        <div class="issue-title">${issue.title}</div>
        <div class="issue-desc">${issue.description}</div>
        ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
      </div>
    `).join('')}
  </div>` : ''}

  <div class="section">
    <div class="section-title">How to Improve</div>
    <p>Focus on addressing the issues above in order of severity (Errors → Warnings → Info). Each issue includes a suggestion for improvement.</p>
  </div>
</body>
</html>
  `;
}

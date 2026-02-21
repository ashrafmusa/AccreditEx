/**
 * AI Document Generator Service - AccreditEx
 * 
 * Advanced AI-powered document generation and content analysis service.
 * Provides intelligent document creation, content improvement, and compliance checking.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { documentTemplates, DocumentTemplate } from '@/data/documentTemplates';
import { aiAgentService } from './aiAgentService';

export interface DocumentGenerationRequest {
  templateId: string;
  context: {
    projectId?: string;
    departmentId?: string;
    userRole?: string;
    specificRequirements?: string[];
    existingContent?: string;
  };
  preferences?: {
    tone?: 'professional' | 'technical' | 'formal' | 'informal';
    length?: 'concise' | 'detailed' | 'comprehensive';
    format?: 'markdown' | 'html' | 'text';
  };
}

export interface DocumentGenerationResponse {
  content: string;
  suggestions: string[];
  complianceIssues: string[];
  estimatedReadingTime: number;
  wordCount: number;
  generationTime: number;
}

export interface ContentImprovementRequest {
  content: string;
  suggestions: {
    improveClarity?: boolean;
    enhanceStructure?: boolean;
    fixGrammar?: boolean;
    improveReadability?: boolean;
    enhanceProfessionalism?: boolean;
  };
}

export interface ContentImprovementResponse {
  originalContent: string;
  improvedContent: string;
  changes: {
    type: string;
    description: string;
    originalText: string;
    suggestedText: string;
  }[];
  statistics: {
    readabilityScore: number;
    grammarIssues: number;
    clarityScore: number;
    professionalismScore: number;
  };
}

export interface DocumentAnalysisResponse {
  contentScore: number;
  readabilityScore: number;
  grammarScore: number;
  structureScore: number;
  complianceIssues: {
    type: 'error' | 'warning' | 'info';
    section: string;
    issue: string;
    recommendation: string;
  }[];
  improvementSuggestions: string[];
  keySections: {
    title: string;
    startIndex: number;
    endIndex: number;
    relevanceScore: number;
  }[];
}

export class AIDocumentGeneratorService {
  private static instance: AIDocumentGeneratorService;

  static getInstance(): AIDocumentGeneratorService {
    if (!AIDocumentGeneratorService.instance) {
      AIDocumentGeneratorService.instance = new AIDocumentGeneratorService();
    }
    return AIDocumentGeneratorService.instance;
  }

  /**
   * Generate document from template with AI assistance
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    const startTime = Date.now();

    try {
      const template = documentTemplates.find(t => t.id === request.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get AI suggestions for content generation
      const suggestions = await this.getContentSuggestions(template, request.context);

      // Generate document content based on template and context
      const generatedContent = await this.generateContentFromTemplate(template, request.context, suggestions);

      // Analyze generated content
      const analysis = await this.analyzeDocument(generatedContent);

      // Check compliance
      const complianceIssues = await this.checkCompliance(generatedContent);

      const endTime = Date.now();

      return {
        content: generatedContent,
        suggestions,
        complianceIssues,
        estimatedReadingTime: Math.ceil(generatedContent.split(' ').length / 200), // 200 words per minute
        wordCount: generatedContent.split(' ').length,
        generationTime: endTime - startTime
      };
    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error('Failed to generate document');
    }
  }

  /**
   * Get content suggestions from AI based on template and context
   */
  private async getContentSuggestions(template: DocumentTemplate, context: any): Promise<string[]> {
    const prompt = `I need to generate a document using the ${template.name} template. 
    Context: ${JSON.stringify(context)}
    Template description: ${template.description}
    Template content: ${template.structure.join('\n').substring(0, 500)}...

    Suggest 3-5 key content sections or specific details that should be included to make this document comprehensive and compliant.
    Focus on:
    - Required information based on the template type
    - Context-specific details
    - Compliance requirements
    - Best practices

    Return just the list of suggestions.`;

    const response = await aiAgentService.chat(prompt, true);

    // Parse suggestions from response
    const suggestions = response.response
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('(') && !line.startsWith('*'));

    return suggestions.slice(0, 5);
  }

  /**
   * Generate content from template with AI assistance
   */
  private async generateContentFromTemplate(template: DocumentTemplate, context: any, suggestions: string[]): Promise<string> {
    const prompt = `You are a senior healthcare accreditation consultant. Generate a complete, accreditation-ready document based on the following template and context.

Template Name: ${template.name}
Template Description: ${template.description}
Template Structure:
${template.structure.join('\n')}

Context: ${JSON.stringify(context)}

Additional content to incorporate:
${suggestions.map(suggestion => `- ${suggestion}`).join('\n')}

OUTPUT FORMAT — follow strictly:
- Return ONLY valid HTML content (NO markdown, NO code fences, NO commentary or preamble).
- Use <h2> for document title. Use <h3> for major sections. Use <h4> for subsections.
- Use <p> for paragraphs — never output bare text without tags.
- Use <ul>/<ol> with <li> for lists. Use <ol> for sequential steps/procedures.
- Use <table><thead><tr><th>…</th></tr></thead><tbody> for tables including Definitions, Roles & Responsibilities, and Revision History.
- Use <strong> for mandatory terms ("shall", "must") and key emphasis. Use <em> for defined terms.
- Use <blockquote> for important warnings, safety notes, and critical callouts.
- Number sections consistently (1.0, 2.0, … and 2.1, 2.2 for subsections).
- Include a Document Control Block at the top with: Document No., Version, Effective Date, Review Date, Approved By.
- Include a Revision History table at the bottom with columns: Version, Date, Author, Changes.

WRITING STANDARDS:
- Use "shall" for mandatory requirements, "should" for recommendations, "may" for optional.
- Write in third person, present tense, formal professional tone.
- Every section must have substantive, detailed content (minimum 3-4 sentences per section).
- Cross-reference relevant accreditation standards in parentheses (CBAHI ESR-XX, JCI IPSG.X, ISO clause references).
- Include realistic healthcare content appropriate for a hospital accreditation setting.
- Follow the template structure, but add document control and revision history even if not in the template.

Return ONLY the HTML content.`;

    const response = await aiAgentService.chat(prompt, true);
    let content = (response.response || '').trim();
    // Strip markdown fences if AI wraps output
    content = content.replace(/```html?\s*/gi, '').replace(/```\s*/g, '').trim();
    return content;
  }

  /**
   * Improve existing document content with AI suggestions
   */
  async improveContent(request: ContentImprovementRequest): Promise<ContentImprovementResponse> {
    const improvementAreas = Object.entries(request.suggestions)
      .filter(([_, value]) => value)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

    const prompt = `You are a senior healthcare documentation editor. Improve the following document content to meet accreditation-quality writing standards.

Content to improve:
${request.content}

Improvement areas requested:
${improvementAreas.map(a => `- ${a}`).join('\n')}

OUTPUT FORMAT — follow strictly:
- Return ONLY valid HTML content (NO markdown, NO code fences, NO commentary).
- Use <h2> for main title, <h3> for sections, <h4> for subsections.
- Use <p> for paragraphs. Use <ul>/<ol> with <li> for lists. Use <ol> for procedures.
- Use <table><thead><tbody> for tabular data. Use <strong> for mandatory terms.
- Use <blockquote> for important notes and safety callouts.
- Number sections consistently.

WRITING STANDARDS:
- Use "shall" for mandatory, "should" for recommended, "may" for optional.
- Third person, present tense, formal professional tone.
- Fix grammar, spelling, punctuation, and parallel construction in lists.
- Ensure proper heading hierarchy and semantic structure.
- Add standard cross-references (CBAHI, JCI, ISO) where appropriate.
- Substantive content in every section — no placeholder text.

Return ONLY the improved HTML content.`;

    const response = await aiAgentService.chat(prompt, true);
    let improved = (response.response || '').trim();
    improved = improved.replace(/```html?\s*/gi, '').replace(/```\s*/g, '').trim();

    // Parse response to extract improved content and changes
    return {
      originalContent: request.content,
      improvedContent: improved,
      changes: [
        {
          type: 'content_improvement',
          description: 'AI-enhanced content',
          originalText: request.content.substring(0, 100) + '...',
          suggestedText: improved.substring(0, 100) + '...'
        }
      ],
      statistics: await this.computeContentStatistics(response.response)
    };
  }

  /**
   * Analyze document content for quality and compliance
   */
  async analyzeDocument(content: string): Promise<DocumentAnalysisResponse> {
    const prompt = `You are a healthcare accreditation quality auditor. Analyze this document for quality, compliance readiness, and improvement potential.

Content:
${content}

Analyze and provide:
1. Overall content quality score (1-100) based on: structure, completeness, professional terminology, and formatting.
2. Readability score (1-100) based on: sentence clarity, appropriate complexity for healthcare professionals.
3. Grammar and spelling evaluation score (1-100).
4. Content structure score (1-100): heading hierarchy, section completeness, logical flow.
5. Compliance readiness (1-100): alignment with CBAHI, JCI, ISO 9001 documentation requirements.
6. List 3-5 specific, actionable improvement suggestions.
7. Identify key sections and rate their relevance/completeness.

Return your analysis as structured text with clear section labels.`;

    const response = await aiAgentService.chat(prompt, true);
    return this.parseAnalysisResponse(response.response, content);
  }

  /**
   * Check document compliance with healthcare standards
   */
  private async checkCompliance(content: string): Promise<string[]> {
    const prompt = `You are a healthcare accreditation compliance auditor. Check this document for compliance gaps against leading accreditation standards.

Content:
${content}

Check against these frameworks:
- CBAHI (Saudi Central Board for Accreditation) — Essential Safety Requirements.
- JCI (Joint Commission International) — International Patient Safety Goals, documentation standards.
- ISO 9001:2015 — Quality Management Systems (clauses 7, 8, 10).
- WHO Patient Safety guidelines.

For each compliance gap found, state:
1. The specific requirement or standard not met.
2. The affected section of the document.
3. A brief corrective recommendation.

Return each issue as a separate line. If the document is well-compliant, note areas of strength instead.`;

    const response = await aiAgentService.chat(prompt, true);

    const complianceIssues = response.response
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line && line.length > 5);

    return complianceIssues;
  }

  /**
   * Generate AI-powered content suggestions based on document type
   */
  async generateContentSuggestions(documentType: string, context: any): Promise<string[]> {
    const prompt = `Suggest key content sections and details for a ${documentType} document.
    Context: ${JSON.stringify(context)}
    
    Requirements:
    1. Be specific and actionable
    2. Follow healthcare documentation standards
    3. Include requirements from relevant standards (JCI, DNV, OHAS, ISO)
    4. Focus on practical implementation details
    
    Return 5-7 key content suggestions.`;

    const response = await aiAgentService.chat(prompt, true);

    return response.response
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line && line.length > 5)
      .slice(0, 7);
  }

  /**
   * Generate AI-powered document outline
   */
  async generateDocumentOutline(templateId: string, context: any): Promise<string[]> {
    const template = documentTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const prompt = `Generate a comprehensive document outline for ${template.name}.
    Context: ${JSON.stringify(context)}
    Template Description: ${template.description}
    
    Requirements:
    1. Follow standard document structure
    2. Include all relevant sections
    3. Be specific about what should be included in each section
    4. Follow healthcare documentation best practices
    
    Return a detailed outline with section descriptions.`;

    const response = await aiAgentService.chat(prompt, true);

    return response.response
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line && line.length > 5);
  }

  /**
   * Generate AI-powered executive summary
   */
  async generateExecutiveSummary(content: string): Promise<string> {
    const prompt = `Generate a concise executive summary for this document:
    
    ${content}
    
    Requirements:
    1. Be clear and concise (150-200 words)
    2. Highlight key points and conclusions
    3. Include recommendations and next steps
    4. Use professional language appropriate for healthcare settings
    
    Focus on what stakeholders need to know at a glance.`;

    const response = await aiAgentService.chat(prompt, true);
    return response.response;
  }

  /**
   * Parse AI analysis response into structured DocumentAnalysisResponse
   */
  private parseAnalysisResponse(aiText: string, originalContent: string): DocumentAnalysisResponse {
    // Try to extract scores from AI response — look for patterns like "Score: 85" or "85/100"
    const extractScore = (labels: string[]): number => {
      for (const label of labels) {
        const patterns = [
          new RegExp(`${label}[:\\s]*?(\\d{1,3})(?:\\s*(?:/100|%))`, 'i'),
          new RegExp(`${label}[:\\s]*?(\\d{1,3})`, 'i'),
        ];
        for (const pat of patterns) {
          const match = aiText.match(pat);
          if (match) {
            const val = parseInt(match[1], 10);
            if (val >= 0 && val <= 100) return val;
          }
        }
      }
      return 0; // Return 0 if no score found — indicates AI didn't provide it
    };

    const contentScore = extractScore(['content quality', 'content score', 'overall score', 'overall quality']) ||
      extractScore(['quality']);
    const readabilityScore = extractScore(['readability', 'flesch', 'reading ease']);
    const grammarScore = extractScore(['grammar', 'spelling']);
    const structureScore = extractScore(['structure', 'organization']);

    // Extract improvement suggestions (lines starting with - or •)
    const suggestionLines = aiText
      .split('\n')
      .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(l => l.length > 15 && l.length < 300);

    // Extract compliance issues
    const complianceIssues: DocumentAnalysisResponse['complianceIssues'] = [];
    const complianceSection = aiText.match(/compliance[^]*?(?=\n\n|\n#{1,3}\s|$)/i);
    if (complianceSection) {
      complianceSection[0]
        .split('\n')
        .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(l => l.length > 10)
        .forEach(issue => {
          complianceIssues.push({
            type: issue.toLowerCase().includes('critical') || issue.toLowerCase().includes('error') ? 'error' :
              issue.toLowerCase().includes('warning') || issue.toLowerCase().includes('missing') ? 'warning' : 'info',
            section: 'Document',
            issue,
            recommendation: ''
          });
        });
    }

    return {
      contentScore: contentScore || 75,
      readabilityScore: readabilityScore || 70,
      grammarScore: grammarScore || 80,
      structureScore: structureScore || 75,
      complianceIssues: complianceIssues.length > 0 ? complianceIssues : [{
        type: 'info',
        section: 'General',
        issue: 'AI analysis completed — review the full response for detailed findings.',
        recommendation: 'Review AI suggestions below for specific improvements.'
      }],
      improvementSuggestions: suggestionLines.slice(0, 7),
      keySections: [{
        title: 'Full Document',
        startIndex: 0,
        endIndex: originalContent.length,
        relevanceScore: 100
      }]
    };
  }

  /**
   * Compute content quality statistics using AI
   */
  private async computeContentStatistics(content: string): Promise<{
    readabilityScore: number;
    grammarIssues: number;
    clarityScore: number;
    professionalismScore: number;
  }> {
    try {
      const prompt = `Rate this healthcare document on a scale of 0-100 for each metric. Return ONLY a JSON object with these exact keys:
{"readabilityScore": <number>, "grammarIssues": <number>, "clarityScore": <number>, "professionalismScore": <number>}

Document excerpt:
${content.substring(0, 2000)}`;

      const response = await aiAgentService.chat(prompt, true);
      const jsonMatch = response.response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          readabilityScore: Math.min(100, Math.max(0, parsed.readabilityScore || 75)),
          grammarIssues: Math.max(0, parsed.grammarIssues || 0),
          clarityScore: Math.min(100, Math.max(0, parsed.clarityScore || 75)),
          professionalismScore: Math.min(100, Math.max(0, parsed.professionalismScore || 75)),
        };
      }
    } catch {
      // Fall through to defaults
    }
    return { readabilityScore: 75, grammarIssues: 0, clarityScore: 75, professionalismScore: 75 };
  }
}

export const aiDocumentGeneratorService = AIDocumentGeneratorService.getInstance();

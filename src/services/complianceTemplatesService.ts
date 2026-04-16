/**
 * Compliance Templates Service
 * Manages template selection, previewing, and insertion into documents
 */

import {
    ComplianceTemplate,
    getAllTemplates,
    getTemplateById,
    getTemplatesByCategory,
    getTemplatesByStandard,
    searchTemplates,
} from '@/data/complianceTemplates';

export interface TemplateInsertOptions {
    replaceAll?: boolean; // Replace entire document content
    append?: boolean; // Append to existing content
}

/**
 * Get all available templates
 */
export async function fetchAllTemplates(): Promise<ComplianceTemplate[]> {
    return getAllTemplates();
}

/**
 * Filter templates by category
 */
export async function fetchTemplatesByCategory(
    category: ComplianceTemplate['category']
): Promise<ComplianceTemplate[]> {
    return getTemplatesByCategory(category);
}

/**
 * Filter templates by compliance standard
 */
export async function fetchTemplatesByStandard(
    standard: ComplianceTemplate['standard']
): Promise<ComplianceTemplate[]> {
    return getTemplatesByStandard(standard);
}

/**
 * Get single template by ID
 */
export async function fetchTemplateById(
    id: string
): Promise<ComplianceTemplate | null> {
    const template = getTemplateById(id);
    return template || null;
}

/**
 * Search templates by keyword, name, description, tags
 */
export async function searchTemplates_Service(
    query: string
): Promise<ComplianceTemplate[]> {
    if (!query || query.trim().length === 0) {
        return getAllTemplates();
    }
    return searchTemplates(query);
}

/**
 * Get template categories for filtering
 */
export async function getTemplateCategories(): Promise<
    Array<{ label: string; value: ComplianceTemplate['category'] }>
> {
    return [
        { label: 'Procedure', value: 'procedure' },
        { label: 'Policy', value: 'policy' },
        { label: 'Guideline', value: 'guideline' },
        { label: 'Form', value: 'form' },
        { label: 'Checklist', value: 'checklist' },
    ];
}

/**
 * Get compliance standards for filtering
 */
export async function getComplianceStandards(): Promise<
    Array<{ label: string; value: ComplianceTemplate['standard'] }>
> {
    return [
        { label: 'JCI (Joint Commission International)', value: 'JCI' },
        { label: 'CBAHI (Central Board for Accreditation of Healthcare Institutions)', value: 'CBAHI' },
        { label: 'MOH (Ministry of Health)', value: 'MOH' },
        { label: 'General', value: 'general' },
    ];
}

/**
 * Customize template content (e.g., organization name, dates)
 * Simple template substitution for common placeholders
 */
export function customizeTemplate(
    template: ComplianceTemplate,
    customizations: Record<string, string>
): string {
    let content = template.content;

    // Replace common placeholders
    Object.entries(customizations).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        content = content.replaceAll(placeholder, value);
    });

    return content;
}

/**
 * Get template metadata for analytics
 */
export function getTemplateMetadata(template: ComplianceTemplate): {
    wordCount: number;
    estimatedReadingTime: number;
    requiredSectionsCount: number;
    complexity: 'low' | 'medium' | 'high';
} {
    const wordCount = template.wordCount || 0;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    const sectionCount = template.requiredSections.length;

    // Simple complexity heuristic
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (wordCount > 1000 && sectionCount > 8) {
        complexity = 'high';
    } else if (wordCount > 500 || sectionCount > 5) {
        complexity = 'medium';
    }

    return {
        wordCount,
        estimatedReadingTime: readingTime,
        requiredSectionsCount: sectionCount,
        complexity,
    };
}

/**
 * Get template recommendations based on document type
 */
export function getRecommendedTemplates(
    keywords: string[]
): ComplianceTemplate[] {
    const allTemplates = getAllTemplates();
    const scored = allTemplates.map(template => {
        let score = 0;

        // Score based on keyword matches
        keywords.forEach(keyword => {
            if (template.name.toLowerCase().includes(keyword.toLowerCase())) score += 3;
            if (template.description.toLowerCase().includes(keyword.toLowerCase()))
                score += 2;
            if (template.tags.some(t => t.includes(keyword.toLowerCase()))) score += 1;
        });

        return { template, score };
    });

    // Return top 3 matches sorted by score
    return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.template);
}

/**
 * Track template usage (for analytics) — persists to Firestore `templateUsage` collection
 */
export interface TemplateUsageRecord {
    templateId: string;
    usedAt: Date;
    userId?: string;
    documentId?: string;
    customizationsApplied?: Record<string, string>;
}

const templateUsageLog: TemplateUsageRecord[] = [];

export function logTemplateUsage(record: Omit<TemplateUsageRecord, 'usedAt'>): void {
    const fullRecord: TemplateUsageRecord = { ...record, usedAt: new Date() };
    templateUsageLog.push(fullRecord);

    // Persist to Firestore (fire-and-forget, non-blocking)
    addDoc(collection(db, 'templateUsage'), {
        templateId: record.templateId,
        userId: record.userId ?? null,
        documentId: record.documentId ?? null,
        usedAt: serverTimestamp(),
    }).catch(() => {
        // Silently ignore — analytics failure must never block UX
    });
}

export function getTemplateUsageStats(templateId?: string): {
    totalUses: number;
    byTemplate: Record<string, number>;
    recentUses: TemplateUsageRecord[];
} {
    const filtered = templateId
        ? templateUsageLog.filter(r => r.templateId === templateId)
        : templateUsageLog;

    const byTemplate = filtered.reduce(
        (acc, record) => {
            acc[record.templateId] = (acc[record.templateId] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return {
        totalUses: filtered.length,
        byTemplate,
        recentUses: filtered.slice(-10),
    };
}

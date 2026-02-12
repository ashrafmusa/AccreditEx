import { AccreditationProgram, Department, Standard } from '@/types';
import { ProgramFormTemplate } from '@/types/templates';
import { getLocalizedValueLower } from '@/utils/localization';

export interface DepartmentSuggestion {
    departmentId: string;
    score: number;
    matchedSections: string[];
    matchedKeywords: string[];
    matchedCompetencyIds: string[];
    recommendedForms: ProgramFormTemplate[];
}

interface DepartmentRule {
    departmentId: string;
    weight?: number;
    sections?: string[];
    keywords?: string[];
    competencyIds?: string[];
    forms?: ProgramFormTemplate[];
}

interface ProgramRule {
    keywords: string[];
    departmentRules: DepartmentRule[];
    fallbackDepartmentIds?: string[];
}

interface ResolverContext {
    program: AccreditationProgram;
    standards: Standard[];
    departments: Department[];
}

const PROGRAM_RULES: ProgramRule[] = [
    {
        keywords: ['jci', 'joint commission'],
        departmentRules: [
            {
                departmentId: 'dep-nursing',
                weight: 1.2,
                sections: ['patient care', 'access to care', 'international patient safety goals'],
                keywords: ['nursing', 'patient care', 'bedside', 'rounding'],
                competencyIds: ['comp-bls', 'comp-acls'],
                forms: [
                    {
                        id: 'form-jci-patient-safety-rounds',
                        title: 'Patient Safety Rounds Checklist',
                        description: 'Structured checklist covering bedside safety, patient identification, and fall prevention requirements aligned with IPSG standards.',
                        category: 'checklist',
                        relatedSections: ['international patient safety goals'],
                        relatedKeywords: ['patient safety', 'rounds'],
                        requiredCompetencyIds: ['comp-bls']
                    }
                ]
            },
            {
                departmentId: 'dep-pharmacy',
                weight: 1.1,
                sections: ['medication management'],
                keywords: ['medication', 'pharmacy', 'drug'],
                competencyIds: ['comp-pharmacy'],
                forms: [
                    {
                        id: 'form-jci-medication-management-policy',
                        title: 'Medication Management Policy Template',
                        description: 'Policy template covering ordering, transcription, dispensing, and administration of medications as required by MMU standards.',
                        category: 'policy',
                        relatedSections: ['medication management'],
                        relatedKeywords: ['medication management'],
                        requiredCompetencyIds: ['comp-pharmacy']
                    },
                    {
                        id: 'form-jci-high-alert-medication-checklist',
                        title: 'High-Alert Medication Double-Check Form',
                        description: 'Operational form to document independent double-checks for high-alert medications.',
                        category: 'checklist',
                        relatedSections: ['medication management'],
                        relatedKeywords: ['high-alert medication']
                    }
                ]
            },
            {
                departmentId: 'dep-infection-control',
                weight: 1.15,
                sections: ['infection control', 'prevention and control of infections'],
                keywords: ['infection', 'hand hygiene', 'isolation'],
                competencyIds: ['comp-cic'],
                forms: [
                    {
                        id: 'form-jci-hand-hygiene-audit',
                        title: 'Hand Hygiene Compliance Audit Tool',
                        description: 'Audit checklist to monitor hand hygiene adherence aligned with PCI requirements.',
                        category: 'checklist',
                        relatedSections: ['prevention and control of infections'],
                        relatedKeywords: ['hand hygiene'],
                        requiredCompetencyIds: ['comp-cic']
                    }
                ]
            },
            {
                departmentId: 'dep-quality',
                weight: 1,
                sections: ['quality improvement', 'patient safety'],
                keywords: ['quality improvement', 'patient safety', 'performance indicator'],
                competencyIds: ['comp-cphq', 'comp-risk-mgmt'],
                forms: [
                    {
                        id: 'form-jci-quality-dashboard',
                        title: 'Quality Indicator Dashboard Template',
                        description: 'Ready-to-use dashboard outline for tracking QPS performance indicators and patient safety metrics.',
                        category: 'other',
                        relatedSections: ['quality improvement and patient safety'],
                        relatedKeywords: ['indicator', 'performance'],
                        requiredCompetencyIds: ['comp-cphq']
                    }
                ]
            },
            {
                departmentId: 'dep-facilities',
                sections: ['facility management', 'hazardous materials'],
                keywords: ['facility', 'hazardous', 'maintenance'],
                competencyIds: ['comp-facility-mgmt'],
                forms: [
                    {
                        id: 'form-jci-safety-round',
                        title: 'Facility Safety Round Checklist',
                        description: 'Checklist for monthly facility safety rounds covering life safety, hazardous materials, and equipment readiness.',
                        category: 'checklist',
                        relatedSections: ['facility management and safety'],
                        relatedKeywords: ['facility safety'],
                        requiredCompetencyIds: ['comp-facility-mgmt']
                    }
                ]
            },
            {
                departmentId: 'dep-governance',
                weight: 0.9,
                sections: ['governance', 'leadership'],
                keywords: ['leadership', 'governance', 'strategic'],
                competencyIds: ['comp-leadership'],
                forms: [
                    {
                        id: 'form-jci-governance-review',
                        title: 'Governance Effectiveness Review Template',
                        description: 'Template to document board and leadership effectiveness assessments aligned with GLD standards.',
                        category: 'other',
                        relatedSections: ['governance, leadership, and direction'],
                        relatedKeywords: ['governance review'],
                        requiredCompetencyIds: ['comp-leadership']
                    }
                ]
            }
        ],
        fallbackDepartmentIds: ['dep-quality']
    },
    {
        keywords: ['cbahi'],
        departmentRules: [
            {
                departmentId: 'dep-ed',
                weight: 1.2,
                sections: ['patient safety', 'emergency management'],
                keywords: ['emergency', 'trauma', 'resuscitation'],
                competencyIds: ['comp-atls', 'comp-acls'],
                forms: [
                    {
                        id: 'form-cbahi-emergency-readiness',
                        title: 'Emergency Department Readiness Checklist',
                        description: 'Checklist ensuring rapid response readiness, equipment, and drill compliance for CBHAI PS standards.',
                        category: 'checklist',
                        relatedSections: ['patient safety'],
                        relatedKeywords: ['emergency readiness'],
                        requiredCompetencyIds: ['comp-atls']
                    }
                ]
            },
            {
                departmentId: 'dep-pharmacy',
                sections: ['medication management'],
                keywords: ['medication', 'reconciliation'],
                competencyIds: ['comp-pharmacy'],
                forms: [
                    {
                        id: 'form-cbahi-medication-reconciliation',
                        title: 'Medication Reconciliation Form',
                        description: 'Standardized form for capturing medication reconciliation at transitions of care.',
                        category: 'checklist',
                        relatedSections: ['medication management'],
                        relatedKeywords: ['medication reconciliation'],
                        requiredCompetencyIds: ['comp-pharmacy']
                    }
                ]
            },
            {
                departmentId: 'dep-patient-relations',
                sections: ['patient rights'],
                keywords: ['complaint', 'informed consent', 'patient rights'],
                competencyIds: ['comp-patient-advocacy'],
                forms: [
                    {
                        id: 'form-cbahi-patient-complaint-log',
                        title: 'Patient Complaint Tracking Log',
                        description: 'Log template to capture complaints, resolutions, and follow-up activities.',
                        category: 'other',
                        relatedSections: ['patient rights and education'],
                        relatedKeywords: ['complaint management'],
                        requiredCompetencyIds: ['comp-patient-advocacy']
                    }
                ]
            },
            {
                departmentId: 'dep-quality',
                sections: ['quality management'],
                keywords: ['quality management', 'clinical audit'],
                competencyIds: ['comp-cphq', 'comp-risk-mgmt'],
                forms: [
                    {
                        id: 'form-cbahi-audit-plan',
                        title: 'Clinical Audit Plan Template',
                        description: 'Template for defining scope, methodology, and follow-up for clinical audits required under CBHAI QM standards.',
                        category: 'other',
                        relatedSections: ['quality management'],
                        relatedKeywords: ['audit plan'],
                        requiredCompetencyIds: ['comp-cphq']
                    }
                ]
            },
            {
                departmentId: 'dep-facilities',
                sections: ['facility management'],
                keywords: ['facility', 'equipment', 'maintenance'],
                competencyIds: ['comp-facility-mgmt'],
                forms: [
                    {
                        id: 'form-cbahi-equipment-maintenance',
                        title: 'Medical Equipment Maintenance Log',
                        description: 'Log template for preventive maintenance and calibration documentation.',
                        category: 'evidence',
                        relatedSections: ['facility management'],
                        relatedKeywords: ['maintenance log'],
                        requiredCompetencyIds: ['comp-facility-mgmt']
                    }
                ]
            }
        ],
        fallbackDepartmentIds: ['dep-quality']
    },
    {
        keywords: ['dnv', 'niaho'],
        departmentRules: [
            {
                departmentId: 'dep-quality',
                weight: 1.15,
                sections: ['quality management', 'iso 9001'],
                keywords: ['quality management system', 'iso'],
                competencyIds: ['comp-cphq'],
                forms: [
                    {
                        id: 'form-dnv-qms-manual',
                        title: 'Quality Management System Manual Outline',
                        description: 'Structured outline for ISO 9001 aligned quality management manual.',
                        category: 'policy',
                        relatedSections: ['quality management system'],
                        relatedKeywords: ['quality manual'],
                        requiredCompetencyIds: ['comp-cphq']
                    }
                ]
            },
            {
                departmentId: 'dep-nursing',
                sections: ['patient safety'],
                keywords: ['patient identification', 'fall prevention'],
                competencyIds: ['comp-bls'],
                forms: [
                    {
                        id: 'form-dnv-fall-prevention',
                        title: 'Fall Prevention Plan Template',
                        description: 'Template describing risk assessment, interventions, and monitoring for fall prevention.',
                        category: 'policy',
                        relatedSections: ['patient safety'],
                        relatedKeywords: ['fall prevention'],
                        requiredCompetencyIds: ['comp-bls']
                    }
                ]
            },
            {
                departmentId: 'dep-infection-control',
                sections: ['infection prevention'],
                keywords: ['infection prevention', 'surveillance'],
                competencyIds: ['comp-cic'],
                forms: [
                    {
                        id: 'form-dnv-infection-surveillance',
                        title: 'Infection Surveillance Summary Template',
                        description: 'Template for monthly infection surveillance reporting and trend analysis.',
                        category: 'other',
                        relatedSections: ['infection prevention'],
                        relatedKeywords: ['surveillance']
                    }
                ]
            },
            {
                departmentId: 'dep-facilities',
                sections: ['emergency management'],
                keywords: ['emergency preparedness', 'drill'],
                competencyIds: ['comp-facility-mgmt', 'comp-safety-officer'],
                forms: [
                    {
                        id: 'form-dnv-emergency-drill',
                        title: 'Emergency Drill Evaluation Form',
                        description: 'Form to capture objectives, participation, and improvement actions for emergency preparedness drills.',
                        category: 'evidence',
                        relatedSections: ['emergency management'],
                        relatedKeywords: ['drill evaluation']
                    }
                ]
            }
        ],
        fallbackDepartmentIds: ['dep-quality', 'dep-safety']
    }
];

const SECTION_WEIGHT = 3;
const KEYWORD_WEIGHT = 2;
const COMPETENCY_WEIGHT = 1.5;

const toLower = (value: string | undefined): string => (value || '').toLowerCase();

const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

export const resolveDepartmentsForProgram = ({
    program,
    standards,
    departments
}: ResolverContext): DepartmentSuggestion[] => {
    if (!program) {
        return [];
    }

    const programRule = PROGRAM_RULES.find(rule =>
        rule.keywords.some(keyword => getLocalizedValueLower(program.name, 'en').includes(keyword))
    );

    if (!programRule) {
        return [];
    }

    const programStandards = standards.filter(standard => standard.programId === program.id);

    if (programStandards.length === 0) {
        return (programRule.fallbackDepartmentIds || []).map((departmentId, index) => ({
            departmentId,
            score: 0.1 - index * 0.01,
            matchedSections: [],
            matchedKeywords: [],
            matchedCompetencyIds: [],
            recommendedForms: []
        }));
    }

    const standardIndex = programStandards.map(standard => ({
        section: toLower(standard.section),
        text: `${standard.section} ${standard.description}`.toLowerCase()
    }));

    const suggestions: DepartmentSuggestion[] = [];

    programRule.departmentRules.forEach(rule => {
        const department = departments.find(dept => dept.id === rule.departmentId);
        const matchedSections: string[] = [];
        const matchedKeywords: string[] = [];
        const matchedCompetencies: string[] = [];

        let sectionMatches = 0;
        let keywordMatches = 0;

        if (rule.sections && rule.sections.length > 0) {
            const loweredSections = rule.sections.map(toLower);
            loweredSections.forEach(sectionPattern => {
                const hasMatch = standardIndex.some(standard =>
                    standard.section.includes(sectionPattern)
                );
                if (hasMatch) {
                    sectionMatches += 1;
                    matchedSections.push(sectionPattern);
                }
            });
        }

        if (rule.keywords && rule.keywords.length > 0) {
            const loweredKeywords = rule.keywords.map(toLower);
            loweredKeywords.forEach(keyword => {
                const hasMatch = standardIndex.some(standard =>
                    standard.text.includes(keyword)
                );
                if (hasMatch) {
                    keywordMatches += 1;
                    matchedKeywords.push(keyword);
                }
            });
        }

        if (rule.competencyIds && department?.requiredCompetencyIds) {
            rule.competencyIds.forEach(competencyId => {
                if (department.requiredCompetencyIds?.includes(competencyId)) {
                    matchedCompetencies.push(competencyId);
                }
            });
        }

        if (sectionMatches === 0 && keywordMatches === 0 && matchedCompetencies.length === 0) {
            return;
        }

        const weight = rule.weight ?? 1;
        const score = weight * (
            sectionMatches * SECTION_WEIGHT +
            keywordMatches * KEYWORD_WEIGHT +
            matchedCompetencies.length * COMPETENCY_WEIGHT
        );

        suggestions.push({
            departmentId: rule.departmentId,
            score,
            matchedSections: unique(matchedSections),
            matchedKeywords: unique(matchedKeywords),
            matchedCompetencyIds: unique(matchedCompetencies),
            recommendedForms: rule.forms ? [...rule.forms] : []
        });
    });

    if (suggestions.length === 0 && programRule.fallbackDepartmentIds) {
        programRule.fallbackDepartmentIds.forEach((departmentId, index) => {
            suggestions.push({
                departmentId,
                score: 0.1 - index * 0.01,
                matchedSections: [],
                matchedKeywords: [],
                matchedCompetencyIds: [],
                recommendedForms: []
            });
        });
    }

    return suggestions.sort((a, b) => b.score - a.score);
};

export const resolveProgramForms = ({
    program,
    standards,
    departments
}: ResolverContext): ProgramFormTemplate[] => {
    const suggestions = resolveDepartmentsForProgram({ program, standards, departments });
    const forms = suggestions.flatMap(suggestion => suggestion.recommendedForms || []);
    const map = new Map<string, ProgramFormTemplate>();
    forms.forEach(form => {
        if (!map.has(form.id)) {
            map.set(form.id, form);
        }
    });
    return Array.from(map.values());
};

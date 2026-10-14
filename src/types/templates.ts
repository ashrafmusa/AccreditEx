import { ChecklistItem, PDCACycle } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  programId: string;
  inspectionProfile?: "oman-private-lab-2026";
  selfContainedChecklist?: boolean;
  category: 'accreditation' | 'compliance' | 'quality' | 'custom';
  checklist: ChecklistItemTemplate[];
  defaultPDCACycles?: PDCACycleTemplate[];
  estimatedDuration: number; // in days
  icon?: string;
  tags?: string[];
}

export interface ChecklistItemTemplate {
  title: string;
  description: string;
  category: string;
  requiredEvidence: string[];
  estimatedHours: number;
  priority?: 'high' | 'medium' | 'low';
  standardId?: string;
}

export interface PDCACycleTemplate {
  title: string;
  description: string;
  category: 'Process' | 'Quality' | 'Safety' | 'Efficiency' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  estimatedDays: number;
}

export interface ProgramFormTemplate {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  programId?: string;
  category?: string;
  relatedSections?: string[];
  relatedKeywords?: string[];
  requiredCompetencyIds?: string[];
  fields?: Array<{
    name: string;
    type: string;
    required?: boolean;
    label?: string;
  }>;
}

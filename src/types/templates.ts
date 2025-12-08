import { ChecklistItem, PDCACycle } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  programId: string;
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
}

export interface PDCACycleTemplate {
  title: string;
  description: string;
  category: 'Process' | 'Quality' | 'Safety' | 'Efficiency' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  estimatedDays: number;
}

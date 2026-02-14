/**
 * Data Mapping Service
 * Handles bidirectional field mapping and transformations between local and HIS formats
 */

import { DataMappingConfig, FHIRResource } from './types';

interface FieldMapping {
  id: string;
  localField: string;
  hisField: string;
  resourceType: string;
  direction: 'both' | 'pull' | 'push'; // pull = HIS→Local, push = Local→HIS
  transformIn?: (value: any) => any; // HIS → Local
  transformOut?: (value: any) => any; // Local → HIS
  required: boolean;
  defaultValue?: any;
  validation?: (value: any) => boolean;
  conflictResolution?: 'local' | 'hisData' | 'merge' | 'custom';
}

interface DataMappingTemplate {
  id: string;
  name: string;
  description: string;
  hisType: string;
  resourceType: string;
  mappings: FieldMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export class DataMappingService {
  private mappings: FieldMapping[] = [];
  private templates: DataMappingTemplate[] = [];
  private customTransformers: Map<string, (value: any) => any> = new Map();

  constructor() {
    this.initializeDefaultMappings();
  }

  /**
   * Create a field mapping
   */
  createMapping(mapping: Omit<FieldMapping, 'id'>): FieldMapping {
    const fieldMapping: FieldMapping = {
      id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...mapping,
    };

    this.mappings.push(fieldMapping);
    return fieldMapping;
  }

  /**
   * Update a field mapping
   */
  updateMapping(mappingId: string, updates: Partial<FieldMapping>): FieldMapping | null {
    const mapping = this.mappings.find((m) => m.id === mappingId);
    if (!mapping) return null;

    Object.assign(mapping, updates);
    mapping.id = mappingId; // Ensure ID doesn't change
    return mapping;
  }

  /**
   * Delete a field mapping
   */
  deleteMapping(mappingId: string): boolean {
    const index = this.mappings.findIndex((m) => m.id === mappingId);
    if (index === -1) return false;

    this.mappings.splice(index, 1);
    return true;
  }

  /**
   * Get mappings for a resource type
   */
  getMappings(resourceType: string, direction?: string): FieldMapping[] {
    return this.mappings.filter((m) => {
      if (m.resourceType !== resourceType) return false;
      if (direction && m.direction !== 'both' && m.direction !== direction) return false;
      return true;
    });
  }

  /**
   * Create a mapping template
   */
  createTemplate(template: Omit<DataMappingTemplate, 'id' | 'createdAt' | 'updatedAt'>): DataMappingTemplate {
    const newTemplate: DataMappingTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  /**
   * Apply a template to create mappings
   */
  applyTemplate(templateId: string): FieldMapping[] {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) return [];

    return template.mappings.map((m) => this.createMapping(m));
  }

  /**
   * Transform data from HIS format to local format
   */
  transformInbound(hisData: FHIRResource, resourceType: string): Record<string, any> {
    const localData: Record<string, any> = {};
    const mappings = this.getMappings(resourceType, 'pull');

    for (const mapping of mappings) {
      if (!mapping.direction.includes('pull')) continue;

      const hisValue = this.getNestedValue(hisData, mapping.hisField);

      if (hisValue !== undefined) {
        const transformedValue = mapping.transformIn
          ? mapping.transformIn(hisValue)
          : hisValue;

        this.setNestedValue(localData, mapping.localField, transformedValue);
      } else if (mapping.required && mapping.defaultValue !== undefined) {
        this.setNestedValue(localData, mapping.localField, mapping.defaultValue);
      }
    }

    return localData;
  }

  /**
   * Transform data from local format to HIS format
   */
  transformOutbound(localData: Record<string, any>, resourceType: string): Partial<FHIRResource> {
    const hisData: Record<string, any> = {};
    const mappings = this.getMappings(resourceType, 'push');

    for (const mapping of mappings) {
      if (!mapping.direction.includes('push')) continue;

      const localValue = this.getNestedValue(localData, mapping.localField);

      if (localValue !== undefined) {
        // Validate before transformation
        if (mapping.validation && !mapping.validation(localValue)) {
          console.warn(`Validation failed for field ${mapping.localField}`);
          continue;
        }

        const transformedValue = mapping.transformOut
          ? mapping.transformOut(localValue)
          : localValue;

        this.setNestedValue(hisData, mapping.hisField, transformedValue);
      }
    }

    return hisData;
  }

  /**
   * Validate data against mappings
   */
  validateData(data: Record<string, any>, resourceType: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const mappings = this.getMappings(resourceType);

    for (const mapping of mappings) {
      if (!mapping.required) continue;

      const value = this.getNestedValue(data, mapping.localField);

      if (value === undefined || value === null || value === '') {
        errors.push(`Required field missing: ${mapping.localField}`);
        continue;
      }

      if (mapping.validation && !mapping.validation(value)) {
        errors.push(`Validation failed for field: ${mapping.localField}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Register a custom transformer function
   */
  registerTransformer(name: string, transformer: (value: any) => any): void {
    this.customTransformers.set(name, transformer);
  }

  /**
   * Get a registered transformer
   */
  getTransformer(name: string): ((value: any) => any) | undefined {
    return this.customTransformers.get(name);
  }

  /**
   * Get bidirectional mapping preview
   */
  getMappingPreview(
    sourceData: Record<string, any>,
    resourceType: string,
    direction: 'inbound' | 'outbound'
  ): { source: Record<string, any>; target: Record<string, any>; unmappedFields: string[] } {
    const unmappedFields: string[] = [];
    let target: Record<string, any> = {};

    if (direction === 'inbound') {
      target = this.transformInbound(sourceData as FHIRResource, resourceType);

      // Find unmapped HIS fields
      const mappedHisFields = new Set(
        this.getMappings(resourceType, 'pull').map((m) => m.hisField)
      );

      for (const key in sourceData) {
        if (!mappedHisFields.has(key)) {
          unmappedFields.push(key);
        }
      }
    } else {
      target = this.transformOutbound(sourceData, resourceType);

      // Find unmapped local fields
      const mappedLocalFields = new Set(
        this.getMappings(resourceType, 'push').map((m) => m.localField)
      );

      for (const key in sourceData) {
        if (!mappedLocalFields.has(key)) {
          unmappedFields.push(key);
        }
      }
    }

    return {
      source: sourceData,
      target,
      unmappedFields,
    };
  }

  /**
   * Merge inbound and local data using conflict resolution
   */
  mergeData(
    hisData: FHIRResource,
    localData: Record<string, any>,
    resourceType: string,
    strategy: 'his' | 'local' | 'merge' = 'merge'
  ): Record<string, any> {
    const mappings = this.getMappings(resourceType);
    const merged: Record<string, any> = { ...localData };

    for (const mapping of mappings) {
      if (!mapping.direction.includes('pull')) continue;

      const hisValue = this.getNestedValue(hisData, mapping.hisField);
      const localValue = this.getNestedValue(localData, mapping.localField);

      if (strategy === 'his') {
        if (hisValue !== undefined) {
          const transformed = mapping.transformIn ? mapping.transformIn(hisValue) : hisValue;
          this.setNestedValue(merged, mapping.localField, transformed);
        }
      } else if (strategy === 'local') {
        // Keep local value - no change needed
        continue;
      } else if (strategy === 'merge') {
        // Smart merge based on mapping configuration
        const resolution = mapping.conflictResolution || 'local';

        if (resolution === 'hisData') {
          if (hisValue !== undefined) {
            const transformed = mapping.transformIn ? mapping.transformIn(hisValue) : hisValue;
            this.setNestedValue(merged, mapping.localField, transformed);
          }
        } else if (resolution === 'local') {
          // Keep local value
          continue;
        } else if (resolution === 'merge' && Array.isArray(hisValue) && Array.isArray(localValue)) {
          // Merge arrays
          const combined = [...new Set([...localValue, ...hisValue])];
          this.setNestedValue(merged, mapping.localField, combined);
        }
      }
    }

    return merged;
  }

  /**
   * Get statistics about mappings
   */
  getStatistics() {
    return {
      totalMappings: this.mappings.length,
      totalTemplates: this.templates.length,
      mappingsByResourceType: this.groupByResourceType(),
      mappingsByDirection: {
        pull: this.mappings.filter((m) => m.direction === 'pull' || m.direction === 'both').length,
        push: this.mappings.filter((m) => m.direction === 'push' || m.direction === 'both').length,
        both: this.mappings.filter((m) => m.direction === 'both').length,
      },
      requiredMappings: this.mappings.filter((m) => m.required).length,
    };
  }

  /**
   * Export mappings for configuration backup
   */
  exportMappings(): { mappings: FieldMapping[]; templates: DataMappingTemplate[] } {
    return {
      mappings: JSON.parse(JSON.stringify(this.mappings)),
      templates: JSON.parse(JSON.stringify(this.templates)),
    };
  }

  /**
   * Import mappings from configuration
   */
  importMappings(data: { mappings: FieldMapping[]; templates: DataMappingTemplate[] }): void {
    this.mappings = [...this.mappings, ...data.mappings];
    this.templates = [...this.templates, ...data.templates];
  }

  /**
   * Group mappings by resource type
   */
  private groupByResourceType(): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const mapping of this.mappings) {
      if (!groups[mapping.resourceType]) {
        groups[mapping.resourceType] = 0;
      }
      groups[mapping.resourceType]++;
    }

    return groups;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const prop = parts[i];
      if (!current[prop] || typeof current[prop] !== 'object') {
        current[prop] = {};
      }
      current = current[prop];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Initialize default mappings for common FHIR resources
   */
  private initializeDefaultMappings(): void {
    // Patient mappings
    this.createMapping({
      localField: 'firstName',
      hisField: 'name.0.given.0',
      resourceType: 'Patient',
      direction: 'both',
      required: true,
      transformIn: (val) => val || '',
      transformOut: (val) => val || '',
    });

    this.createMapping({
      localField: 'lastName',
      hisField: 'name.0.family',
      resourceType: 'Patient',
      direction: 'both',
      required: true,
      transformIn: (val) => val || '',
      transformOut: (val) => val || '',
    });

    this.createMapping({
      localField: 'dateOfBirth',
      hisField: 'birthDate',
      resourceType: 'Patient',
      direction: 'both',
      required: false,
      transformIn: (val) => (val ? new Date(val).toISOString().split('T')[0] : null),
      transformOut: (val) => val || '',
    });

    this.createMapping({
      localField: 'email',
      hisField: 'telecom.0.value',
      resourceType: 'Patient',
      direction: 'both',
      required: false,
      validation: (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    });

    // Observation mappings
    this.createMapping({
      localField: 'value',
      hisField: 'valueQuantity.value',
      resourceType: 'Observation',
      direction: 'both',
      required: true,
      transformIn: (val) => parseFloat(val),
      transformOut: (val) => val?.toString() || '',
    });

    this.createMapping({
      localField: 'unit',
      hisField: 'valueQuantity.unit',
      resourceType: 'Observation',
      direction: 'both',
      required: false,
    });

    this.createMapping({
      localField: 'observedAt',
      hisField: 'effectiveDateTime',
      resourceType: 'Observation',
      direction: 'both',
      required: true,
      transformIn: (val) => new Date(val).toISOString(),
      transformOut: (val) => val || new Date().toISOString(),
    });
  }
}

// Singleton instance
export const dataMappingService = new DataMappingService();

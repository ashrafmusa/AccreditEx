/**
 * useAIAssistant hook
 * Provides AI assistant capabilities for form/document provision and smart assistance.
 * Wired to aiAgentService for actual AI calls.
 */

import { useState, useCallback } from 'react';
import { aiAgentService } from '@/services/aiAgentService';
import { aiDocumentGeneratorService } from '@/services/aiDocumentGeneratorService';
import { documentTemplates } from '@/data/documentTemplates';

export interface AIAssistantResult {
    getForm: (formId: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    generateDocument: (templateId: string, context?: Record<string, any>) => Promise<any>;
    askAssistant: (question: string) => Promise<string>;
    quickActions: Record<string, (...args: any[]) => Promise<any>>;
    getAvailableContent: () => { templates: any[]; forms: any[] };
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export const useAIAssistant = (): AIAssistantResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const askAssistant = useCallback(async (question: string): Promise<string> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await aiAgentService.chat(question, true);
            return response.response || '';
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'AI assistant error';
            setError(msg);
            return '';
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getForm = useCallback(async (formId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await aiAgentService.chat(
                `Generate a healthcare accreditation form for "${formId}". Include all required fields, validation rules, and compliance references. Return structured JSON with fields array.`,
                true
            );
            return response.response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to get form';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const search = useCallback(async (query: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await aiAgentService.chat(
                `Search AccreditEx knowledge base for: "${query}". Provide relevant standards, policies, procedures, and recommendations.`,
                true
            );
            return response.response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Search failed';
            setError(msg);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateDocument = useCallback(async (templateId: string, context?: Record<string, any>) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await aiDocumentGeneratorService.generateDocument({
                templateId,
                context: context || {},
            });
            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Document generation failed';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getAvailableContent = useCallback(() => ({
        templates: documentTemplates.map(t => ({ id: t.id, name: t.name, description: t.description })),
        forms: [
            { id: 'incident-report', name: 'Incident Report Form' },
            { id: 'safety-checklist', name: 'Safety Checklist' },
            { id: 'risk-assessment', name: 'Risk Assessment Form' },
            { id: 'capa-form', name: 'CAPA Form' },
            { id: 'audit-checklist', name: 'Audit Checklist' },
        ]
    }), []);

    const quickActions: Record<string, (...args: any[]) => Promise<any>> = {
        getIncidentForm: () => getForm('incident-report'),
        getSafetyChecklist: () => getForm('safety-checklist'),
        getPolicyTemplate: () => generateDocument('policy-template'),
        getRiskAssessment: () => getForm('risk-assessment'),
    };

    return {
        getForm,
        search,
        generateDocument,
        askAssistant,
        quickActions,
        getAvailableContent,
        isLoading,
        error,
        clearError,
    };
};

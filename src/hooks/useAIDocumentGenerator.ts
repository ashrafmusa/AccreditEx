import { useState, useCallback } from 'react';
import { DocumentGenerationRequest, DocumentGenerationResponse } from '@/services/aiDocumentGeneratorService';
import { aiDocumentGeneratorService } from '@/services/aiDocumentGeneratorService';

export interface AIDocumentGeneratorState {
  isGenerating: boolean;
  isAnalyzing: boolean;
  generatedContent: string;
  suggestions: string[];
  complianceIssues: string[];
  wordCount: number;
  readingTime: number;
  generationTime: number;
  analysis: any;
  error: string | null;
}

export interface AIDocumentGeneratorActions {
  generateDocument: (request: DocumentGenerationRequest) => Promise<DocumentGenerationResponse>;
  analyzeDocument: (content: string) => Promise<any>;
  improveContent: (content: string, suggestions: any) => Promise<any>;
  clearState: () => void;
}

export interface AIDocumentGeneratorHook extends AIDocumentGeneratorState, AIDocumentGeneratorActions {}

export function useAIDocumentGenerator(): AIDocumentGeneratorHook {
  const [state, setState] = useState<AIDocumentGeneratorState>({
    isGenerating: false,
    isAnalyzing: false,
    generatedContent: '',
    suggestions: [],
    complianceIssues: [],
    wordCount: 0,
    readingTime: 0,
    generationTime: 0,
    analysis: null,
    error: null
  });

  const generateDocument = useCallback(async (request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const response = await aiDocumentGeneratorService.generateDocument(request);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedContent: response.content,
        suggestions: response.suggestions,
        complianceIssues: response.complianceIssues,
        wordCount: response.wordCount,
        readingTime: response.estimatedReadingTime,
        generationTime: response.generationTime
      }));

      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate document'
      }));
      
      throw error;
    }
  }, []);

  const analyzeDocument = useCallback(async (content: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      const analysis = await aiDocumentGeneratorService.analyzeDocument(content);
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysis
      }));

      return analysis;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to analyze document'
      }));
      
      throw error;
    }
  }, []);

  const improveContent = useCallback(async (content: string, suggestions: any) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const response = await aiDocumentGeneratorService.improveContent({
        content,
        suggestions: suggestions || {
          improveClarity: true,
          enhanceStructure: true,
          fixGrammar: true,
          improveReadability: true,
          enhanceProfessionalism: true
        }
      });
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedContent: response.improvedContent,
        wordCount: response.improvedContent.split(' ').length,
        readingTime: Math.ceil(response.improvedContent.split(' ').length / 200)
      }));

      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to improve content'
      }));
      
      throw error;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isGenerating: false,
      isAnalyzing: false,
      generatedContent: '',
      suggestions: [],
      complianceIssues: [],
      wordCount: 0,
      readingTime: 0,
      generationTime: 0,
      analysis: null,
      error: null
    });
  }, []);

  return {
    ...state,
    generateDocument,
    analyzeDocument,
    improveContent,
    clearState
  };
}

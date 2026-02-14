import { useState } from 'react';
import { useAIAgent } from './useAIAgent';
import { PDCAStage } from '@/types';

interface Suggestion {
  id: string;
  content: string;
  category: 'Root Cause' | 'Action' | 'Metric' | 'General';
}

export const usePDCASuggestions = () => {
  const { sendMessage, isLoading } = useAIAgent();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const generateSuggestions = async (
    stage: PDCAStage,
    context: { title: string; description: string; category?: string }
  ) => {
    // In a real implementation, we would call the AI agent with a specific prompt
    // For now, we'll simulate some suggestions based on the stage

    // const response = await askAgent(`Generate suggestions for PDCA stage ${stage} for a project about ${context.title}`);

    // Mock response
    const mockSuggestions: Suggestion[] = [];

    if (stage === 'Plan') {
      mockSuggestions.push(
        { id: '1', content: 'Consider using the 5 Whys technique to identify the root cause.', category: 'Root Cause' },
        { id: '2', content: 'Define clear, measurable success metrics (KPIs) before proceeding.', category: 'Metric' }
      );
    } else if (stage === 'Do') {
      mockSuggestions.push(
        { id: '3', content: 'Ensure all team members are trained on the new process changes.', category: 'Action' },
        { id: '4', content: 'Document any deviations from the plan immediately.', category: 'General' }
      );
    } else if (stage === 'Check') {
      mockSuggestions.push(
        { id: '5', content: 'Compare current data against the baseline metrics collected in the Plan stage.', category: 'Metric' },
        { id: '6', content: 'Look for unintended side effects of the changes.', category: 'General' }
      );
    } else if (stage === 'Act') {
      mockSuggestions.push(
        { id: '7', content: 'Update standard operating procedures (SOPs) to reflect the successful changes.', category: 'Action' },
        { id: '8', content: 'Share lessons learned with other relevant departments.', category: 'General' }
      );
    }

    setSuggestions(mockSuggestions);
  };

  return {
    suggestions,
    isLoading,
    generateSuggestions
  };
};

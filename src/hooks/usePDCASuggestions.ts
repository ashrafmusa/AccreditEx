import { useState, useCallback } from 'react';
import { aiAgentService } from '@/services/aiAgentService';
import { PDCAStage } from '@/types';

interface Suggestion {
  id: string;
  content: string;
  category: 'Root Cause' | 'Action' | 'Metric' | 'General';
}

export const usePDCASuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const generateSuggestions = useCallback(async (
    stage: PDCAStage,
    context: { title: string; description: string; category?: string }
  ) => {
    setIsLoading(true);
    try {
      const prompt = `You are a healthcare quality improvement expert. Generate PDCA suggestions for the "${stage}" stage.

Project: ${context.title}
Description: ${context.description}
${context.category ? `Category: ${context.category}` : ''}

Provide 3-4 actionable suggestions. For each, specify a category from: Root Cause, Action, Metric, General.

Format each suggestion as:
[Category] Suggestion text

Example:
[Root Cause] Use the 5 Whys technique to trace back to the systemic cause.
[Metric] Define a target reduction of 20% in incident reports within 90 days.`;

      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || '';

      const parsed: Suggestion[] = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('['))
        .map((line, idx) => {
          const match = line.match(/^\[(Root Cause|Action|Metric|General)\]\s*(.+)/i);
          if (match) {
            return {
              id: `${stage}-${idx}`,
              content: match[2].trim(),
              category: match[1] as Suggestion['category'],
            };
          }
          return null;
        })
        .filter((s): s is Suggestion => s !== null);

      // If AI response didn't follow format, wrap raw lines as General
      if (parsed.length === 0 && text.trim()) {
        const fallback = text
          .split('\n')
          .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
          .filter(l => l.length > 10)
          .slice(0, 4)
          .map((content, idx) => ({
            id: `${stage}-${idx}`,
            content,
            category: 'General' as const,
          }));
        setSuggestions(fallback);
      } else {
        setSuggestions(parsed);
      }
    } catch (error) {
      console.error('PDCA suggestion error:', error);
      // Graceful fallback — provide a single helpful suggestion
      setSuggestions([{
        id: `${stage}-fallback`,
        content: 'AI suggestions are temporarily unavailable. Review your PDCA documentation and consult your quality team for guidance.',
        category: 'General',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    generateSuggestions
  };
};

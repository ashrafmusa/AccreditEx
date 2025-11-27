import React, { useState } from 'react';
import { PDCAStage, PDCAStageHistory } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { XMarkIcon } from '../icons';

interface PDCAStageTransitionFormProps {
  currentStage: PDCAStage;
  onConfirm: (notes: string, attachments: string[]) => void;
  onCancel: () => void;
}

const PDCAStageTransitionForm: React.FC<PDCAStageTransitionFormProps> = ({
  currentStage,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get next stage
  const getNextStage = (current: PDCAStage): PDCAStage | null => {
    const stageOrder: PDCAStage[] = ['Plan', 'Do', 'Check', 'Act', 'Completed'];
    const currentIndex = stageOrder.indexOf(current);
    if (currentIndex < stageOrder.length - 1) {
      return stageOrder[currentIndex + 1];
    }
    return null;
  };

  const nextStage = getNextStage(currentStage);

  // Get stage-specific checklist
  const getStageChecklist = (stage: PDCAStage): string[] => {
    switch (stage) {
      case 'Plan':
        return [
          t('rootCauseAnalysisCompleted') || 'Root cause analysis completed',
          t('actionPlanDefined') || 'Action plan defined',
          t('baselineMetricsRecorded') || 'Baseline metrics recorded',
          t('ownerAssigned') || 'Owner assigned'
        ];
      case 'Do':
        return [
          t('allImplementationTasksCompleted') || 'All implementation tasks completed',
          t('evidenceDocumentsAttached') || 'Evidence documents attached',
          t('minimumTimeElapsed') || 'Minimum time elapsed (30 days)'
        ];
      case 'Check':
        return [
          t('effectivenessVerified') || 'Effectiveness verified',
          t('actualMetricsRecorded') || 'Actual metrics recorded and compared to target',
          t('improvementConfirmed') || 'Improvement confirmed or corrective actions defined'
        ];
      case 'Act':
        return [
          t('standardizationStepsDocumented') || 'Standardization steps documented',
          t('lessonsLearnedCaptured') || 'Lessons learned captured',
          t('finalApprovalObtained') || 'Final approval obtained'
        ];
      default:
        return [];
    }
  };

  const checklist = getStageChecklist(currentStage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: string[] = [];
    if (!notes.trim()) {
      errors.push(t('notesRequired') || 'Notes are required');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    onConfirm(notes, attachments);
  };

  if (!nextStage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-brand-text-primary dark:text-dark-brand-text-primary">
            {t('cycleAlreadyCompleted') || 'This cycle is already completed.'}
          </p>
          <button
            onClick={onCancel}
            className="mt-4 w-full py-2 px-4 bg-brand-primary text-white rounded hover:bg-brand-primary-dark transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-brand-surface dark:bg-dark-brand-surface border-b border-brand-border dark:border-dark-brand-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {t('advanceToNextStage')}
            </h2>
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {currentStage} → {nextStage}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-brand-text-secondary hover:text-brand-text-primary dark:hover:text-dark-brand-text-primary transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Checklist */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-3">
              {t('completionChecklist') || 'Completion Checklist'}
            </h3>
            <div className="space-y-2 bg-brand-surface-secondary dark:bg-dark-brand-surface-secondary rounded-lg p-4">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-brand-primary mt-0.5 mr-3" />
                  <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2 italic">
              {t('checklistInformational') || 'This checklist is for reference. Please confirm all items are complete before advancing.'}
            </p>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t('transitionNotes')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder={t('describeWhatWasAccomplished') || 'Describe what was accomplished in this stage...'}
            />
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {t('attachments')} ({t('optional')})
            </label>
            <div className="border-2 border-dashed border-brand-border dark:border-dark-brand-border rounded-lg p-4 text-center">
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t('attachEvidenceDocuments') || 'Attach evidence documents (feature coming soon)'}
              </p>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-brand-border dark:border-dark-brand-border rounded-lg text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-brand-surface-secondary dark:hover:bg-dark-brand-surface-secondary transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors font-semibold"
            >
              {t('confirmAdvance')} → {nextStage}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PDCAStageTransitionForm;

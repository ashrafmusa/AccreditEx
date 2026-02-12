import React, { useState, useEffect } from 'react';
import { DocumentData } from 'firebase/firestore';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import { SpinnerIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@/components/icons';
import { updateDocument } from '@/services/firebaseSetupService';

interface DocumentEditorProps {
  collectionName: string;
  documentId: string;
  initialData: DocumentData;
  onClose: () => void;
  onSave?: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  collectionName,
  documentId,
  initialData,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [jsonContent, setJsonContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    // Format JSON for display
    const formatted = JSON.stringify(initialData, null, 2);
    setJsonContent(formatted);
  }, [initialData]);

  const validateJSON = (jsonStr: string): { valid: boolean; data?: DocumentData; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Validate that it's an object
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { valid: false, error: 'Document must be a JSON object' };
      }

      // Validate no _id field modification
      if (parsed._id && parsed._id !== documentId) {
        return { valid: false, error: 'Cannot modify document ID' };
      }

      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid JSON' };
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setJsonContent(newContent);
    setIsModified(true);

    // Validate as user types
    const validation = validateJSON(newContent);
    if (validation.valid) {
      setValidationErrors([]);
    } else {
      setValidationErrors([validation.error || 'Invalid JSON']);
    }
  };

  const handleSave = async () => {
    const validation = validateJSON(jsonContent);
    
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid JSON');
      return;
    }

    // Remove _id and system fields before saving
    const { _id, createdAt, ...dataToSave } = validation.data || {};

    setIsSaving(true);
    try {
      await updateDocument(collectionName, documentId, dataToSave);
      toast.success(t('documentUpdatedSuccessfully'));
      setIsModified(false);
      if (onSave) onSave();
      
      // Keep modal open but show success
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save document');
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isModified) {
      if (window.confirm(t('discardChanges'))) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
        {isModified && (
          <>
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>{t('unsavedChanges')}</span>
          </>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !isModified || validationErrors.length > 0}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              {t('save')}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={handleCancel}
      title={`Edit Document: ${collectionName}/${documentId}`}
      footer={footer}
      size="xl"
    >
      <div className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-200 font-semibold">
              {t('validationError')}
            </p>
            <ul className="mt-2 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-600 dark:text-red-300">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            Edit the JSON data below. System fields (createdAt, _id) are managed automatically.
          </p>
        </div>

        {/* JSON Editor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Document Content
          </label>
          <textarea
            value={jsonContent}
            onChange={handleJsonChange}
            className={`w-full h-96 p-3 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none ${
              validationErrors.length > 0
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-brand-primary'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
            spellCheck="false"
          />
        </div>

        {/* Character Count */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {jsonContent.length} characters
        </div>
      </div>
    </Modal>
  );
};

export default DocumentEditor;

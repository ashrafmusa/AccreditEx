import React, { useState } from 'react';
import { DocumentData } from 'firebase/firestore';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import { SpinnerIcon, CheckCircleIcon } from '@/components/icons';
import { createDocument } from '@/services/firebaseSetupService';

interface CreateDocumentModalProps {
  collectionName: string;
  existingIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  collectionName,
  existingIds,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [documentId, setDocumentId] = useState('');
  const [useAutoId, setUseAutoId] = useState(false);
  const [jsonContent, setJsonContent] = useState('{}');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateInputs = (): boolean => {
    const newErrors: string[] = [];

    // Validate document ID
    if (!useAutoId) {
      if (!documentId.trim()) {
        newErrors.push('Document ID is required');
      } else if (existingIds.includes(documentId.trim())) {
        newErrors.push('Document ID already exists in this collection');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(documentId.trim())) {
        newErrors.push('Document ID can only contain alphanumeric characters, hyphens, and underscores');
      }
    }

    // Validate JSON
    try {
      const parsed = JSON.parse(jsonContent);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        newErrors.push('Document content must be a valid JSON object');
      }
    } catch {
      newErrors.push('Invalid JSON format');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const generateDocumentId = (): string => {
    // Generate ID like: doc-1733300000000-12345
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `doc-${timestamp}-${random}`;
  };

  const handleCreate = async () => {
    if (!validateInputs()) {
      return;
    }

    const finalDocId = useAutoId ? generateDocumentId() : documentId.trim();
    const documentData = JSON.parse(jsonContent);

    setIsCreating(true);
    try {
      await createDocument(collectionName, finalDocId, documentData);
      toast.success(`Document created: ${finalDocId}`);
      setIsCreating(false);
      
      // Show success and close
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create document');
      console.error('Error creating document:', error);
      setIsCreating(false);
    }
  };

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        disabled={isCreating}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        {t('cancel')}
      </button>
      <button
        onClick={handleCreate}
        disabled={isCreating || errors.length > 0}
        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <>
            <SpinnerIcon className="w-4 h-4 animate-spin" />
            {t('creating')}
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-4 h-4" />
            {t('create')}
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Create New Document in ${collectionName}`}
      footer={footer}
      size="lg"
    >
      <div className="space-y-4">
        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-200 font-semibold">
              {t('validationError')}
            </p>
            <ul className="mt-2 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-600 dark:text-red-300">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Document ID Section */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={useAutoId}
                onChange={(e) => setUseAutoId(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-generate Document ID
              </span>
            </label>
            {useAutoId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Example: {generateDocumentId()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!useAutoId}
                onChange={(e) => setUseAutoId(!e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Document ID
              </span>
            </label>
            {!useAutoId && (
              <input
                type="text"
                placeholder="my-document-id"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="ml-6 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            )}
          </div>
        </div>

        {/* Document Content */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Document Content (JSON)
          </label>
          <textarea
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
            className="w-full h-64 p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            spellCheck="false"
          />
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-200">
            ℹ️ System fields (createdAt, updatedAt) will be added automatically.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CreateDocumentModal;

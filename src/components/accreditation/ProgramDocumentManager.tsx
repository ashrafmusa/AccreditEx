import React, { useState, useRef } from 'react';
import { ProgramDocument } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { uploadProgramDocument, deleteProgramDocument, updateProgramDocumentDescription } from '@/services/programDocumentService';
import { CloudUploadIcon, TrashIcon, DocumentDownloadIcon, PencilIcon } from '@/components/icons';

interface ProgramDocumentManagerProps {
  programId: string;
  documents: ProgramDocument[];
  userId: string;
  canModify: boolean;
  onDocumentsChange: (documents: ProgramDocument[]) => void;
}

const ProgramDocumentManager: React.FC<ProgramDocumentManagerProps> = ({
  programId,
  documents,
  userId,
  canModify,
  onDocumentsChange,
}) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('fileTooLarge') || 'File size exceeds 50MB limit');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const description = prompt(t('enterDocumentDescription') || 'Enter document description (optional):', '');
      
      const newDocument = await uploadProgramDocument(
        programId,
        file,
        description || undefined,
        userId,
        (progress) => setUploadProgress(progress)
      );

      onDocumentsChange([...documents, newDocument]);
      toast.success(t('documentUploadedSuccessfully') || 'Document uploaded successfully');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('failedToUploadDocument') || 'Failed to upload document';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm(t('areYouSure') || 'Are you sure?')) {
      return;
    }

    try {
      await deleteProgramDocument(programId, documentId);
      onDocumentsChange(documents.filter(d => d.id !== documentId));
      toast.success(t('documentDeletedSuccessfully') || 'Document deleted successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('failedToDeleteDocument') || 'Failed to delete document';
      toast.error(errorMsg);
    }
  };

  const handleDownload = (document: ProgramDocument) => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = '_blank';
    link.click();
  };

  const handleEditDescription = async (documentId: string, currentDescription: string) => {
    const newDescription = prompt(t('editDescription') || 'Edit description:', currentDescription);
    if (newDescription === null) return;

    try {
      await updateProgramDocumentDescription(programId, documentId, newDescription);
      const updatedDocuments = documents.map(d =>
        d.id === documentId ? { ...d, description: newDescription } : d
      );
      onDocumentsChange(updatedDocuments);
      toast.success(t('descriptionUpdatedSuccessfully') || 'Description updated successfully');
      setEditingDocId(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('failedToUpdateDescription') || 'Failed to update description';
      toast.error(errorMsg);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {canModify && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-sky-300 rounded-lg cursor-pointer hover:bg-sky-50 dark:border-sky-600 dark:hover:bg-sky-900/20 transition">
            <CloudUploadIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
              {isUploading ? `${t('uploading') || 'Uploading'} ${Math.round(uploadProgress)}%` : (t('uploadDocument') || 'Upload Document')}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
            />
          </label>
        </div>
      )}

      {documents.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('uploadedDocuments') || 'Uploaded Documents'} ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{doc.fileName}</p>
                  {doc.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{doc.description}</p>
                  )}
                  <div className="flex gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString(lang)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    title={t('download') || 'Download'}
                  >
                    <DocumentDownloadIcon className="w-5 h-5" />
                  </button>
                  {canModify && (
                    <>
                      <button
                        onClick={() => handleEditDescription(doc.id, doc.description || '')}
                        className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition"
                        title={t('edit') || 'Edit'}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title={t('delete') || 'Delete'}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('noDocumentsUploaded') || 'No documents uploaded yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgramDocumentManager;

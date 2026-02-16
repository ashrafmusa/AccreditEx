import React, { useState, useRef } from 'react';
import { DocumentData, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import {
  UploadIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SpinnerIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@/components/icons';

interface ImportFile {
  collection: string;
  documents: DocumentData[];
  documentIdField: string;
}

interface ImportJob {
  id: string;
  collectionName: string;
  documentCount: number;
  uploadedCount: number;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  error?: string;
  uploadedAt?: Date;
  startTime?: Date;
  duration?: number;
}

const BatchImportPanel: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<ImportFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast?.error?.('Only JSON files are supported');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        let data: ImportFile;
        if (Array.isArray(parsed)) {
          // Bare array format — infer collection name from filename
          const baseName = file.name.replace(/\.json$/i, '').replace(/_import$/, '');
          const collectionMap: Record<string, string> = {
            programs: 'accreditationPrograms',
            standards: 'standards',
            standards_smcs: 'standards',
            departments: 'departments',
            competencies: 'competencies',
            risks: 'risks',
            trainingPrograms: 'trainingPrograms',
            documents: 'documents',
            projects: 'projects',
          };
          data = {
            collection: collectionMap[baseName] || baseName,
            documents: parsed,
            documentIdField: 'id',
          };
        } else if (parsed.collection && Array.isArray(parsed.documents)) {
          // Wrapped object format
          data = parsed;
        } else {
          toast?.error?.('Invalid import file format. Expected: [...] or { collection, documents }');
          return;
        }

        setFilePreview(data);
        setShowPreview(true);
        toast?.success?.(`Loaded ${data.documents.length} documents for ${data.collection}`);
      } catch (error) {
        toast?.error?.('Failed to parse JSON file');
        console.error('JSON parse error:', error);
      }
    };
    reader.onerror = () => {
      toast?.error?.('Failed to read file');
      console.error('File read error');
    };
    reader.readAsText(file);
  };

  const uploadDocuments = async (data: ImportFile) => {
    if (!data.collection || !data.documents.length) {
      toast?.error?.('No documents to upload');
      return;
    }

    const jobId = `${data.collection}-${Date.now()}`;
    const startTime = new Date();
    const newJob: ImportJob = {
      id: jobId,
      collectionName: data.collection,
      documentCount: data.documents.length,
      uploadedCount: 0,
      status: 'uploading',
      progress: 0,
      startTime,
    };

    setImportJobs((prev) => [...prev, newJob]);
    setIsProcessing(true);

    try {
      const collectionRef = collection(db, data.collection);
      const batch = writeBatch(db);
      let uploadedCount = 0;

      for (const doc_data of data.documents) {
        // Try to get an explicit ID from the document
        const docId = data.documentIdField
          ? doc_data[data.documentIdField]
          : doc_data.id;

        // Use the explicit ID or let Firestore auto-generate one
        const docRef = docId
          ? doc(collectionRef, String(docId))
          : doc(collectionRef);

        // Remove id fields from the data to avoid storing them inside the document
        const { [data.documentIdField || 'id']: _removedId, id: _removedId2, ...cleanData } = doc_data;
        batch.set(docRef, cleanData);
        uploadedCount++;

        if (uploadedCount % 10 === 0 || uploadedCount === data.documents.length) {
          const progress = Math.round((uploadedCount / data.documents.length) * 100);
          setImportJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? { ...job, progress, uploadedCount }
                : job
            )
          );
        }
      }

      await batch.commit();

      const duration = Math.round((Date.now() - startTime.getTime()) / 1000);
      setImportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'success',
                progress: 100,
                uploadedAt: new Date(),
                uploadedCount,
                duration,
              }
            : job
        )
      );

      const successMsg = `✅ Imported ${uploadedCount} documents to ${data.collection} in ${duration}s`;
      toast?.success?.(successMsg);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'failed',
                error: errorMessage,
              }
            : job
        )
      );

      toast?.error?.(`Failed to import documents: ${errorMessage}`);
      console.error('BatchImportPanel upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = () => {
    if (filePreview) {
      uploadDocuments(filePreview);
    }
  };

  const clearJob = (jobId: string) => {
    setImportJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const clearAllJobs = () => {
    setImportJobs([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowPathIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            Batch Import Documents
          </h3>
        </div>

        <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-4">
          Upload pre-formatted JSON files to import multiple documents at once. Use the helper scripts to prepare your data files.
        </p>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <UploadIcon className="w-5 h-5" />
            {isProcessing ? 'Uploading...' : 'Select JSON File'}
          </button>

          {selectedFile && (
            <div className="text-sm text-green-600 dark:text-green-400">
              ✅ File selected: {selectedFile.name}
            </div>
          )}
        </div>
      </div>

      {/* File Preview */}
      {filePreview && showPreview && (
        <div className="border border-brand-border dark:border-dark-brand-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              Import Preview
            </h4>
            <button
              onClick={() => setShowPreview(false)}
              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Hide
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Collection:
              </span>
              <span className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                {filePreview.collection}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Documents:
              </span>
              <span className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                {filePreview.documents.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Document ID Field:
              </span>
              <span className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                {filePreview.documentIdField}
              </span>
            </div>

            {/* Sample Documents */}
            <div className="mt-4 pt-4 border-t border-brand-border dark:border-dark-brand-border">
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
                Sample Documents (first 3):
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filePreview.documents.slice(0, 3).map((doc, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <pre className="overflow-x-auto">
                      {JSON.stringify(doc, null, 2).substring(0, 200)}...
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleImportClick}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {isProcessing ? 'Importing...' : 'Import All'}
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedFile(null);
                  setFilePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Jobs History */}
      {importJobs.length > 0 && (
        <div className="border border-brand-border dark:border-dark-brand-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              Import History
            </h4>
            <button
              onClick={clearAllJobs}
              className="text-xs px-2 py-1 bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-300 dark:hover:bg-red-900/50"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {importJobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {job.status === 'uploading' && (
                      <SpinnerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    )}
                    {job.status === 'success' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                    {job.status === 'failed' && (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    {job.status === 'pending' && (
                      <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                    <span className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                      {job.collectionName}
                    </span>
                  </div>
                  <button
                    onClick={() => clearJob(job.id)}
                    className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mb-2">
                  {job.uploadedCount} / {job.documentCount} documents
                  {job.duration && ` • ${job.duration}s`}
                  {job.uploadedAt && ` • ${job.uploadedAt.toLocaleTimeString()}`}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      job.status === 'success'
                        ? 'bg-green-600'
                        : job.status === 'failed'
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                {/* Status Text */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {job.status === 'uploading' && `Uploading... ${job.progress}%`}
                    {job.status === 'success' && '✅ Successfully imported'}
                    {job.status === 'failed' && `❌ Failed: ${job.error}`}
                    {job.status === 'pending' && 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          How to Use Batch Import
        </h4>
        <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-2 list-decimal list-inside">
          <li>Run the helper script: <code className="bg-white dark:bg-gray-800 px-1 rounded text-xs">npm run firebase:prepare-import</code></li>
          <li>Find the generated JSON files in <code className="bg-white dark:bg-gray-800 px-1 rounded text-xs">firebase-import-ready/</code> folder</li>
          <li>Select a JSON file above and review the preview</li>
          <li>Click "Import All" to upload all documents to the collection</li>
          <li>Monitor progress in the Import History section</li>
          <li>Verify the data in Collections Manager after import</li>
        </ol>
      </div>
    </div>
  );
};

export default BatchImportPanel;


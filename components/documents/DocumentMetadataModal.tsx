
import React, { useState } from 'react';
import { AppDocument } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import FileUploader from './FileUploader';
import { storageService } from '../../services/storageService';

interface DocumentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: { en: string; ar: string }, type: AppDocument['type'], fileUrl?: string }) => void;
}

const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t, dir } = useTranslation();
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [type, setType] = useState<AppDocument['type']>('Policy');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    
    const handleFilesSelected = (files: File[]) => {
        setSelectedFiles(files);
        setUploadError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadError('');
        
        let fileUrl: string | undefined;
        
        // Upload file if selected
        if (selectedFiles.length > 0) {
            try {
                setIsUploading(true);
                const documentId = `doc-${Date.now()}`;
                const file = selectedFiles[0];
                
                fileUrl = await storageService.uploadDocument(
                    file,
                    documentId,
                    (progress) => {
                        setUploadProgress(progress.progress);
                    }
                );
                
                setIsUploading(false);
            } catch (error) {
                console.error('Upload error:', error);
                setUploadError(error instanceof Error ? error.message : 'Upload failed');
                setIsUploading(false);
                return;
            }
        }
        
        // Save document with file URL
        onSave({ 
            name: { en: nameEn, ar: nameAr }, 
            type,
            fileUrl 
        });
        
        // Reset form
        setNameEn('');
        setNameAr('');
        setType('Policy');
        setSelectedFiles([]);
        setUploadProgress(0);
        onClose();
    };

    const handleClose = () => {
        setNameEn('');
        setNameAr('');
        setType('Policy');
        setSelectedFiles([]);
        setUploadProgress(0);
        setUploadError('');
        setIsUploading(false);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={handleClose}>
        <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium">{t('addNewDocument')}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t('documentNameEn')}</label>
                  <input 
                    type="text" 
                    value={nameEn} 
                    onChange={e => setNameEn(e.target.value)} 
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary" 
                    required 
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t('documentNameAr')}</label>
                  <input 
                    type="text" 
                    value={nameAr} 
                    onChange={e => setNameAr(e.target.value)} 
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary" 
                    dir="rtl" 
                    required 
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t('documentType')}</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)} 
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    disabled={isUploading}
                  >
                    <option value="Policy">{t('policy')}</option>
                    <option value="Procedure">{t('procedure')}</option>
                    <option value="Report">{t('report')}</option>
                  </select>
                </div>
                
                {/* File Uploader */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('uploadFile') || 'Upload File'} ({t('optional') || 'Optional'})
                  </label>
                  <FileUploader
                    onFilesSelected={handleFilesSelected}
                    multiple={false}
                    maxFiles={1}
                    disabled={isUploading}
                  />
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('uploading') || 'Uploading'}...
                      </span>
                      <span className="text-sm font-medium text-brand-primary">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={handleClose} 
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={isUploading}
              >
                {t('cancel')}
              </button>
              <button 
                type="submit" 
                className="py-2 px-4 border rounded-md text-sm text-white bg-brand-primary hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                {isUploading ? (t('uploading') || 'Uploading') + '...' : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}

export default DocumentMetadataModal;
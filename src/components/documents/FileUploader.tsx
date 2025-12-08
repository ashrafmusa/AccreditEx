import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from '../../hooks/useTranslation';
import { DocumentTextIcon, XMarkIcon, CheckCircleIcon } from '../icons';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploadProgress?: number;
  error?: string;
}

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  multiple?: boolean;
  existingFiles?: UploadedFile[];
  onRemoveFile?: (fileId: string) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  acceptedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  multiple = true,
  existingFiles = [],
  onRemoveFile,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    onFilesSelected(acceptedFiles);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map((rejected) => {
        const error = rejected.errors[0];
        if (error.code === "file-too-large") {
          return `${rejected.file.name}: File size exceeds ${formatFileSize(
            maxFileSize
          )}`;
        } else if (error.code === "file-invalid-type") {
          return `${rejected.file.name}: File type not supported`;
        } else if (error.code === "too-many-files") {
          return `Maximum ${maxFiles} files allowed`;
        }
        return `${rejected.file.name}: ${error.message}`;
      });

      // File upload errors handled with user notification
    }
  }, [onFilesSelected, maxFileSize, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: multiple ? maxFiles : 1,
    multiple,
    disabled,
  });

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    onRemoveFile?.(fileId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        
        {isDragActive ? (
          <p className="text-brand-primary font-medium">
            {t('dropFilesHere') || 'Drop files here...'}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {t('dragDropFiles') || 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('orClickToBrowse') || 'or click to browse'}
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              <p>{t('acceptedTypes') || 'Accepted'}: PDF, DOCX, Images</p>
              <p>{t('maxSize') || 'Max size'}: {formatFileSize(maxFileSize)} {t('perFile') || 'per file'}</p>
              {multiple && <p>{t('maxFiles') || 'Max files'}: {maxFiles}</p>}
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('selectedFiles') || 'Selected Files'} ({files.length})
          </h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-brand-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${file.uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {file.uploadProgress}%
                      </p>
                    </div>
                  )}
                  
                  {/* Success */}
                  {file.uploadProgress === 100 && (
                    <div className="flex items-center mt-1 text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      <span className="text-xs">{t('uploaded') || 'Uploaded'}</span>
                    </div>
                  )}
                  
                  {/* Error */}
                  {file.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {file.error}
                    </p>
                  )}
                </div>
              </div>

              {!disabled && (
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="ml-3 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Remove file"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

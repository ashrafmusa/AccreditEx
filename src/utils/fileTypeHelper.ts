import { AppDocument } from '../types';

/**
 * Get the appropriate file type icon for a document
 */
export const getFileTypeIcon = (doc: AppDocument): string => {
  if (doc.fileUrl) {
    const extension = getFileExtension(doc.fileUrl);
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  }
  
  // No file URL, use document type
  switch (doc.type) {
    case 'Policy':
      return '📋';
    case 'Procedure':
      return '📖';
    case 'Process Map':
      return '🗺️';
    case 'Evidence':
      return '✓';
    case 'Report':
      return '📊';
    default:
      return '📄';
  }
};

/**
 * Get file extension from URL or filename
 */
export const getFileExtension = (url: string): string => {
  const parts = url.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Check if a document is a PDF
 */
export const isPDF = (doc: AppDocument): boolean => {
  return !!(doc.fileUrl && doc.fileUrl.toLowerCase().endsWith('.pdf'));
};

/**
 * Check if a document is a process map
 */
export const isProcessMap = (doc: AppDocument): boolean => {
  return doc.type === 'Process Map';
};

/**
 * Check if a document has rich text content
 */
export const hasRichTextContent = (doc: AppDocument): boolean => {
  return !!(doc.content && (doc.content.en || doc.content.ar));
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Check if file type is supported for upload
 */
export const isSupportedFileType = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const supportedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'];
  return supportedExtensions.includes(extension);
};

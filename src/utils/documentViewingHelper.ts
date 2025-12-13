import { AppDocument } from '../types';
import { isPDF, isProcessMap, hasRichTextContent, isDOCX } from './fileTypeHelper';

export type DocumentViewAction = 'pdf' | 'docx' | 'processMap' | 'richText' | 'none';

/**
 * Determine the appropriate view action for a document
 */
export const getDocumentViewAction = (doc: AppDocument): DocumentViewAction => {
  if (isPDF(doc)) {
    return 'pdf';
  }

  if (isDOCX(doc)) {
    return 'docx';
  }

  if (isProcessMap(doc)) {
    return 'processMap';
  }

  if (hasRichTextContent(doc)) {
    return 'richText';
  }

  return 'none';
};

/**
 * Check if a document can be viewed
 */
export const canViewDocument = (doc: AppDocument): boolean => {
  return getDocumentViewAction(doc) !== 'none';
};

/**
 * Check if a document can be downloaded
 */
export const canDownloadDocument = (doc: AppDocument): boolean => {
  return !!(doc.fileUrl);
};

/**
 * Get download URL for a document
 */
export const getDocumentDownloadUrl = (doc: AppDocument): string | null => {
  return doc.fileUrl || null;
};

/**
 * Get document display name based on current language
 */
export const getDocumentDisplayName = (doc: AppDocument, lang: 'en' | 'ar'): string => {
  return doc.name[lang] || doc.name.en || doc.name.ar || 'Untitled Document';
};

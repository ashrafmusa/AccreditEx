import { collection, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { cloudinaryService } from '@/services/cloudinaryService';
import { storageService } from '@/services/storageService';
import { ProgramDocument, AccreditationProgram } from '@/types';
import { freeTierMonitor } from '@/services/freeTierMonitor';

const programsCollection = collection(db, 'accreditationPrograms');

/**
 * Upload a document for a program
 * @param programId - Program ID
 * @param file - File to upload
 * @param description - Optional description
 * @param userId - User ID uploading the file
 * @param onProgress - Optional progress callback
 */
export const uploadProgramDocument = async (
  programId: string,
  file: File,
  description: string | undefined,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<ProgramDocument> => {
  try {
    // Upload file to storage
    const fileUrl = await cloudinaryService.uploadFile(
      file,
      `programs/${programId}`,
      (progress) => {
        onProgress?.(progress.progress);
      }
    );

    // Create document record
    const programDocument: ProgramDocument = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      description: description || '',
      isPublic: true,
    };

    // Add document ID to program
    const programRef = doc(programsCollection, programId);
    await updateDoc(programRef, {
      documentIds: arrayUnion(programDocument.id),
      documents: arrayUnion(programDocument),
    });

    freeTierMonitor.recordWrite(1);
    return programDocument;
  } catch (error) {
    console.error('Error uploading program document:', error);
    throw new Error('Failed to upload program document');
  }
};

/**
 * Delete a document from a program
 * @param programId - Program ID
 * @param documentId - Document ID to delete
 */
export const deleteProgramDocument = async (
  programId: string,
  documentId: string
): Promise<void> => {
  try {
    const programRef = doc(programsCollection, programId);
    const programSnap = await getDoc(programRef);

    if (!programSnap.exists()) {
      throw new Error('Program not found');
    }

    const programData = programSnap.data() as AccreditationProgram;
    const document = programData.documents?.find(d => d.id === documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from storage (Cloudinary or Firebase Storage)
    try {
      if (document.fileUrl.includes('cloudinary.com')) {
        console.info('[Cloudinary] File deletion requires backend API — metadata cleanup continues.');
      } else {
        await storageService.deleteDocument(document.fileUrl);
      }
    } catch (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
      // Continue with database cleanup even if storage deletion fails
    }

    // Remove document from program
    await updateDoc(programRef, {
      documentIds: arrayRemove(documentId),
      documents: arrayRemove(document),
    });

    freeTierMonitor.recordDelete(1);
  } catch (error) {
    console.error('Error deleting program document:', error);
    throw new Error('Failed to delete program document');
  }
};

/**
 * Get all documents for a program
 * @param programId - Program ID
 */
export const getProgramDocuments = async (programId: string): Promise<ProgramDocument[]> => {
  try {
    const programRef = doc(programsCollection, programId);
    const programSnap = await getDoc(programRef);

    if (!programSnap.exists()) {
      return [];
    }

    const programData = programSnap.data() as AccreditationProgram;
    freeTierMonitor.recordRead(1);
    return programData.documents || [];
  } catch (error) {
    console.error('Error getting program documents:', error);
    return [];
  }
};

/**
 * Update document description
 * @param programId - Program ID
 * @param documentId - Document ID
 * @param description - New description
 */
export const updateProgramDocumentDescription = async (
  programId: string,
  documentId: string,
  description: string
): Promise<void> => {
  try {
    const programRef = doc(programsCollection, programId);
    const programSnap = await getDoc(programRef);

    if (!programSnap.exists()) {
      throw new Error('Program not found');
    }

    const programData = programSnap.data() as AccreditationProgram;
    const documents = programData.documents || [];

    const updatedDocuments = documents.map(d =>
      d.id === documentId ? { ...d, description } : d
    );

    await updateDoc(programRef, { documents: updatedDocuments });
    freeTierMonitor.recordWrite(1);
  } catch (error) {
    console.error('Error updating program document description:', error);
    throw new Error('Failed to update document description');
  }
};

/**
 * Download a program document
 * @param document - Document to download
 */
export const downloadProgramDocument = async (document: ProgramDocument): Promise<void> => {
  try {
    const link = document.fileUrl;
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const url = window.URL.createObjectURL(xhr.response);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      globalThis.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    };
    xhr.open('GET', link);
    xhr.send();
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document');
  }
};

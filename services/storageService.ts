import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/firebaseConfig';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class StorageService {
  /**
   * Upload a document file to Firebase Storage
   * @param file - The file to upload
   * @param documentId - Unique document ID
   * @param onProgress - Optional callback for upload progress
   * @returns Promise with the download URL
   */
  async uploadDocument(
    file: File,
    documentId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Create a storage reference
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `documents/${documentId}/${fileName}`);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress callback
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            onProgress?.(progress);
          },
          (error) => {
            // Error callback
            console.error('Upload error:', error);
            reject(this.handleUploadError(error));
          },
          async () => {
            // Success callback
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(new Error('Failed to get download URL'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Upload initialization error:', error);
      throw new Error('Failed to initialize upload');
    }
  }

  /**
   * Upload multiple documents
   * @param files - Array of files to upload
   * @param documentId - Unique document ID
   * @param onProgress - Optional callback for overall progress
   * @returns Promise with array of download URLs
   */
  async uploadMultipleDocuments(
    files: File[],
    documentId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadDocument(file, documentId, (progress) => {
        onProgress?.(index, progress);
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a document from Firebase Storage
   * @param fileUrl - The download URL or storage path
   */
  async deleteDocument(fileUrl: string): Promise<void> {
    try {
      // Extract the storage path from the download URL
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete multiple documents
   * @param fileUrls - Array of download URLs or storage paths
   */
  async deleteMultipleDocuments(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteDocument(url));
    await Promise.all(deletePromises);
  }

  /**
   * Handle upload errors and return user-friendly messages
   */
  private handleUploadError(error: any): Error {
    switch (error.code) {
      case 'storage/unauthorized':
        return new Error('You do not have permission to upload files');
      case 'storage/canceled':
        return new Error('Upload was canceled');
      case 'storage/quota-exceeded':
        return new Error('Storage quota exceeded');
      case 'storage/invalid-checksum':
        return new Error('File checksum mismatch');
      case 'storage/retry-limit-exceeded':
        return new Error('Upload failed after multiple retries');
      default:
        return new Error('Upload failed. Please try again.');
    }
  }

  /**
   * Get file metadata from storage
   */
  async getFileMetadata(fileUrl: string): Promise<any> {
    try {
      const fileRef = ref(storage, fileUrl);
      // You can use getMetadata() here if needed
      return { url: fileUrl };
    } catch (error) {
      console.error('Metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();

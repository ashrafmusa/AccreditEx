import { Cloudinary } from '@cloudinary/url-gen';

// Cloudinary configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

// Validate configuration on load
if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
  console.warn(
    '[Cloudinary] VITE_CLOUDINARY_CLOUD_NAME not set — using fallback "demo". ' +
    'Create a .env file with your Cloudinary credentials. See .env.example'
  );
}
if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
  console.warn(
    '[Cloudinary] VITE_CLOUDINARY_UPLOAD_PRESET not set — using fallback "ml_default". ' +
    'Create a .env file with your Cloudinary credentials. See .env.example'
  );
}

// Initialize Cloudinary instance
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: cloudName,
  },
  url: {
    secure: true,
  },
});

interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  url: string;
  thumbnail_url?: string;
}

interface UploadTask {
  id: string;
  file: File;
  folder: string;
  onProgress?: (progress: UploadProgress) => void;
  resolve: (url: string) => void;
  reject: (error: Error) => void;
  retries: number;
  hash?: string;
}

interface BatchUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName: string;
}

interface OfflineUploadTask {
  file: File;
  folder: string;
  timestamp: number;
}

// Export public interfaces
export type { UploadProgress, BatchUploadResult };

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private uploadQueue: UploadTask[] = [];
  private activeUploads: number = 0;
  private maxConcurrentUploads: number = 3;
  private uploadHistory: Map<string, string> = new Map(); // hash -> url
  private offlineQueue: OfflineUploadTask[] = [];
  private isOnline: boolean = navigator.onLine;

  // File size limits (in bytes)
  private readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  // Allowed file types
  private readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  constructor() {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.initializeOfflineSupport();
    this.loadUploadHistory();
  }

  /**
   * Initialize offline support listeners
   */
  private initializeOfflineSupport(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Load offline queue from localStorage
    this.loadOfflineQueue();
  }

  /**
   * Load upload history from localStorage
   */
  private loadUploadHistory(): void {
    try {
      const historyJSON = localStorage.getItem('cloudinary_upload_history');
      if (historyJSON) {
        const historyArray: [string, string][] = JSON.parse(historyJSON);
        this.uploadHistory = new Map(historyArray);
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  }

  /**
   * Save upload history to localStorage
   */
  private saveUploadHistory(): void {
    try {
      const historyArray = Array.from(this.uploadHistory.entries());
      localStorage.setItem('cloudinary_upload_history', JSON.stringify(historyArray));
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const queueJSON = localStorage.getItem('cloudinary_offline_queue');
      if (queueJSON) {
        this.offlineQueue = JSON.parse(queueJSON);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('cloudinary_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Calculate SHA-256 hash of a file
   */
  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if file is a duplicate
   */
  private async checkDuplicate(file: File): Promise<{ isDuplicate: boolean; url?: string }> {
    const hash = await this.calculateFileHash(file);
    const existingUrl = this.uploadHistory.get(hash);

    if (existingUrl) {
      return { isDuplicate: true, url: existingUrl };
    }

    return { isDuplicate: false };
  }

  /**
   * Validate file size
   */
  private validateFileSize(file: File, maxSize: number): void {
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      );
    }
  }

  /**
   * Validate file type
   */
  private validateFileType(file: File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} queued uploads...`);

    const queueCopy = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    for (const task of queueCopy) {
      try {
        await this.uploadDocument(task.file, task.folder);
        console.log(`Successfully uploaded queued file: ${task.file.name}`);
      } catch (error) {
        console.error(`Failed to upload queued file: ${task.file.name}`, error);
        // Re-add to queue if upload fails
        this.offlineQueue.push(task);
      }
    }

    this.saveOfflineQueue();
  }

  /**
   * Add upload to queue and process
   */
  private async queueUpload(
    file: File,
    folder: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const task: UploadTask = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        folder,
        onProgress,
        resolve,
        reject,
        retries: 0,
      };

      this.uploadQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Process upload queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    while (this.uploadQueue.length > 0 && this.activeUploads < this.maxConcurrentUploads) {
      const task = this.uploadQueue.shift();
      if (!task) continue;

      this.activeUploads++;
      this.executeUpload(task).finally(() => {
        this.activeUploads--;
        this.processQueue();
      });
    }
  }

  /**
   * Execute upload with retry logic
   */
  private async executeUpload(task: UploadTask): Promise<void> {
    const maxRetries = 3;
    const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000);

    while (task.retries <= maxRetries) {
      try {
        const url = await this.performUpload(task.file, task.folder, task.onProgress);

        // Save to upload history
        if (task.hash) {
          this.uploadHistory.set(task.hash, url);
          this.saveUploadHistory();
        }

        task.resolve(url);
        return;
      } catch (error) {
        task.retries++;

        if (task.retries > maxRetries) {
          task.reject(error instanceof Error ? error : new Error('Upload failed'));
          return;
        }

        // Check if error is retryable
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('400') || errorMessage.includes('403')) {
          // Don't retry client errors
          task.reject(error instanceof Error ? error : new Error('Upload failed'));
          return;
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay(task.retries - 1)));
        console.log(`Retrying upload (attempt ${task.retries}/${maxRetries})...`);
      }
    }
  }

  /**
   * Perform actual upload (internal method)
   */
  private async performUpload(
    file: File,
    folder: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    // Try adding folder - if preset doesn't allow it, Cloudinary will ignore it
    if (folder) {
      formData.append('folder', folder);
    }

    // Only add tags - remove access_mode and resource_type as they may conflict with upload preset
    const tags = ['accreditex', folder];
    formData.append('tags', tags.join(','));

    const xhr = new XMLHttpRequest();
    // Use auto upload endpoint - Cloudinary will categorize PDFs as images which work for untrusted accounts
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;


    return new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress({
            progress,
            loaded: e.loaded,
            total: e.total,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          // Parse error response from Cloudinary
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error && errorResponse.error.message) {
              errorMessage = `Cloudinary error: ${errorResponse.error.message}`;
            }
          } catch (e) {
            // If parsing fails, use default error message
          }
          console.error('Cloudinary upload error:', errorMessage, xhr.responseText);
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  /**
   * Upload a document to Cloudinary
   * @param file - File to upload
   * @param folder - Optional folder path in Cloudinary
   * @param onProgress - Progress callback
   * @param options - Upload options (skipDuplicateCheck, forceUpload)
   * @returns Promise with uploaded file URL
   */
  async uploadDocument(
    file: File,
    folder: string = 'documents',
    onProgress?: (progress: UploadProgress) => void,
    options?: { skipDuplicateCheck?: boolean; forceUpload?: boolean }
  ): Promise<string> {
    try {
      // 1. Validate file size
      this.validateFileSize(file, this.MAX_DOCUMENT_SIZE);

      // 2. Validate file type
      this.validateFileType(file, this.ALLOWED_DOCUMENT_TYPES);

      // 3. Check for duplicates (unless skipped or forced)
      if (!options?.skipDuplicateCheck && !options?.forceUpload) {
        const duplicateCheck = await this.checkDuplicate(file);
        if (duplicateCheck.isDuplicate) {
          console.log(`File "${file.name}" already uploaded, returning existing URL`);
          return duplicateCheck.url!;
        }
      }

      // 4. Check if offline
      if (!this.isOnline) {
        console.log('Offline: Adding upload to queue');
        this.offlineQueue.push({
          file,
          folder,
          timestamp: Date.now(),
        });
        this.saveOfflineQueue();
        throw new Error('Device is offline. Upload queued for when connection is restored.');
      }

      // 5. Calculate hash for duplicate tracking
      const hash = await this.calculateFileHash(file);

      // 6. Add to upload queue
      const task: UploadTask = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        folder,
        onProgress,
        hash,
        retries: 0,
        resolve: () => { },
        reject: () => { },
      };

      const uploadPromise = new Promise<string>((resolve, reject) => {
        task.resolve = resolve;
        task.reject = reject;
      });

      this.uploadQueue.push(task);
      this.processQueue();

      return await uploadPromise;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Upload an image with automatic optimization
   * @param file - Image file to upload
   * @param folder - Optional folder path
   * @param onProgress - Progress callback
   * @param options - Upload options (skipDuplicateCheck, forceUpload)
   * @returns Promise with uploaded image URL
   */
  async uploadImage(
    file: File,
    folder: string = 'images',
    onProgress?: (progress: UploadProgress) => void,
    options?: { skipDuplicateCheck?: boolean; forceUpload?: boolean }
  ): Promise<string> {
    try {
      // 1. Validate file size
      this.validateFileSize(file, this.MAX_IMAGE_SIZE);

      // 2. Validate file type
      this.validateFileType(file, this.ALLOWED_IMAGE_TYPES);

      // 3. Check for duplicates (unless skipped or forced)
      if (!options?.skipDuplicateCheck && !options?.forceUpload) {
        const duplicateCheck = await this.checkDuplicate(file);
        if (duplicateCheck.isDuplicate) {
          console.log(`Image "${file.name}" already uploaded, returning existing URL`);
          return duplicateCheck.url!;
        }
      }

      // 4. Check if offline
      if (!this.isOnline) {
        console.log('Offline: Adding image upload to queue');
        this.offlineQueue.push({
          file,
          folder,
          timestamp: Date.now(),
        });
        this.saveOfflineQueue();
        throw new Error('Device is offline. Upload queued for when connection is restored.');
      }

      // 5. Calculate hash for duplicate tracking
      const hash = await this.calculateFileHash(file);

      // 6. Add to upload queue (uses same queue as documents)
      const task: UploadTask = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        folder,
        onProgress,
        hash,
        retries: 0,
        resolve: () => { },
        reject: () => { },
      };

      const uploadPromise = new Promise<string>((resolve, reject) => {
        task.resolve = resolve;
        task.reject = reject;
      });

      this.uploadQueue.push(task);
      this.processQueue();

      return await uploadPromise;
    } catch (error) {
      console.error('Cloudinary image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files in batch
   * @param files - Array of files to upload
   * @param folder - Folder path for all files
   * @param onProgress - Overall progress callback
   * @returns Promise with array of upload results
   */
  async uploadBatch(
    files: File[],
    folder: string = 'documents',
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchUploadResult[]> {
    const results: BatchUploadResult[] = [];
    let completed = 0;

    for (const file of files) {
      try {
        const url = await this.uploadDocument(file, folder);
        results.push({
          success: true,
          url,
          fileName: file.name,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
          fileName: file.name,
        });
      }

      completed++;
      if (onProgress) {
        onProgress(completed, files.length);
      }
    }

    return results;
  }

  /**
   * Delete a file from Cloudinary (requires backend implementation for security)
   * Note: This should be implemented on the backend with proper authentication
   * @param publicId - Cloudinary public ID of the file
   */
  async deleteFile(publicId: string): Promise<void> {
    // This should be implemented as a backend API call
    // Direct deletion from frontend is not secure
    console.warn('File deletion should be implemented on backend with proper authentication');
    throw new Error('Delete operation not implemented - use backend API');
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param url - Cloudinary URL
   * @returns Public ID or null
   */
  getPublicIdFromUrl(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Generate a thumbnail URL for an image
   * @param url - Original Cloudinary URL
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   * @returns Thumbnail URL
   */
  getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
    const publicId = this.getPublicIdFromUrl(url);
    if (!publicId) return url;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_fill,w_${width},h_${height}/${publicId}.jpg`;
  }

  /**
   * Check if Cloudinary is configured
   * @returns boolean
   */
  isConfigured(): boolean {
    const isConfigured = this.cloudName !== 'demo' && !!this.uploadPreset;

    // Log configuration for debugging
    if (!isConfigured) {
      console.warn('Cloudinary not properly configured:', {
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
        hasCloudName: this.cloudName !== 'demo',
        hasUploadPreset: !!this.uploadPreset,
      });
    }

    return isConfigured;
  }

  /**
   * Get configuration status
   * @returns Configuration info
   */
  getConfigInfo(): { cloudName: string; uploadPreset: string; configured: boolean } {
    return {
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset,
      configured: this.isConfigured(),
    };
  }

  /**
   * Get queue status
   * @returns Queue information
   */
  getQueueStatus(): {
    pending: number;
    active: number;
    offline: number;
    isOnline: boolean;
  } {
    return {
      pending: this.uploadQueue.length,
      active: this.activeUploads,
      offline: this.offlineQueue.length,
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear upload history
   */
  clearUploadHistory(): void {
    this.uploadHistory.clear();
    this.saveUploadHistory();
  }

  /**
   * Get upload history size
   */
  getUploadHistorySize(): number {
    return this.uploadHistory.size;
  }

  /**
   * Set maximum concurrent uploads
   */
  setMaxConcurrentUploads(max: number): void {
    if (max > 0 && max <= 10) {
      this.maxConcurrentUploads = max;
    }
  }

  /**
   * Upload a text/JSON string as a raw file to Cloudinary
   * Used for uploading error logs, feedback data, etc.
   * @param content - Text content to upload
   * @param filename - Desired filename (e.g., "errors-2026.json")
   * @param folder - Optional folder path
   * @returns Promise with uploaded file URL
   */
  async uploadTextFile(
    content: string,
    filename: string,
    folder: string = 'text-files'
  ): Promise<string> {
    // Convert text content to a File object
    const blob = new Blob([content], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });

    // Use the raw upload endpoint for non-image/non-video files
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }
    formData.append('tags', ['accreditex', folder].join(','));
    formData.append('resource_type', 'raw');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = `Cloudinary error: ${errorData.error.message}`;
        }
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    const data: CloudinaryUploadResponse = await response.json();
    return data.secure_url;
  }

  /**
   * Upload any raw file (non-image, non-video) to Cloudinary
   * Useful for CSVs, ZIPs, text files, etc.
   * @param file - File to upload
   * @param folder - Optional folder path
   * @param onProgress - Progress callback
   * @returns Promise with uploaded file URL
   */
  async uploadRawFile(
    file: File,
    folder: string = 'raw-files',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }
    formData.append('tags', ['accreditex', folder].join(','));

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`;

    const xhr = new XMLHttpRequest();

    return new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            progress: (e.loaded / e.total) * 100,
            loaded: e.loaded,
            total: e.total,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error?.message) {
              errorMessage = `Cloudinary error: ${errorResponse.error.message}`;
            }
          } catch {
            // Use default error message
          }
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed due to network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was aborted')));

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }
}

export type { CloudinaryService };
export const cloudinaryService = new CloudinaryService();

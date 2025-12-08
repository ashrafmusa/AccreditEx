import { Cloudinary } from '@cloudinary/url-gen';

// Cloudinary configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

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

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey?: string;

  constructor() {
    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.apiKey = apiKey;
  }

  /**
   * Upload a document to Cloudinary
   * @param file - File to upload
   * @param folder - Optional folder path in Cloudinary
   * @param onProgress - Progress callback
   * @returns Promise with uploaded file URL
   */
  async uploadDocument(
    file: File,
    folder: string = 'documents',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', folder);
      formData.append('resource_type', 'auto'); // Auto-detect resource type

      // Add tags for better organization
      const tags = ['accreditex', folder];
      formData.append('tags', tags.join(','));

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;

      return new Promise<string>((resolve, reject) => {
        // Track upload progress
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
            reject(new Error(`Upload failed with status ${xhr.status}`));
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
   * @returns Promise with uploaded image URL
   */
  async uploadImage(
    file: File,
    folder: string = 'images',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', folder);
      
      // Image-specific optimizations
      formData.append('quality', 'auto');
      formData.append('fetch_format', 'auto');
      
      const tags = ['accreditex', folder, 'image'];
      formData.append('tags', tags.join(','));

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

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
            reject(new Error(`Image upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Image upload failed due to network error'));
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Cloudinary image upload error:', error);
      throw error;
    }
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
    return this.cloudName !== 'demo' && !!this.uploadPreset;
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
}

export const cloudinaryService = new CloudinaryService();

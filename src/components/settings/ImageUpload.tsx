import React, { FC, useState, ChangeEvent } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  PhotoIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import { cloudinaryService } from "@/services/cloudinaryService";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_IMAGE_DIMENSION = 100;
const ACCEPTED_FORMATS = ["image/png", "image/jpeg", "image/svg+xml"];

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string, file?: File) => void;
}

const ImageUpload: FC<ImageUploadProps> = ({ currentImage, onImageChange }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const [hovering, setHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateImage = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return t("fileTooLarge") || "File size must be less than 5MB";
    }

    // Check file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return t("invalidImageFormat") || "Invalid image format";
    }

    return null;
  };

  const validateImageDimensions = (img: HTMLImageElement): string | null => {
    if (
      img.naturalWidth < MIN_IMAGE_DIMENSION ||
      img.naturalHeight < MIN_IMAGE_DIMENSION
    ) {
      return t("imageDimensions") || "Image must be at least 100x100 pixels";
    }
    return null;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      setPreview(undefined);
      onImageChange("", undefined);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create local preview first
      const localPreview = URL.createObjectURL(file);

      // Validate image dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const dimensionError = validateImageDimensions(img);
          if (dimensionError) {
            URL.revokeObjectURL(localPreview);
            reject(new Error(dimensionError));
          } else {
            setPreview(localPreview);
            resolve();
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(localPreview);
          reject(new Error(t("invalidImageFormat") || "Invalid image format"));
        };
        img.src = localPreview;
      });

      // Upload to Cloudinary (root folder - no restrictions)
      const cloudinaryUrl = await cloudinaryService.uploadImage(
        file,
        "",
        (progress) => {
          // Optional: Add progress reporting if needed
          console.log("Upload progress:", progress.progress);
        }
      );

      // Clean up local preview and set Cloudinary URL
      URL.revokeObjectURL(localPreview);
      setPreview(cloudinaryUrl);
      onImageChange(cloudinaryUrl, file);
      setError(null);
    } catch (err) {
      console.error("Failed to upload image:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("uploadAvatarError") || "Failed to upload image"
      );
      setPreview(undefined);
      onImageChange("", undefined);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setPreview(undefined);
    onImageChange("", undefined);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      <div
        className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden relative border-2 border-dashed border-gray-300 dark:border-gray-600 transition-all duration-200 hover:border-brand-primary dark:hover:border-brand-primary"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar preview"
              className={`w-full h-full object-cover transition-opacity ${
                loading ? "opacity-50" : "opacity-100"
              }`}
            />
            {hovering && !loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                <button
                  onClick={removeImage}
                  className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all"
                  title={t("removeImage") || "Remove image"}
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
            )}
          </>
        ) : (
          <PhotoIcon className="w-12 h-12 text-gray-400" />
        )}
      </div>
      <label
        htmlFor="avatar-upload"
        className="cursor-pointer inline-flex items-center gap-2 bg-brand-primary hover:bg-sky-700 text-white py-2.5 px-4 border border-transparent rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PhotoIcon className="w-4 h-4" />
        <span>{t("change") || "Upload"}</span>
        <input
          id="avatar-upload"
          name="avatar-upload"
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/svg+xml"
          disabled={loading}
        />
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("fileTooLarge")
          ? `${t("fileTooLarge")} • PNG, JPEG, SVG • Min 100x100px`
          : "Max 5MB • PNG, JPEG, SVG • Min 100x100px"}
      </p>
    </div>
  );
};

export { ImageUpload };
export default ImageUpload;

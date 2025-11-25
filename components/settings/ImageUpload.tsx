import React, { FC, useState, ChangeEvent } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { PhotoIcon, XCircleIcon } from '@/components/icons';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
}

const ImageUpload: FC<ImageUploadProps> = ({ currentImage, onImageChange }) => {
    const { t } = useTranslation();
    const [preview, setPreview] = useState<string | undefined>(currentImage);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                onImageChange(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPreview(undefined);
        onImageChange('');
    }

    return (
        <div className="mt-1 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
                {preview ? (
                    <>
                        <img src={preview} alt="Logo preview" className="w-full h-full object-cover" />
                         <button onClick={removeImage} className="absolute top-0 right-0 p-0.5 bg-white/70 rounded-full text-red-500 hover:text-red-700">
                            <XCircleIcon className="w-4 h-4"/>
                        </button>
                    </>
                ) : (
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                )}
            </div>
            <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                <span>{t('change')}</span>
                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
            </label>
        </div>
    );
};

export default ImageUpload;

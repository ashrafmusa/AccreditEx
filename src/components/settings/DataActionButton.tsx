import React, { FC, useRef } from 'react';

interface DataActionButtonProps {
    title: string;
    description: string;
    buttonText: string;
    onAction?: () => void;
    onFileAction?: (file: File) => void;
    isFileInput?: boolean;
    isDestructive?: boolean;
}

const DataActionButton: FC<DataActionButtonProps> = ({ title, description, buttonText, onAction, onFileAction, isFileInput, isDestructive }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (isFileInput) {
            fileInputRef.current?.click();
        } else if(onAction) {
            onAction();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onFileAction) {
            onFileAction(e.target.files[0]);
        }
    };

    const buttonClasses = isDestructive
      ? "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95"
      : "bg-brand-primary hover:bg-sky-700 text-white shadow-md hover:shadow-lg active:scale-95";

    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/30 dark:to-transparent border-t border-brand-border dark:border-dark-brand-border first:border-t-0 first:pt-0 last:pb-0 rounded-lg transition-all">
        <div>
          <h4 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {title}
          </h4>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {description}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex-shrink-0">
          <button
            type="button"
            onClick={handleClick}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${buttonClasses}`}
          >
            {buttonText}
          </button>
          {isFileInput && (
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".json"
            />
          )}
        </div>
      </div>
    );
}

export default DataActionButton;

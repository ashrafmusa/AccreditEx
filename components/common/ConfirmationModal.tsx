import React, { useState, FC } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ExclamationTriangleIcon } from '@/components/icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmationText: string;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmationText }) => {
    const { t, dir } = useTranslation();
    const [inputValue, setInputValue] = useState('');

    const isConfirmed = inputValue === confirmationText;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isConfirmed) {
            onConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 ltr:sm:ml-4 rtl:sm:mr-4 sm:text-left">
                                <h3 id="confirmation-modal-title" className="text-lg leading-6 font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{title}</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-brand-border dark:border-dark-brand-border">
                            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary" dangerouslySetInnerHTML={{ __html: t('confirmActionPrompt').replace('{text}', `<strong>${confirmationText}</strong>`) }} />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="mt-2 w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!isConfirmed}
                            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed"
                        >
                            {t('confirmAction')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConfirmationModal;
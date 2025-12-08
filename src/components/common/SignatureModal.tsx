import React, { useState, FC } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  actionTitle: string;
  signatureStatement: string;
  confirmActionText: string;
}

const SignatureModal: FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, actionTitle, signatureStatement, confirmActionText }) => {
  const { t, dir } = useTranslation();
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onConfirm(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 modal-content-enter border border-brand-border dark:border-dark-brand-border" onClick={(e) => e.stopPropagation()} dir={dir}>
          <form onSubmit={handleSubmit}>
          <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">{t('eSignature')}</h3>
              <div className="mt-2">
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{actionTitle}</p>
              </div>
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-300">{signatureStatement}</p>
              </div>
              <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('enterPasswordToSign')}</label>
              <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-800 dark:text-white"
                  required
                  autoFocus
              />
              </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 sm:px-6 py-3 flex flex-wrap justify-end gap-3 rounded-b-lg">
              <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
              >
              {t('cancel')}
              </button>
              <button
              type="submit"
              disabled={!password}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
              {confirmActionText}
              </button>
          </div>
          </form>
      </div>
    </div>
  );
};

export default SignatureModal;
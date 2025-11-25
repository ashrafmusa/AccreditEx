import React from 'react';
import { AppDocument } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { XMarkIcon } from '../icons';

interface ProcessMapEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
}

const ProcessMapEditor: React.FC<ProcessMapEditorProps> = ({ isOpen, onClose, document: documentData, onSave }) => {
  const { t, lang, dir } = useTranslation();

  if (!isOpen) return null;

  const handleSave = () => {
    // In a real editor, you'd save the state of nodes and edges
    onSave(documentData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-7xl h-[90vh] m-4 flex flex-col modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
        <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold dark:text-dark-brand-text-primary">{documentData.name[lang]}</h3>
            <p className="text-sm text-gray-500">v{documentData.currentVersion} - {t((documentData.status.charAt(0).toLowerCase() + documentData.status.slice(1).replace(' ', '')) as any)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><XMarkIcon className="w-6 h-6" /></button>
        </header>

        <main className="flex-grow p-6 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500">Process Map Editor Placeholder</p>
          {/* A real implementation would use a library like React Flow here */}
        </main>
        
        <footer className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end items-center space-x-3 rtl:space-x-reverse border-t dark:border-dark-brand-border flex-shrink-0">
          <button type="button" onClick={handleSave} className="inline-flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700">{t('saveChanges')}</button>
        </footer>
      </div>
    </div>
  );
};

export default ProcessMapEditor;

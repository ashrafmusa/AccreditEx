import React, { useState, useEffect, useMemo } from 'react';
import { AppDocument, Standard } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { XMarkIcon } from '../icons';
import DocumentEditorSidebar from './DocumentEditorSidebar';

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AppDocument;
  onSave: (document: AppDocument) => void;
  standards: Standard[];
}

const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({ isOpen, onClose, document: documentData, onSave, standards }) => {
  const { t, lang, dir } = useTranslation();
  
  const [document, setDocument] = useState<AppDocument>(documentData);
  const [isEditMode, setIsEditMode] = useState(documentData.status === 'Draft');
  const [viewingVersion, setViewingVersion] = useState<number | 'current'>('current');

  useEffect(() => {
    setDocument(documentData);
    setIsEditMode(documentData.status === 'Draft');
    setViewingVersion('current');
  }, [documentData, isOpen]);

  const currentContent = useMemo(() => {
    if (viewingVersion === 'current') {
      return document.content;
    }
    const historyItem = document.versionHistory.find(v => v.version === viewingVersion);
    return historyItem ? historyItem.content : document.content;
  }, [document, viewingVersion]);

  const handleSave = () => {
    let docToSave = { ...document };
    if (document.status === 'Approved' && isEditMode) {
      if (!window.confirm(t('newVersionPrompt'))) return;
      docToSave = {
        ...document,
        status: 'Draft',
        currentVersion: document.currentVersion + 1,
        versionHistory: [...document.versionHistory, {
          version: document.currentVersion,
          date: document.approvalDate || new Date().toISOString(),
          uploadedBy: document.approvedBy || '',
          content: documentData.content, // Save the old approved content
        }],
      };
    }
    onSave(docToSave);
  };
  
  const canEdit = document.status === 'Draft' || document.status === 'Approved';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-7xl h-[90vh] m-4 flex flex-col modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
        <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold dark:text-dark-brand-text-primary">{document.name[lang]}</h3>
            <p className="text-sm text-gray-500">v{document.currentVersion} - {t((document.status.charAt(0).toLowerCase() + document.status.slice(1).replace(' ', '')) as any)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close"><XMarkIcon className="w-6 h-6" /></button>
        </header>

        <main className="flex-grow flex overflow-hidden">
          <div className="flex-grow p-6 overflow-y-auto">
            {viewingVersion !== 'current' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-4 text-sm">
                {t('preview')} v{viewingVersion}. <button onClick={() => setViewingVersion('current')} className="font-semibold underline">{t('backToCurrent')}</button>
              </div>
            )}
            
            {isEditMode && viewingVersion === 'current' ? (
              <textarea 
                className="w-full h-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
                value={document.content[lang] || ''} 
                onChange={e => setDocument(d => ({...d, content: {...d.content, [lang]: e.target.value}}))}
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentContent[lang] || '' }} />
            )}
          </div>
          <DocumentEditorSidebar
            document={document}
            setDocument={setDocument}
            standards={standards}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            canEdit={canEdit}
            viewingVersion={viewingVersion}
            setViewingVersion={setViewingVersion}
          />
        </main>
        
        <footer className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end items-center space-x-3 rtl:space-x-reverse border-t dark:border-dark-brand-border flex-shrink-0">
          {document.status === 'Draft' && <button type="button" className="text-sm font-medium">{t('requestApproval')}</button>}
          {isEditMode && <button type="button" onClick={handleSave} className="inline-flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700">{t('saveChanges')}</button>}
        </footer>
      </div>
    </div>
  );
};

export default DocumentEditorModal;
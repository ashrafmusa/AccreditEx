import React from 'react';
import { AppDocument, LocalizedString } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { XMarkIcon, CheckIcon } from '../icons';

interface DocumentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (documentIds: string[]) => void;
  documents: AppDocument[];
  selectedIds?: string[];
  multiSelect?: boolean;
  filterType?: AppDocument['type'];
}

const DocumentPicker: React.FC<DocumentPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  documents = [],
  selectedIds = [],
  multiSelect = true,
  filterType,
}) => {
  const { t, lang } = useTranslation();
  const [selected, setSelected] = React.useState<string[]>(selectedIds);

  React.useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds, isOpen]);

  if (!isOpen) return null;

  const filteredDocuments = filterType
    ? documents.filter(doc => doc.type === filterType && doc.status === 'Approved')
    : documents.filter(doc => doc.status === 'Approved');

  const handleToggle = (docId: string) => {
    if (multiSelect) {
      setSelected(prev =>
        prev.includes(docId)
          ? prev.filter(id => id !== docId)
          : [...prev, docId]
      );
    } else {
      setSelected([docId]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const getDocumentName = (name: LocalizedString) => {
    return lang === 'ar' ? name.ar : name.en;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('selectDocuments')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('noDocumentsAvailable')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => handleToggle(doc.id)}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                    selected.includes(doc.id)
                      ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getDocumentName(doc.name)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {doc.type} • v{doc.currentVersion}
                    </div>
                  </div>
                  {selected.includes(doc.id) && (
                    <CheckIcon className="w-5 h-5 text-brand-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selected.length} {t('selected')}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPicker;

import React from 'react';
import { AccreditationProgram } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { DownloadIcon, UploadIcon } from '@/components/icons';

interface ProgramImportExportProps {
  programs: AccreditationProgram[];
  onImportClick: () => void;
}

const ProgramImportExport: React.FC<ProgramImportExportProps> = ({
  programs,
  onImportClick,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const handleDownloadTemplate = () => {
    try {
      const template = [
        {
          id: "prog-example",
          name: "Example Program",
          description: {
            en: "Example accreditation program description in English",
            ar: "وصف برنامج الاعتماد مثال باللغة العربية"
          }
        }
      ];
      
      const dataStr = JSON.stringify(template, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'program-import-template.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('templateDownloaded'));
    } catch (error) {
      toast.error(t('templateDownloadFailed'));
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(programs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `accreditation-programs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('programsExportedSuccessfully'));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('exportFailed');
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Download Template Button */}
      <button
        onClick={handleDownloadTemplate}
        className="flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm text-gray-700 dark:text-gray-200 shadow-sm"
        title={t('downloadImportTemplate')}
      >
        <DownloadIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
        {t('downloadTemplate')}
      </button>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={programs.length === 0}
        className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm text-gray-700 dark:text-gray-200 shadow-sm"
        title={programs.length === 0 ? t('noDataToExport') : ''}
      >
        <DownloadIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
        {t('exportPrograms')}
      </button>

      {/* Import Button — opens the import wizard */}
      <button
        onClick={onImportClick}
        className="flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-sky-700 rounded-lg cursor-pointer font-medium text-sm text-white shadow-sm"
      >
        <UploadIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
        {t('importPrograms')}
      </button>
    </div>
  );
};

export default ProgramImportExport;

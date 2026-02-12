import React, { useState } from 'react';
import { AccreditationProgram } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { DownloadIcon, UploadIcon } from '@/components/icons';

interface ProgramImportExportProps {
  programs: AccreditationProgram[];
  onImport: (programs: AccreditationProgram[]) => void;
  onImportError?: (error: string) => void;
}

const ProgramImportExport: React.FC<ProgramImportExportProps> = ({
  programs,
  onImport,
  onImportError,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

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

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setImportProgress((e.loaded / e.total) * 100);
        }
      };

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content);

          // Validate imported data structure
          if (!Array.isArray(importedData)) {
            throw new Error(t('invalidFileFormat'));
          }

          // Validate each program has required fields with trim checks
          const validatedPrograms = importedData.map((prog: any, index: number) => {
            // Check required fields exist
            if (!prog.name || !prog.description || !prog.description.en || !prog.description.ar) {
              throw new Error(
                `${t('invalidProgramStructure')} (${t('row')} ${index + 1}): ${t('missingRequiredFields')}`
              );
            }

            // Trim and check not empty
            const nameStr = prog.name.toString().trim();
            const descEn = prog.description.en.toString().trim();
            const descAr = prog.description.ar.toString().trim();

            if (!nameStr) {
              throw new Error(`${t('row')} ${index + 1}: Program name cannot be empty`);
            }
            if (!descEn) {
              throw new Error(`${t('row')} ${index + 1}: English description cannot be empty`);
            }
            if (!descAr) {
              throw new Error(`${t('row')} ${index + 1}: Arabic description cannot be empty`);
            }

            return {
              id: prog.id || `prog-${Date.now()}-${index}`,
              name: nameStr,
              description: {
                en: descEn,
                ar: descAr,
              },
            } as AccreditationProgram;
          });

          setImportProgress(100);
          onImport(validatedPrograms);
          toast?.success?.(
            `${t('imported')} ${validatedPrograms.length} ${t('programs').toLowerCase()}`
          );

          // Reset file input
          event.target.value = '';
        } catch (parseError) {
          const errorMsg =
            parseError instanceof Error ? parseError.message : t('failedToParseFile');
          toast?.error?.(errorMsg);
          onImportError?.(errorMsg);
        } finally {
          setIsImporting(false);
          setImportProgress(0);
        }
      };

      reader.onerror = () => {
        const errorMsg = t('failedToReadFile');
        toast?.error?.(errorMsg);
        onImportError?.(errorMsg);
        setIsImporting(false);
        setImportProgress(0);
      };

      reader.readAsText(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('importFailed');
      toast?.error?.(errorMsg);
      onImportError?.(errorMsg);
      setIsImporting(false);
      setImportProgress(0);
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

      {/* Import Button */}
      <label className="flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-sky-700 rounded-lg cursor-pointer font-medium text-sm text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
        <UploadIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
        {isImporting ? `${t('importing')} ${Math.round(importProgress)}%` : t('importPrograms')}
        <input
          type="file"
          accept=".json"
          onChange={handleImportFile}
          disabled={isImporting}
          className="hidden"
          aria-label={t('selectFileToImport')}
        />
      </label>

      {/* Progress Bar */}
      {isImporting && (
        <div className="w-full sm:w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-brand-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${importProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProgramImportExport;

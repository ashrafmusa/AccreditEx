import React, { useState, useRef } from 'react';
import { AccreditationProgram } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@/components/icons';

interface ProgramImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (programs: AccreditationProgram[], mode: 'add' | 'replace') => void;
  existingProgramCount: number;
}

interface FileValidationResult {
  isValid: boolean;
  programs: AccreditationProgram[];
  errors: string[];
  warnings: string[];
}

const ProgramImportWizardModal: React.FC<ProgramImportWizardModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  existingProgramCount,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'file-selection' | 'review' | 'confirmation'>('file-selection');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error(t('onlyJsonFilesAllowed'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setSelectedFile(file);
  };

  const validateFile = async (file: File): Promise<FileValidationResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        let programs: AccreditationProgram[] = [];

        try {
          const content = e.target?.result as string;
          const parsedData = JSON.parse(content);

          if (!Array.isArray(parsedData)) {
            errors.push(t('invalidFileFormat'));
            resolve({ isValid: false, programs: [], errors, warnings });
            return;
          }

          programs = parsedData.map((prog: any, index: number) => {
            if (!prog.name || !prog.description?.en || !prog.description?.ar) {
              errors.push(`${t('row')} ${index + 1}: ${t('missingRequiredFields')}`);
              throw new Error('Invalid structure');
            }

            if (!prog.name.trim()) {
              errors.push(`${t('row')} ${index + 1}: ${t('programNameCannotBeEmpty')}`);
              throw new Error('Invalid data');
            }

            if (!prog.description.en.trim() || !prog.description.ar.trim()) {
              errors.push(`${t('row')} ${index + 1}: ${t('descriptionCannotBeEmpty')}`);
              throw new Error('Invalid data');
            }

            // If the imported file includes an ID, use it; otherwise Firebase will generate one
            const programData: any = {
              name: prog.name.trim(),
              description: {
                en: prog.description.en.trim(),
                ar: prog.description.ar.trim(),
              },
            };
            
            // Only add ID if it was explicitly provided in the import file
            if (prog.id && prog.id.trim()) {
              programData.id = prog.id.trim();
            }
            
            return programData as AccreditationProgram;
          });

          if (programs.length === 0) {
            warnings.push(t('noValidProgramsFound'));
          }

          resolve({ isValid: errors.length === 0, programs, errors, warnings });
        } catch (error) {
          if (errors.length === 0) {
            errors.push(t('failedToParseFile'));
          }
          resolve({ isValid: false, programs: [], errors, warnings });
        }
      };

      reader.onerror = () => {
        resolve({
          isValid: false,
          programs: [],
          errors: [t('failedToReadFile')],
          warnings: [],
        });
      };

      reader.readAsText(file);
    });
  };

  const handleContinue = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const result = await validateFile(selectedFile);
    setValidationResult(result);
    setIsProcessing(false);

    if (result.isValid) {
      setStep('review');
    }
  };

  const handleConfirmImport = () => {
    if (!validationResult?.programs) return;
    setStep('confirmation');
  };

  const handleCompleteImport = () => {
    if (!validationResult?.programs) return;
    onConfirmImport(validationResult.programs, importMode);
    resetWizard();
  };

  const resetWizard = () => {
    setStep('file-selection');
    setSelectedFile(null);
    setValidationResult(null);
    setImportMode('add');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetWizard}
      title={t('importAccreditationPrograms')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'file-selection' || step === 'review' || step === 'confirmation'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              1
            </div>
            <div className={`flex-1 h-1 ltr:mx-2 rtl:mx-2 ${step === 'file-selection' ? 'bg-gray-300' : 'bg-brand-primary'}`} />

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'review' || step === 'confirmation' ? 'bg-brand-primary text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              2
            </div>
            <div className={`flex-1 h-1 ltr:mx-2 rtl:mx-2 ${step === 'confirmation' ? 'bg-brand-primary' : 'bg-gray-300'}`} />

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'confirmation' ? 'bg-brand-primary text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: File Selection */}
        {step === 'file-selection' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold">{t('importTip')}</p>
                <p className="mt-1">{t('selectJsonFileWithProgramData')}</p>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-brand-primary hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-5xl mb-2">📁</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('clickOrDragJsonFile')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('maxFileSize')} 5MB</p>
            </div>

            {selectedFile && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">{selectedFile.name}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  {t('change')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && validationResult && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-semibold">{t('validationErrors')}</p>
                    <ul className="mt-2 space-y-1">
                      {validationResult.errors.map((error, idx) => (
                        <li key={idx} className="text-xs">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-semibold">{t('warnings')}</p>
                    <ul className="mt-2 space-y-1">
                      {validationResult.warnings.map((warning, idx) => (
                        <li key={idx} className="text-xs">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validationResult.isValid && validationResult.programs.length > 0 && (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800 dark:text-green-300">
                      <p className="font-semibold">
                        {validationResult.programs.length} {t('validProgramsFound')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('previewPrograms')}</p>
                  <div className="space-y-2">
                    {validationResult.programs.map((prog, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{prog.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{prog.description.en}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('importMode')}</p>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="importMode"
                        value="add"
                        checked={importMode === 'add'}
                        onChange={() => setImportMode('add')}
                        className="w-4 h-4"
                      />
                      <span className="ltr:ml-2 rtl:mr-2 text-sm text-gray-700 dark:text-gray-300">
                        {t('addToExisting')}
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {t('currentPrograms')}: {existingProgramCount}
                        </span>
                      </span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="w-4 h-4"
                      />
                      <span className="ltr:ml-2 rtl:mr-2 text-sm text-gray-700 dark:text-gray-300">
                        {t('replaceAll')}
                        <span className="block text-xs text-red-500">{t('replaceWarning')}</span>
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && validationResult && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold block mb-2">{t('confirmImport')}</span>
                {importMode === 'add'
                  ? t('readyToImportAdd', {
                      count: validationResult.programs.length,
                      total: existingProgramCount + validationResult.programs.length,
                    })
                  : t('readyToImportReplace', {
                      count: validationResult.programs.length,
                      oldCount: existingProgramCount,
                    })}
              </p>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">{t('thisCannot')} {t('beUndone')}</p>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetWizard}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
          >
            {t('cancel')}
          </button>

          <div className="flex gap-2">
            {step !== 'file-selection' && (
              <button
                onClick={() => {
                  if (step === 'review') {
                    setStep('file-selection');
                  } else if (step === 'confirmation') {
                    setStep('review');
                  }
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
              >
                {t('back')}
              </button>
            )}

            {step === 'file-selection' && (
              <button
                onClick={handleContinue}
                disabled={!selectedFile || isProcessing}
                className="px-4 py-2 bg-brand-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
              >
                {isProcessing ? t('validating') : t('continue')}
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={handleConfirmImport}
                disabled={!validationResult?.isValid}
                className="px-4 py-2 bg-brand-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
              >
                {t('next')}
              </button>
            )}

            {step === 'confirmation' && (
              <button
                onClick={handleCompleteImport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                {t('completeImport')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProgramImportWizardModal;

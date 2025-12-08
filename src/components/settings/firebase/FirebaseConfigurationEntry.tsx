import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@/components/icons';

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

interface FormErrors {
  [key: string]: string;
}

export const FirebaseConfigurationEntry: React.FC = () => {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<FirebaseConfig>({
    projectId: '',
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateConfig = (): boolean => {
    const newErrors: FormErrors = {};

    if (!config.projectId.trim()) {
      newErrors.projectId = t('firebaseConfig.projectIdRequired');
    } else if (!/^[a-z0-9-]+$/.test(config.projectId)) {
      newErrors.projectId = t('firebaseConfig.projectIdInvalid');
    }

    if (!config.apiKey.trim()) {
      newErrors.apiKey = t('firebaseConfig.apiKeyRequired');
    } else if (config.apiKey.length < 20) {
      newErrors.apiKey = t('firebaseConfig.apiKeyTooShort');
    }

    if (!config.authDomain.trim()) {
      newErrors.authDomain = t('firebaseConfig.authDomainRequired');
    } else if (!config.authDomain.includes('.firebaseapp.com')) {
      newErrors.authDomain = t('firebaseConfig.authDomainInvalid');
    }

    if (config.storageBucket && !config.storageBucket.includes('.appspot.com')) {
      newErrors.storageBucket = t('firebaseConfig.storageBucketInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      toast.error(t('firebaseConfig.validationFailed'));
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage temporarily
      localStorage.setItem('firebaseConfig', JSON.stringify(config));
      
      // Save to environment or app settings
      const response = await fetch('/api/settings/firebase-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(t('firebaseConfig.saveFailed'));
      }

      setSuccessMessage(t('firebaseConfig.savedSuccessfully'));
      toast.success(t('firebaseConfig.configurationSaved'));
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('firebaseConfig.saveFailed');
      toast.error(errorMsg);
      console.error('Failed to save Firebase config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFromJSON = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);
        const text = await file.text();
        const jsonConfig = JSON.parse(text);
        
        // Validate JSON structure
        const requiredFields = ['projectId', 'apiKey', 'authDomain'];
        const hasRequiredFields = requiredFields.every((field) => field in jsonConfig);
        
        if (!hasRequiredFields) {
          toast.error(t('firebaseConfig.invalidJsonStructure'));
          return;
        }

        setConfig((prev) => ({
          ...prev,
          ...jsonConfig,
        }));
        toast.success(t('firebaseConfig.jsonLoaded'));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : t('firebaseConfig.invalidJson');
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fileInput.click();
  };

  const handleExportJSON = () => {
    if (!validateConfig()) {
      toast.error(t('firebaseConfig.validationFailed'));
      return;
    }

    try {
      const dataStr = JSON.stringify(config, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `firebase-config-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('firebaseConfig.jsonExported'));
    } catch (error) {
      toast.error(t('firebaseConfig.exportFailed'));
    }
  };

  const handleLoadFromEnv = () => {
    setIsLoading(true);
    try {
      // Try to load from environment variables
      const envConfig: Partial<FirebaseConfig> = {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };

      // Filter out undefined values
      const filteredConfig = Object.fromEntries(
        Object.entries(envConfig).filter(([, v]) => v !== undefined)
      );

      if (Object.keys(filteredConfig).length === 0) {
        toast.error(t('firebaseConfig.noEnvVariables'));
        return;
      }

      setConfig((prev) => ({
        ...prev,
        ...filteredConfig,
      }));
      toast.success(t('firebaseConfig.loadedFromEnv'));
    } catch (error) {
      toast.error(t('firebaseConfig.loadFromEnvFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm(t('firebaseConfig.confirmReset'))) {
      setConfig({
        projectId: '',
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
      });
      setErrors({});
      setSuccessMessage('');
      toast.info(t('firebaseConfig.resetComplete'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('firebaseConfig.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('firebaseConfig.description')}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleLoadFromEnv}
          disabled={isLoading || isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
        >
          {isLoading ? t('firebaseConfig.loading') : t('firebaseConfig.loadFromEnv')}
        </button>
        <button
          onClick={handleLoadFromJSON}
          disabled={isLoading || isSaving}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
        >
          {t('firebaseConfig.loadFromJSON')}
        </button>
        <button
          onClick={handleExportJSON}
          disabled={isSaving}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition"
        >
          {t('firebaseConfig.exportJSON')}
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Project ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.projectId')} *
          </label>
          <input
            type="text"
            name="projectId"
            value={config.projectId}
            onChange={handleInputChange}
            placeholder="my-project-id"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.projectId
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition`}
          />
          {errors.projectId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.projectId}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('firebaseConfig.projectIdHint')}
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.apiKey')} *
          </label>
          <div className="relative">
            <input
              type={showKeys ? 'text' : 'password'}
              name="apiKey"
              value={config.apiKey}
              onChange={handleInputChange}
              placeholder="AIzaSyD..."
              className={`w-full px-4 py-2 pr-10 rounded-lg border ${
                errors.apiKey
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition`}
            />
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {showKeys ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {errors.apiKey && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.apiKey}
            </p>
          )}
        </div>

        {/* Auth Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.authDomain')} *
          </label>
          <input
            type="text"
            name="authDomain"
            value={config.authDomain}
            onChange={handleInputChange}
            placeholder="my-project.firebaseapp.com"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.authDomain
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition`}
          />
          {errors.authDomain && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {errors.authDomain}
            </p>
          )}
        </div>

        {/* Database URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.databaseURL')}
          </label>
          <input
            type="text"
            name="databaseURL"
            value={config.databaseURL}
            onChange={handleInputChange}
            placeholder="https://my-project.firebaseio.com"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition"
          />
        </div>

        {/* Storage Bucket */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.storageBucket')}
          </label>
          <input
            type="text"
            name="storageBucket"
            value={config.storageBucket}
            onChange={handleInputChange}
            placeholder="my-project.appspot.com"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.storageBucket
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition`}
          />
          {errors.storageBucket && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.storageBucket}</p>
          )}
        </div>

        {/* Messaging Sender ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.messagingSenderId')}
          </label>
          <input
            type="text"
            name="messagingSenderId"
            value={config.messagingSenderId}
            onChange={handleInputChange}
            placeholder="123456789"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition"
          />
        </div>

        {/* App ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.appId')}
          </label>
          <input
            type="text"
            name="appId"
            value={config.appId}
            onChange={handleInputChange}
            placeholder="1:123456789:web:abcdef123456"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition"
          />
        </div>

        {/* Measurement ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('firebaseConfig.measurementId')}
          </label>
          <input
            type="text"
            name="measurementId"
            value={config.measurementId}
            onChange={handleInputChange}
            placeholder="G-XXXXXXXXXX"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        >
          {isSaving ? t('firebaseConfig.saving') : t('firebaseConfig.save')}
        </button>
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 disabled:bg-gray-400 text-gray-900 dark:text-white rounded-lg font-medium transition"
        >
          {t('firebaseConfig.reset')}
        </button>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          💡 {t('firebaseConfig.helpTitle')}
        </h4>
        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <li>• {t('firebaseConfig.helpStep1')}</li>
          <li>• {t('firebaseConfig.helpStep2')}</li>
          <li>• {t('firebaseConfig.helpStep3')}</li>
          <li>• {t('firebaseConfig.helpStep4')}</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseConfigurationEntry;

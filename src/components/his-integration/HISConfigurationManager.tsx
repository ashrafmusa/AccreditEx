/**
 * HIS Configuration Manager
 * UI for creating, editing, and managing HIS system configurations
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { HISConfig, HISType, AuthType } from '@/services/hisIntegration/types';
import { ConnectorFactory } from '@/services/hisIntegration/integrations/ConnectorFactory';
import { useHISIntegrationStore } from '@/stores/useHISIntegrationStore';
import { useToast } from '@/hooks/useToast';
import { TrashIcon, PencilIcon, PlusIcon, CheckIcon } from '@/components/icons';

interface FormErrors {
  [key: string]: string;
}

interface HISFormData extends Partial<HISConfig> {
  confirmPassword?: string;
}

const AuthTypeOptions: AuthType[] = [AuthType.API_KEY, AuthType.OAUTH2, AuthType.BASIC, AuthType.BEARER_TOKEN, AuthType.CUSTOM];

const getHISTypeOptions = (t: (key: string) => string) => [
  { value: HISType.GENERIC_REST, label: t('genericRestApi'), disabled: false },
  { value: HISType.GENERIC_FHIR, label: t('genericFhirServer'), disabled: false },
  { value: HISType.EPIC, label: t('epicEhr'), disabled: false },
  { value: HISType.CERNER, label: t('cernerMillennium'), disabled: false },
  { value: HISType.HL7, label: t('hl7v2'), disabled: false },
  { value: HISType.MEDIDATA, label: t('medidata'), disabled: true },
];

export const HISConfigurationManager: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const store = useHISIntegrationStore();
  const configurations = store.configurations;
  const HISTypeOptions = getHISTypeOptions(t);

  const [formData, setFormData] = useState<HISFormData>({
    name: '',
    type: HISType.GENERIC_REST,
    baseUrl: '',
    authType: AuthType.API_KEY,
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    enabled: true,
  });

  // Get required auth fields based on auth type
  const getAuthFields = (authType: AuthType) => {
    switch (authType) {
      case AuthType.API_KEY:
        return ['apiKey'];
      case AuthType.OAUTH2:
        return ['clientId', 'clientSecret'];
      case AuthType.BASIC:
        return ['username', 'password'];
      case AuthType.BEARER_TOKEN:
        return ['apiKey'];
      case AuthType.CUSTOM:
        return ['customHeaders'];
      default:
        return [];
    }
  };

  // Get auth fields for selected auth type
  const requiredAuthFields = useMemo(() => getAuthFields(formData.authType as AuthType), [formData.authType]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('configurationNameRequired');
    }

    if (!formData.baseUrl?.trim()) {
      newErrors.baseUrl = t('required');
    } else {
      try {
        new URL(formData.baseUrl);
      } catch {
        newErrors.baseUrl = 'Invalid URL';
      }
    }

    // Validate auth fields
    requiredAuthFields.forEach((field) => {
      const value = (formData as any)[field];
      if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
        newErrors[field] = t('required');
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate config using factory
  const validateWithFactory = (config: HISConfig) => {
    const validation = ConnectorFactory.validateConfiguration(config);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        toast.error(error);
      });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const config: HISConfig = {
        id: editingId || `his-${Date.now()}`,
        name: formData.name!,
        type: formData.type as HISType,
        baseUrl: formData.baseUrl!,
        authType: formData.authType as AuthType,
        apiKey: formData.apiKey,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        username: formData.username,
        password: formData.password,
        customHeaders: formData.customHeaders,
        timeout: formData.timeout || 30000,
        retryCount: formData.retryCount || 3,
        retryDelay: formData.retryDelay || 1000,
        enabled: formData.enabled !== false,
        description: formData.description,
        createdAt: editingId ? (configurations.find(c => c.id === editingId)?.createdAt || new Date()) : new Date(),
        updatedAt: new Date(),
      };

      if (!validateWithFactory(config)) {
        return;
      }

      if (editingId) {
        store.updateConfiguration(editingId, config);
        toast.success(t('configurationUpdated'));
      } else {
        store.addConfiguration(config);
        toast.success(t('configurationCreated'));
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  // Handle edit
  const handleEdit = (config: HISConfig) => {
    setFormData(config);
    setEditingId(config.id);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      store.deleteConfiguration(id);
      toast.success(t('configurationDeleted'));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: HISType.GENERIC_REST,
      baseUrl: '',
      authType: AuthType.API_KEY,
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      enabled: true,
    });
    setEditingId(null);
    setErrors({});
  };

  // Test connection
  const handleTestConnection = async (config: HISConfig) => {
    try {
      const connector = ConnectorFactory.createConnector(config);
      const result = await connector.testConnection();
      if (result.success) {
        toast.success(`✓ ${result.message}`);
      } else {
        toast.error(`✗ ${result.message}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  // Get type metadata
  const getTypeMetadata = (type: HISType) => {
    return ConnectorFactory.getConnectorMetadata(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t('hisConfigurations') || 'HIS Configurations'}
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            Manage connections to healthcare information systems
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg transition"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Configuration</span>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {editingId ? 'Edit Configuration' : 'New HIS Configuration'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                  {t('configurationName')} *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                  }`}
                  placeholder={t('configurationNamePlaceholder')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                  {t('hisType')} *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as HISType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary"
                >
                  {HISTypeOptions.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                {t('baseUrl')} *
              </label>
              <input
                type="url"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary ${
                  errors.baseUrl ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                }`}
                placeholder={t('baseUrlPlaceholder')}
              />
              {errors.baseUrl && <p className="text-red-500 text-xs mt-1">{errors.baseUrl}</p>}
            </div>

            {/* Auth Type */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                {t('authType')} *
              </label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as AuthType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary"
              >
                {AuthTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Auth Fields */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-4 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t('authType').toUpperCase()}
              </p>

              {formData.authType === 'api_key' && (
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                    {t('apiKey')} *
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-secondary dark:text-dark-brand-text-primary ${
                      errors.apiKey ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                    }`}
                    placeholder={t('apiKeyPlaceholder')}
                  />
                  {errors.apiKey && <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>}
                </div>
              )}

              {formData.authType === 'oauth2' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                      {t('clientId')} *
                    </label>
                    <input
                      type="text"
                      value={formData.clientId || ''}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-secondary dark:text-dark-brand-text-primary ${
                        errors.clientId ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                      }`}
                      placeholder={t('clientIdPlaceholder')}
                    />
                    {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                      {t('clientSecret')} *
                    </label>
                    <input
                      type="password"
                      value={formData.clientSecret || ''}
                      onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-secondary dark:text-dark-brand-text-primary ${
                        errors.clientSecret ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                      }`}
                      placeholder={t('clientSecretPlaceholder')}
                    />
                    {errors.clientSecret && <p className="text-red-500 text-xs mt-1">{errors.clientSecret}</p>}
                  </div>
                </>
              )}

              {formData.authType === 'basic' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                      {t('username')} *
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-secondary dark:text-dark-brand-text-primary ${
                        errors.username ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                      }`}
                      placeholder={t('usernamePlaceholder')}
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                      {t('password')} *
                    </label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-secondary dark:text-dark-brand-text-primary ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                      }`}
                      placeholder={t('passwordPlaceholder')}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                </>
              )}

              {formData.authType === 'bearer_token' && (
                <div>
                  <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                    {t('bearerToken')} *
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg dark:bg-dark-bg-secondary dark:text-dark-brand-text-primary ${
                      errors.apiKey ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                    }`}
                    placeholder="Bearer token"
                  />
                  {errors.apiKey && <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>}
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.timeout || 30000}
                  onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary"
                  min="1000"
                  max="60000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                  Retry Count
                </label>
                <input
                  type="number"
                  value={formData.retryCount || 3}
                  onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary"
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                  Retry Delay (ms)
                </label>
                <input
                  type="number"
                  value={formData.retryDelay || 1000}
                  onChange={(e) => setFormData({ ...formData, retryDelay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary"
                  min="0"
                  max="300000"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary"
                placeholder="Optional configuration notes"
                rows={3}
              />
            </div>

            {/* Enabled checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled !== false}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="enabled" className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                Enable this configuration
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                <CheckIcon className="h-5 w-5" />
                <span>{editingId ? 'Update' : 'Create'} Configuration</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configuration List */}
      <div className="space-y-3">
        {configurations.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              No HIS configurations yet. Click "Add Configuration" to get started.
            </p>
          </div>
        ) : (
          configurations.map((config) => (
            <div
              key={config.id}
              className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {config.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded ${config.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded">
                      {getTypeMetadata(config.type)?.name}
                    </span>
                  </div>
                  <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                    {config.baseUrl}
                  </p>
                  {config.description && (
                    <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                      {config.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleTestConnection(config)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 text-sm rounded hover:bg-blue-50 dark:hover:bg-dark-bg-tertiary transition"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleEdit(config)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-dark-bg-tertiary transition"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-dark-bg-tertiary transition"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HISConfigurationManager;

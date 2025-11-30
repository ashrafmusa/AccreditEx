import React, { useState } from 'react';
import { ProjectTemplate } from '@/types/templates';
import { useTranslation } from '@/hooks/useTranslation';
import { CheckIcon, ClockIcon, FolderIcon } from '@/components/icons';

interface TemplateSelectorProps {
  templates: ProjectTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  onPreview: (template: ProjectTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onPreview
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-dark-brand-text-primary">
          {t('selectTemplate')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Start from Scratch Option */}
      <div
        onClick={() => onSelectTemplate(null)}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          selectedTemplateId === null
            ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl">
              ⚙️
            </div>
            <div>
              <h4 className="font-semibold dark:text-dark-brand-text-primary">
                {t('startFromScratch')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('createCustomProject')}
              </p>
            </div>
          </div>
          {selectedTemplateId === null && (
            <CheckIcon className="w-6 h-6 text-brand-primary" />
          )}
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedTemplateId === template.id
                ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl flex-shrink-0">
                  {template.icon || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold dark:text-dark-brand-text-primary truncate">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FolderIcon className="w-4 h-4" />
                      {template.checklist.length} {t('items')}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {template.estimatedDuration} {t('days')}
                    </span>
                  </div>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 ml-2">
                {selectedTemplateId === template.id && (
                  <CheckIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(template);
                  }}
                  className="text-xs text-brand-primary hover:underline whitespace-nowrap"
                >
                  {t('preview')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('noTemplatesAvailable')}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;

import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { CircleStackIcon, ShareIcon, ServerStackIcon } from '../components/icons';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import StatCard from '@/components/common/StatCard';
import ApiStatusWidget from '@/components/data-hub/ApiStatusWidget';
import LiveDataFeed from '@/components/data-hub/LiveDataFeed';
import Collapsible from '@/components/ui/Collapsible';
import DataActionButton from '@/components/settings/DataActionButton';
// FIX: Corrected import path for backendService
import { backendService } from '@/services/BackendService';
import { useToast } from '@/hooks/useToast';
import SettingsCard from '@/components/settings/SettingsCard';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto">
        <code className="font-mono text-indigo-600 dark:text-indigo-300">{children}</code>
    </pre>
);

const DataHubPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const projects = useProjectStore(state => state.projects);
  const users = useUserStore(state => state.users);
  const { documents, standards } = useAppStore();

  const handleExport = () => {
    const jsonData = backendService.exportAllData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accreditex-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('dataExported'));
  };

  const handleImport = async (file: File) => {
      if (file) {
          const text = await file.text();
          try {
              await backendService.importAllData(text);
              toast.success(t('dataImported'));
              window.location.reload();
          } catch (error) {
              toast.error(t('importFailed'));
              console.error("Import failed", error);
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <CircleStackIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('dataHub')}</h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('dataHubDescription')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title={t('totalProjects')} value={projects.length} />
          <StatCard title={t('totalUsers')} value={users.length} />
          <StatCard title={t('totalDocuments')} value={documents.length} />
          <StatCard title={t('totalStandards')} value={standards.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ApiStatusWidget />
          <LiveDataFeed />
      </div>

      <SettingsCard title={t('dataManagement')} description={t('dataManagementDescription')}>
          <DataActionButton
              title={t('exportData')}
              description={t('exportDataDescription')}
              buttonText={t('export')}
              onAction={handleExport}
          />
          <DataActionButton
              title={t('importData')}
              description={t('importDataDescription')}
              buttonText={t('import')}
              onFileAction={handleImport}
              isFileInput
          />
      </SettingsCard>
      
      <div className="space-y-4">
          <Collapsible title={t('fhirFoundation')}>
            <p className="mt-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('fhirFoundationDescription')}</p>
            <p className="mt-4 font-semibold text-sm">{t('exampleResource')}</p>
            <CodeBlock>
    {`{
      "resourceType": "Observation",
      "status": "final",
      "code": {
        "text": "Hand Hygiene Compliance"
      },
      "valueQuantity": {
        "value": 98,
        "unit": "%",
        "system": "http://unitsofmeasure.org"
      }
    }`}
            </CodeBlock>
          </Collapsible>

          <Collapsible title={t('apiArchitecture')}>
            <p className="mt-2 text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('apiArchitectureDescription')}</p>
            <p className="mt-4 font-semibold text-sm">{t('exampleApiCall')}</p>
            <CodeBlock>
    {`POST /api/v1/fhir/Observation
    Host: api.accreditex.com
    Authorization: Bearer <YOUR_API_KEY>

    { ... (FHIR Observation Resource) }`}
            </CodeBlock>
          </Collapsible>
      </div>

    </div>
  );
};

export default DataHubPage;
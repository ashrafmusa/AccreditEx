
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ExclamationTriangleIcon } from '../components/icons';
import RiskRegisterTab from '../components/risk/RiskRegisterTab';
import CapaReportsTab from '../components/risk/CapaReportsTab';
// FIX: Corrected import path for IncidentReportingTab
import IncidentReportingTab from '../components/risk/IncidentReportingTab';
import EffectivenessChecksTab from '../components/risk/EffectivenessChecksTab';
import { useAppStore } from '../stores/useAppStore';
import { useProjectStore } from '../stores/useProjectStore';

type RiskHubTab = 'register' | 'capa' | 'incidents' | 'checks';

const RiskHubPage: React.FC<{ setNavigation: (state: any) => void }> = ({ setNavigation }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<RiskHubTab>('register');
    const { updateCapa } = useProjectStore();
    const projects = useProjectStore(state => state.projects);

    const tabButtonClasses = (tabName: RiskHubTab) =>
        `px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === tabName
            ? 'border-brand-primary text-brand-primary'
            : 'border-transparent text-brand-text-secondary dark:text-dark-brand-text-secondary hover:border-gray-300 dark:hover:border-gray-600'
        }`;
    
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
                <ExclamationTriangleIcon className="h-8 w-8 text-brand-primary" />
                <div>
                    <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('riskHubTitle')}</h1>
                    <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('riskHubDescription')}</p>
                </div>
            </div>

            <div className="border-b border-gray-200 dark:border-dark-brand-border">
                <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                    <button onClick={() => setActiveTab('register')} className={tabButtonClasses('register')}>{t('riskRegister')}</button>
                    <button onClick={() => setActiveTab('capa')} className={tabButtonClasses('capa')}>{t('capaReports')}</button>
                    <button onClick={() => setActiveTab('incidents')} className={tabButtonClasses('incidents')}>{t('incidentReporting')}</button>
                    <button onClick={() => setActiveTab('checks')} className={tabButtonClasses('checks')}>{t('effectivenessChecks')}</button>
                </nav>
            </div>
            
            <div>
                {activeTab === 'register' && <RiskRegisterTab />}
                {activeTab === 'capa' && <CapaReportsTab />}
                {activeTab === 'incidents' && <IncidentReportingTab />}
                {activeTab === 'checks' && <EffectivenessChecksTab projects={projects} onUpdateCapa={updateCapa} />}
            </div>
        </div>
    );
};

export default RiskHubPage;
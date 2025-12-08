import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ServerStackIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@/components/icons';

type Status = 'Operational' | 'Checking' | 'Error';

interface ServiceStatus {
    name: string;
    status: Status;
    details: string;
}

const ApiStatusWidget: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'AccreditEx API', status: 'Operational', details: 'apiStatus' },
        { name: 'FHIR Endpoint', status: 'Operational', details: 'connected' },
        { name: 'HRIS Sync', status: 'Operational', details: 'lastSynced' },
    ]);

    const runCheck = () => {
        setIsLoading(true);
        setServices(s => s.map(service => ({ ...service, status: 'Checking' })));
        
        setTimeout(() => {
            setServices([
                { name: 'AccreditEx API', status: 'Operational', details: 'apiStatus' },
                { name: 'FHIR Endpoint', status: 'Operational', details: 'connected' },
                { name: 'HRIS Sync', status: 'Operational', details: 'lastSynced' },
            ]);
            setIsLoading(false);
        }, 1500);
    };

    const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
        if (status === 'Checking') return <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />;
        if (status === 'Operational') return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    };

    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
                    <ServerStackIcon className="w-6 h-6 text-brand-primary" />
                    {t('apiServices')}
                </h3>
                <button
                    onClick={runCheck}
                    disabled={isLoading}
                    className="text-sm font-semibold text-brand-primary hover:underline disabled:opacity-50"
                >
                    {isLoading ? t('checking') : t('runHealthCheck')}
                </button>
            </div>
            <div className="mt-4 space-y-3 flex-grow">
                {services.map(service => (
                    <div key={service.name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <StatusIcon status={service.status} />
                            <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                           {t(service.details as any)}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">{t('lastChecked')}: {new Date().toLocaleTimeString()}</p>
        </div>
    );
};

export default ApiStatusWidget;

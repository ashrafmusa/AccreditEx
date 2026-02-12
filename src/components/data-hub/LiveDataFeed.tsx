import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ShareIcon } from '@/components/icons';

interface LogEntry {
    id: number;
    timestamp: string;
    messageKey: 'newObservation' | 'patientRecordUpdated' | 'measureReportReceived';
    resourceType: 'Observation' | 'Patient' | 'MeasureReport';
}

const LiveDataFeed: React.FC = () => {
    const { t } = useTranslation();
    const [log, setLog] = useState<LogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const resourceTypes: LogEntry['resourceType'][] = ['Observation', 'Patient', 'MeasureReport'];
    const messageKeys: LogEntry['messageKey'][] = ['newObservation', 'patientRecordUpdated', 'measureReportReceived'];

    useEffect(() => {
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * resourceTypes.length);
            const newEntry: LogEntry = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                messageKey: messageKeys[randomIndex],
                resourceType: resourceTypes[randomIndex],
            };
            setLog(prev => [newEntry, ...prev.slice(0, 19)]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = 0;
        }
    }, [log]);

    const getColors = (type: LogEntry['resourceType']) => {
        switch(type) {
            case 'Observation': return 'border-blue-500 text-blue-700 dark:text-blue-300';
            case 'Patient': return 'border-green-500 text-green-700 dark:text-green-300';
            case 'MeasureReport': return 'border-rose-500 text-pink-600 dark:text-rose-300';
        }
    }

    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border h-full flex flex-col">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
                <ShareIcon className="w-6 h-6 text-brand-primary" />
                {t('liveDataFeed')}
            </h3>
            <div ref={logContainerRef} className="mt-4 flex-grow h-64 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                {log.map(entry => (
                     <div key={entry.id} className={`p-2 rounded-md border-l-4 ${getColors(entry.resourceType)} animate-[fadeIn_0.5s_ease-out]`}>
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold">{t('fhirResourceReceived')}</p>
                            <p className="text-xs text-gray-400">{entry.timestamp}</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t(entry.messageKey)}: <span className="font-mono">{entry.resourceType}</span></p>
                    </div>
                ))}
                 {log.length === 0 && <p className="text-sm text-center text-gray-400 pt-16">{t('waitingForData')}</p>}
            </div>
        </div>
    );
};

export default LiveDataFeed;

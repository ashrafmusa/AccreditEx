import React, { useState, useMemo } from 'react';
import { IncidentReport } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../stores/useAppStore';
import { useUserStore } from '../../stores/useUserStore';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons';
import IncidentModal from './IncidentModal';
import EmptyState from '../common/EmptyState';
import { ExclamationTriangleIcon } from '../icons';


const IncidentReportingTab: React.FC = () => {
  const { t } = useTranslation();
  const { incidentReports, addIncidentReport, updateIncidentReport, deleteIncidentReport } = useAppStore();
  const { currentUser } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(null);

  const handleSave = (reportData: IncidentReport | Omit<IncidentReport, 'id'>) => {
    if ('id' in reportData) {
      updateIncidentReport(reportData);
    } else {
      addIncidentReport({ ...reportData, reportedBy: currentUser!.name });
    }
    setIsModalOpen(false);
  };
  
  const handleDelete = (reportId: string) => {
    if (window.confirm(t('areYouSureDeleteIncident'))) {
      deleteIncidentReport(reportId);
    }
  };

  const sortedReports = useMemo(() => 
    [...incidentReports].sort((a,b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime()), 
  [incidentReports]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
          <button onClick={() => { setEditingReport(null); setIsModalOpen(true); }} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center font-semibold text-sm">
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>{t('reportNewIncident')}
          </button>
      </div>
      
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('incidentDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('incidentType')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('severity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{t('status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
              {sortedReports.map(report => (
                <tr key={report.id}>
                  <td className="px-6 py-4">{new Date(report.incidentDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium">{report.type}</td>
                  <td className="px-6 py-4 text-sm">{report.severity}</td>
                  <td className="px-6 py-4 text-sm">{report.status}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => { setEditingReport(report); setIsModalOpen(true); }} className="p-1"><PencilIcon className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(report.id)} className="p-1"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedReports.length === 0 && <EmptyState icon={ExclamationTriangleIcon} title={t('noIncidents')} message="" />}
        </div>
      </div>
      
      {isModalOpen && (
        <IncidentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          existingReport={editingReport}
        />
      )}
    </div>
  );
};

export default IncidentReportingTab;
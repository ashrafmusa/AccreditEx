import React, { useState, useEffect, FC } from 'react';
import { IncidentReport } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import DatePicker from '../ui/DatePicker';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: IncidentReport | Omit<IncidentReport, 'id'>) => void;
  existingReport: IncidentReport | null;
}

const IncidentModal: FC<IncidentModalProps> = ({ isOpen, onClose, onSave, existingReport }) => {
  const { t, dir } = useTranslation();
  const isEditMode = !!existingReport;

  const [incidentDate, setIncidentDate] = useState<Date | undefined>(new Date());
  const [location, setLocation] = useState('');
  const [type, setType] = useState<IncidentReport['type']>('Patient Safety');
  const [severity, setSeverity] = useState<IncidentReport['severity']>('Minor');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IncidentReport['status']>('Open');
  
  useEffect(() => {
    if (existingReport) {
        setIncidentDate(new Date(existingReport.incidentDate));
        setLocation(existingReport.location);
        setType(existingReport.type);
        setSeverity(existingReport.severity);
        setDescription(existingReport.description);
        setStatus(existingReport.status);
    } else {
        setIncidentDate(new Date());
        setLocation('');
        setType('Patient Safety');
        setSeverity('Minor');
        setDescription('');
        setStatus('Open');
    }
  }, [existingReport, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDate || !location || !description) return;
    
    const reportData = {
        incidentDate: incidentDate.toISOString().split('T')[0], 
        location, 
        type, 
        severity, 
        description, 
        status,
        reportedBy: '', // This will be set by the store/backend
        correctiveActionIds: existingReport?.correctiveActionIds || [],
    };

    if (isEditMode) {
      onSave({ ...reportData, id: existingReport.id });
    } else {
      onSave(reportData);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter" onClick={e => e.stopPropagation()} dir={dir}>
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <div className="p-6 border-b dark:border-dark-brand-border">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">{isEditMode ? t('editIncident') : t('reportNewIncident')}</h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className={labelClasses}>{t('incidentDate')}</label>
                    <DatePicker date={incidentDate} setDate={setIncidentDate} />
                </div>
                <div><label htmlFor="location" className={labelClasses}>{t('location')}</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} id="location" className={inputClasses} required /></div>
                <div>
                    <label htmlFor="type" className={labelClasses}>{t('incidentType')}</label>
                    <select id="type" value={type} onChange={e => setType(e.target.value as any)} className={inputClasses}>
                        <option value="Patient Safety">{t('patientSafety')}</option>
                        <option value="Staff Injury">{t('staffInjury')}</option>
                        <option value="Facility Issue">{t('facilityIssue')}</option>
                        <option value="Medication Error">{t('medicationError')}</option>
                        <option value="Other">{t('other')}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="severity" className={labelClasses}>{t('severity')}</label>
                    <select id="severity" value={severity} onChange={e => setSeverity(e.target.value as any)} className={inputClasses}>
                        <option value="Minor">{t('minor')}</option>
                        <option value="Moderate">{t('moderate')}</option>
                        <option value="Severe">{t('severe')}</option>
                        <option value="Sentinel Event">{t('sentinelEvent')}</option>
                    </select>
                </div>
                {isEditMode && <div>
                    <label htmlFor="status" className={labelClasses}>{t('status')}</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as any)} className={inputClasses}>
                        <option value="Open">{t('open')}</option>
                        <option value="Under Investigation">{t('underInvestigation')}</option>
                        <option value="Closed">{t('closed')}</option>
                    </select>
                </div>}
            </div>
            <div>
                <label htmlFor="desc" className={labelClasses}>{t('description')}</label>
                <textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputClasses} required />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex justify-end gap-3 border-t dark:border-dark-brand-border">
            <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md text-sm">{t('cancel')}</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-sky-700">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentModal;
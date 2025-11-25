import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { SearchIcon, CircleStackIcon } from '../icons';

interface LinkDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (resource: { resourceType: string; resourceId: string; displayText: string }) => void;
}

const mockFhirResources = [
    { resourceType: 'Observation', resourceId: 'obs-123', displayText: 'Lab Result: Hemoglobin A1c - 7.2%' },
    { resourceType: 'MeasureReport', resourceId: 'mr-456', displayText: 'Quality Metric: Hand Hygiene Compliance - 98%' },
    { resourceType: 'DocumentReference', resourceId: 'doc-789', displayText: 'Policy: Patient Identification v3.0' },
    { resourceType: 'Immunization', resourceId: 'imm-101', displayText: 'Vaccination Record: Influenza' },
    { resourceType: 'MedicationAdministration', resourceId: 'med-212', displayText: 'Medication Event: Warfarin Administered' },
];

const LinkDataModal: React.FC<LinkDataModalProps> = ({ isOpen, onClose, onLink }) => {
    const { t, dir } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredResources = mockFhirResources.filter(r => 
        r.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter" onClick={onClose}>
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-lg m-4 modal-content-enter border border-brand-border dark:border-dark-brand-border" onClick={(e) => e.stopPropagation()} dir={dir}>
                <div className="p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">{t('linkLiveData')}</h3>
                    <div className="mt-4">
                        <div className="relative">
                            <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search FHIR resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-brand-surface dark:bg-dark-brand-surface"
                            />
                        </div>
                    </div>
                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                        {filteredResources.map(resource => (
                            <button
                                key={resource.resourceId}
                                onClick={() => onLink(resource)}
                                className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                            >
                                <CircleStackIcon className="w-5 h-5 text-brand-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">{resource.displayText}</p>
                                    <p className="text-xs text-gray-500">{resource.resourceType}/{resource.resourceId}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 sm:px-6 py-3 flex justify-end rounded-b-lg">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkDataModal;

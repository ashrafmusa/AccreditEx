import React, { useState } from 'react';
import { ChecklistItem, Project } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { PaperClipIcon, CircleStackIcon, PlusIcon } from '@/components/icons';
import { useAppStore } from '@/stores/useAppStore';
import UploadEvidenceModal from '../documents/UploadEvidenceModal';

interface ChecklistEvidenceProps {
    item: ChecklistItem;
    project: Project;
    isFinalized: boolean;
    onUpload: (projectId: string, checklistItemId: string, fileData: any) => void;
    onLinkData: () => void;
}

const ChecklistEvidence: React.FC<ChecklistEvidenceProps> = ({ item, project, isFinalized, onUpload, onLinkData }) => {
    const { t, lang } = useTranslation();
    const { documents } = useAppStore();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const evidenceDocs = documents.filter(doc => item.evidenceFiles.includes(doc.id));
    
    const handleSaveUpload = (data: { name: { en: string; ar: string }, uploadedFile: { name: string, type: string }}) => {
        onUpload(project.id, item.id, data);
        setIsUploadModalOpen(false);
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{t('evidence')}</label>
            <div className="space-y-2">
                {evidenceDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                        <PaperClipIcon className="w-4 h-4 text-gray-500" />
                        <span className="flex-grow">{doc.name[lang]}</span>
                    </div>
                ))}
                 {item.linkedFhirResources?.map(res => (
                    <div key={res.resourceId} className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md text-sm">
                        <CircleStackIcon className="w-4 h-4 text-blue-500" />
                        <span className="flex-grow">{res.displayText}</span>
                    </div>
                ))}
            </div>
            {!isFinalized && (
                <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                        <PlusIcon className="w-4 h-4"/>{t('uploadEvidence')}
                    </button>
                     <button onClick={onLinkData} className="flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
                        <CircleStackIcon className="w-4 h-4"/>{t('linkLiveData')}
                    </button>
                </div>
            )}
             {isUploadModalOpen && <UploadEvidenceModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSave={handleSaveUpload} />}
        </div>
    );
};

export default ChecklistEvidence;
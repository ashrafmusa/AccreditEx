import React from 'react';
import { AppDocument } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { PencilIcon, TrashIcon } from '../icons';

interface DocumentRowProps {
    doc: AppDocument;
    canModify: boolean;
    onApprove: (doc: AppDocument) => void;
    onDelete: (docId: string) => void;
    onView: (doc: AppDocument) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ doc, canModify, onApprove, onDelete, onView }) => {
    const { t, lang } = useTranslation();

    const statusColors: Record<AppDocument['status'], string> = {
        Approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Pending Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
        <tr onClick={() => onView(doc)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
            <td className="px-6 py-4">
                <div className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">{doc.name[lang]}</div>
                <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">{doc.type}</div>
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[doc.status]}`}>{t((doc.status.charAt(0).toLowerCase() + doc.status.slice(1).replace(' ', '')) as any) || doc.status}</span>
            </td>
            <td className="px-6 py-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">v{doc.currentVersion}</td>
            <td className="px-6 py-4 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">{doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : 'N/A'}</td>
            <td className="px-6 py-4 text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                    {canModify && doc.status === 'Pending Review' && (
                        <button onClick={(e) => { e.stopPropagation(); onApprove(doc);}} className="text-green-600 hover:underline font-semibold">{t('approve')}</button>
                    )}
                    {canModify && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onView(doc);}} className="p-1 text-gray-500 hover:text-brand-primary" title={t('edit')}><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(doc.id);}} className="p-1 text-gray-500 hover:text-red-600" title={t('delete')}><TrashIcon className="w-4 h-4" /></button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default DocumentRow;

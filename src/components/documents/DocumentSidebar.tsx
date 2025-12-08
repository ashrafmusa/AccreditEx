import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { 
    FolderIcon, 
    DocumentTextIcon, 
    UserGroupIcon, 
    ClockIcon, 
    CheckCircleIcon,
    BookmarkIcon
} from '../icons';
import { AppDocument, Department } from '../../types';

interface DocumentSidebarProps {
    activeCategory: string;
    onSelectCategory: (category: string) => void;
    documentCounts: Record<string, number>;
    departments: Department[];
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ activeCategory, onSelectCategory, documentCounts, departments }) => {
    const { t, lang } = useTranslation();

    const categories = [
        { id: 'all', label: (t('allDocuments') || 'All Documents') as string, icon: FolderIcon },
        { id: 'my_documents', label: (t('myDocuments') || 'My Documents') as string, icon: BookmarkIcon },
        { id: 'recent', label: (t('recent') || 'Recent') as string, icon: ClockIcon },
    ];

    const types = [
        { id: 'Policy', label: (t('policies') || 'Policies') as string, icon: DocumentTextIcon },
        { id: 'Procedure', label: (t('procedures') || 'Procedures') as string, icon: DocumentTextIcon },
        { id: 'Process Map', label: (t('processMaps') || 'Process Maps') as string, icon: DocumentTextIcon },
        { id: 'Evidence', label: (t('evidence') || 'Evidence') as string, icon: DocumentTextIcon },
        { id: 'Report', label: (t('reports') || 'Reports') as string, icon: DocumentTextIcon },
    ];

    // Map Firebase departments to sidebar items
    const departmentItems = departments.map(dept => ({
        id: dept.id,
        label: dept.name[lang] || dept.name.en,
        icon: UserGroupIcon
    }));

    return (
        <div className="w-64 bg-white dark:bg-dark-brand-surface border-r border-gray-200 dark:border-dark-brand-border flex-shrink-0 min-h-[600px] p-4 hidden md:block rounded-l-lg">
            <div className="space-y-6">
                {/* Main Categories */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{t('library') || 'Library'}</h3>
                    <div className="space-y-1">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => onSelectCategory(cat.id)}
                                className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeCategory === cat.id 
                                    ? 'bg-brand-primary/10 text-brand-primary' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex items-center">
                                    <cat.icon className={`mr-3 h-5 w-5 ${activeCategory === cat.id ? 'text-brand-primary' : 'text-gray-400'}`} />
                                    {cat.label}
                                </div>
                                {documentCounts[cat.id] > 0 && (
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                        {documentCounts[cat.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Document Types */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{t('types') || 'Types'}</h3>
                    <div className="space-y-1">
                        {types.map(type => (
                            <button
                                key={type.id}
                                onClick={() => onSelectCategory(type.id)}
                                className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeCategory === type.id 
                                    ? 'bg-brand-primary/10 text-brand-primary' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex items-center">
                                    <type.icon className={`mr-3 h-5 w-5 ${activeCategory === type.id ? 'text-brand-primary' : 'text-gray-400'}`} />
                                    {type.label}
                                </div>
                                {documentCounts[type.id] > 0 && (
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                        {documentCounts[type.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Departments */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{t('departments') || 'Departments'}</h3>
                    <div className="space-y-1">
                        {departmentItems.map(dept => (
                            <button
                                key={dept.id}
                                onClick={() => onSelectCategory(dept.id)}
                                className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeCategory === dept.id 
                                    ? 'bg-brand-primary/10 text-brand-primary' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex items-center">
                                    <dept.icon className={`mr-3 h-5 w-5 ${activeCategory === dept.id ? 'text-brand-primary' : 'text-gray-400'}`} />
                                    {dept.label}
                                </div>
                                {documentCounts[dept.id] > 0 && (
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                        {documentCounts[dept.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentSidebar;

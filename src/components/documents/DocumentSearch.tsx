import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { 
    MagnifyingGlassIcon, 
    FunnelIcon, 
    XMarkIcon,
    CalendarDaysIcon,
    UserIcon,
    TagIcon
} from '../icons';

interface DocumentSearchProps {
    onSearch: (query: string) => void;
    onFilter: (filters: DocumentFilters) => void;
}

export interface DocumentFilters {
    status?: string;
    dateRange?: { start: Date; end: Date };
    author?: string;
    tags?: string[];
    category?: string;
    departmentId?: string;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ onSearch, onFilter }) => {
    const { t } = useTranslation();
    const { departments } = useAppStore();
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<DocumentFilters>({});

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onSearch(val);
    };

    const handleFilterChange = (key: keyof DocumentFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilter(newFilters);
    };

    const clearFilters = () => {
        setFilters({});
        onFilter({});
        setShowFilters(false);
    };

    return (
        <div className="bg-white dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={handleSearchChange}
                        placeholder={t('searchDocuments') || 'Search documents...'}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                        showFilters || Object.keys(filters).length > 0
                            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                >
                    <FunnelIcon className="h-5 w-5 mr-2" />
                    {t('filters') || 'Filters'}
                    {Object.keys(filters).length > 0 && (
                        <span className="ml-2 bg-brand-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {Object.keys(filters).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('status') || 'Status'}
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">{t('allStatuses') || 'All Statuses'}</option>
                                <option value="Draft">{t('draft') || 'Draft'}</option>
                                <option value="Pending Review">{t('pendingReview') || 'Pending Review'}</option>
                                <option value="Approved">{t('approved') || 'Approved'}</option>
                                <option value="Rejected">{t('rejected') || 'Rejected'}</option>
                                <option value="Archived">{t('archived') || 'Archived'}</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('category') || 'Category'}
                            </label>
                            <select
                                value={filters.category || ''}
                                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">{t('allCategories') || 'All Categories'}</option>
                                <option value="Quality Management">{t('qualityManagement') || 'Quality Management'}</option>
                                <option value="Safety">{t('safety') || 'Safety'}</option>
                                <option value="Operations">{t('operations') || 'Operations'}</option>
                                <option value="Human Resources">{t('humanResources') || 'Human Resources'}</option>
                                <option value="Finance">{t('finance') || 'Finance'}</option>
                                <option value="IT">{t('informationTechnology') || 'Information Technology'}</option>
                                <option value="Compliance">{t('compliance') || 'Compliance'}</option>
                            </select>
                        </div>

                        {/* Department Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('department') || 'Department'}
                            </label>
                            <select
                                value={filters.departmentId || ''}
                                onChange={(e) => handleFilterChange('departmentId', e.target.value || undefined)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">{t('allDepartments') || 'All Departments'}</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Author Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('author') || 'Author'}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.author || ''}
                                    onChange={(e) => handleFilterChange('author', e.target.value || undefined)}
                                    placeholder={t('filterByAuthor') || 'Filter by author'}
                                    className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
                        >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            {t('clearFilters') || 'Clear Filters'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentSearch;

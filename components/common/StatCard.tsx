import React, { FC } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CircleStackIcon } from '@/components/icons';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ElementType;
    color?: string; // Tailwind color class e.g., 'bg-blue-500'
    isLiveLinkable?: boolean;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon: Icon, color, isLiveLinkable }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-5 rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-1 relative group">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm font-semibold">{title}</p>
                    <p className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-2">{value}</p>
                </div>
                {Icon && (
                    <div className={`text-white p-3 rounded-lg ${color || 'bg-brand-primary'} shadow-md`}>
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>
            {isLiveLinkable && (
                <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity" title={t('liveDataTooltip')}>
                    <CircleStackIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
            )}
        </div>
    );
};

export default StatCard;
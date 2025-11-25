import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const ProblematicStandardsTable: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h3 className="text-lg font-semibold">{t('topProblematicStandardsChart')}</h3>
            <p>{t('noDataAvailable')}</p>
        </div>
    );
};

export default ProblematicStandardsTable;
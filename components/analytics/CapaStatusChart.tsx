import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const CapaStatusChart: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h3 className="text-lg font-semibold">{t('capaStatusAnalysis')}</h3>
            <p>{t('noDataAvailable')}</p>
        </div>
    );
};

export default CapaStatusChart;
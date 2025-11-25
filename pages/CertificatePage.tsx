import React from 'react';
import { CertificateData } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../stores/useAppStore';
import { CheckBadgeIcon, LogoIcon } from '../components/icons';

interface CertificatePageProps {
    certificate: CertificateData;
}

const CertificatePage: React.FC<CertificatePageProps> = ({ certificate }) => {
    const { t, lang } = useTranslation();
    const { appSettings } = useAppStore();

    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 flex items-center justify-center min-h-screen">
            <div className="w-full max-w-4xl bg-white dark:bg-dark-brand-surface shadow-2xl rounded-lg p-8 border-4 border-gray-300 dark:border-gray-600 relative print:shadow-none print:border-none">
                <div className="absolute inset-0 bg-repeat bg-center opacity-5" style={{backgroundImage: "url('/logo.svg')"}}></div>
                
                <div className="text-center relative z-10">
                    <div className="flex justify-center items-center gap-4">
                        {appSettings?.logoUrl ? (
                            <img src={appSettings.logoUrl} alt="Logo" className="h-16 w-16" />
                        ) : (
                            <LogoIcon className="h-16 w-16 text-brand-primary"/>
                        )}
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{appSettings?.appName}</h1>
                    </div>
                    
                    <h2 className="text-4xl font-bold text-brand-primary mt-8 tracking-wider uppercase">{t('certificateOfCompletion')}</h2>

                    <p className="mt-8 text-lg text-gray-600 dark:text-gray-400">{t('thisCertifiesThat')}</p>
                    
                    <p className="text-5xl font-handwriting my-4 text-gray-800 dark:text-gray-200">{certificate.userName}</p>

                    <p className="text-lg text-gray-600 dark:text-gray-400">{t('hasSuccessfullyCompleted')}</p>
                    <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-2">"{certificate.trainingTitle[lang]}"</p>

                    <div className="mt-8 flex justify-center items-center gap-8">
                        <div>
                            <p className="text-sm text-gray-500">{t('on')}</p>
                            <p className="font-semibold border-t-2 border-gray-300 pt-1">{new Date(certificate.completionDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('withAScoreOf')}</p>
                            <p className="font-semibold border-t-2 border-gray-300 pt-1">{certificate.score}%</p>
                        </div>
                    </div>
                    
                    <CheckBadgeIcon className="h-20 w-20 text-green-500 mx-auto mt-8" />
                </div>
            </div>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap'); .font-handwriting { font-family: 'Caveat', cursive; }`}
            </style>
        </div>
    );
};

export default CertificatePage;

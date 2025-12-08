import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { LogoIcon, ChartPieIcon, FolderIcon, UsersIcon, ShieldCheckIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/icons';

interface OnboardingPageProps {
  onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { t, dir } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: LogoIcon,
      titleKey: 'welcomeToAccreditEx' as const,
      descriptionKey: 'onboardingWelcomeMessage' as const,
    },
    {
      icon: ChartPieIcon,
      titleKey: 'onboardingDashboardTitle' as const,
      descriptionKey: 'onboardingDashboardMessage' as const,
    },
    {
      icon: FolderIcon,
      titleKey: 'onboardingProjectsTitle' as const,
      descriptionKey: 'onboardingProjectsMessage' as const,
    },
    {
      icon: ShieldCheckIcon,
      titleKey: 'onboardingAccreditationTitle' as const,
      descriptionKey: 'onboardingAccreditationMessage' as const,
    },
    {
      icon: UsersIcon,
      titleKey: 'onboardingUsersTitle' as const,
      descriptionKey: 'onboardingUsersMessage' as const,
    },
    {
      icon: SparklesIcon,
      titleKey: 'onboardingAiTitle' as const,
      descriptionKey: 'onboardingAiMessage' as const,
    },
  ];

  const CurrentIcon = steps[step].icon;
  const isLastStep = step === steps.length - 1;

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));
  
  return (
    <div className="min-h-screen bg-brand-background dark:bg-dark-brand-background flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-2xl bg-brand-surface dark:bg-dark-brand-surface rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.5s_ease-out_forwards]">
        <div className="p-8 sm:p-12 text-center">
            <div key={step} className="animate-[fadeInUp_0.5s_ease-out]">
                <CurrentIcon className="w-16 h-16 mx-auto text-brand-primary" />
                <h1 className="text-3xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-6">{t(steps[step].titleKey)}</h1>
                <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-4 max-w-md mx-auto">{t(steps[step].descriptionKey)}</p>
            </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-brand-primary scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className="px-4 py-2 text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {dir === 'ltr' ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
              <span>{t('previous')}</span>
            </button>
            
            {isLastStep ? (
              <button
                onClick={onComplete}
                className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
              >
                {t('getStarted')}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <span>{t('next')}</span>
                {dir === 'ltr' ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

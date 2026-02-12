import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Project, CAPAReport } from '@/types';
import { ArrowPathIcon, ClipboardDocumentCheckIcon, BeakerIcon, CheckBadgeIcon } from '@/components/icons';

interface PDCACycleTrackerProps {
  projects: Project[];
}

const PDCACycleTracker: React.FC<PDCACycleTrackerProps> = ({ projects }) => {
  const { t } = useTranslation();

  // Aggregate all CAPAs
  const allCapas = projects.flatMap(p => p.capaReports);

  // Categorize CAPAs into PDCA stages
  // Plan: Open, Root Cause Analysis
  // Do: Implementation
  // Check: Effectiveness Check
  // Act: Closure / Standardization
  const pdcaStats = {
    plan: allCapas.filter(c => c.status === 'Open' || !c.rootCause).length,
    do: allCapas.filter(c => c.status === 'In Progress' && c.rootCause && !c.effectivenessCheck?.completed).length,
    check: allCapas.filter(c => c.effectivenessCheck?.required && !c.effectivenessCheck.completed).length,
    act: allCapas.filter(c => c.status === 'Closed').length
  };

  const total = allCapas.length || 1; // Avoid division by zero

  const stages = [
    { 
      id: 'plan', 
      label: t('plan') || 'Plan', 
      count: pdcaStats.plan, 
      icon: BeakerIcon, 
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
      description: t('planDesc') || 'Identify problems & root causes'
    },
    { 
      id: 'do', 
      label: t('do') || 'Do', 
      count: pdcaStats.do, 
      icon: ArrowPathIcon, 
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
      description: t('doDesc') || 'Implement corrective actions'
    },
    { 
      id: 'check', 
      label: t('check') || 'Check', 
      count: pdcaStats.check, 
      icon: ClipboardDocumentCheckIcon, 
      color: 'text-rose-600 bg-rose-100 dark:bg-pink-900/30 dark:text-rose-400',
      description: t('checkDesc') || 'Verify effectiveness'
    },
    { 
      id: 'act', 
      label: t('act') || 'Act', 
      count: pdcaStats.act, 
      icon: CheckBadgeIcon, 
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
      description: t('actDesc') || 'Standardize & close'
    }
  ];

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-6">
        {t('pdcaCycleStatus') || 'Continuous Improvement (PDCA) Cycle'}
      </h3>
      
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-8 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 hidden md:block" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative flex flex-col items-center text-center group">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110 ${stage.color}`}>
                <stage.icon className="w-8 h-8" />
              </div>
              
              <h4 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {stage.label}
              </h4>
              
              <div className="text-3xl font-bold my-2 text-brand-primary dark:text-brand-primary-400">
                {stage.count}
              </div>
              
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary px-2">
                {stage.description}
              </p>

              {/* Progress Bar for each stage */}
              <div className="w-full mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${stage.color.split(' ')[0].replace('text-', 'bg-')}`} 
                  style={{ width: `${(stage.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDCACycleTracker;

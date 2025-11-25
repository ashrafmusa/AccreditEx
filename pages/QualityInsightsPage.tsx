import React, { useMemo } from 'react';
import { Project, Risk, User, Department, Competency, UserTrainingStatus } from '@/types';
import { useTranslation } from '../hooks/useTranslation';
import { LightBulbIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from '../components/icons';
import StatCard from '../components/common/StatCard';
import RootCauseAnalysis from '../components/quality-insights/RootCauseAnalysis';
import CompetencyGapReport from '../components/quality-insights/CompetencyGapReport';
import TrainingEffectivenessChart from '../components/quality-insights/TrainingEffectivenessChart';
import AIQualityBriefing from '../components/quality-insights/AIQualityBriefing';

interface QualityInsightsPageProps {
  projects: Project[];
  risks: Risk[];
  users: User[];
  departments: Department[];
  competencies: Competency[];
  userTrainingStatuses: { [userId: string]: UserTrainingStatus };
}

const QualityInsightsPage: React.FC<QualityInsightsPageProps> = (props) => {
  const { t } = useTranslation();

  const kpis = useMemo(() => {
    const pendingChecks = props.projects.flatMap(p => p.capaReports).filter(c => c.effectivenessCheck?.required && !c.effectivenessCheck.completed).length;
    const pendingAcks = props.users.flatMap(u => u.readAndAcknowledge || []).filter(ack => !ack.acknowledgedDate).length;
    return { pendingChecks, pendingAcks };
  }, [props.projects, props.users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <LightBulbIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('qualityInsightsHub')}</h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('qualityInsightsDescription')}</p>
        </div>
      </div>

      <AIQualityBriefing
        projects={props.projects}
        risks={props.risks}
        users={props.users}
        departments={props.departments}
        competencies={props.competencies}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title={t('pendingEffectivenessChecks')} value={kpis.pendingChecks} icon={ClipboardDocumentCheckIcon} color="from-amber-500 to-amber-700 bg-gradient-to-br" />
          <StatCard title={t('pendingAcknowledgements')} value={kpis.pendingAcks} icon={CheckCircleIcon} color="from-sky-500 to-sky-700 bg-gradient-to-br" />
      </div>

      <RootCauseAnalysis projects={props.projects} risks={props.risks} />
      
      <TrainingEffectivenessChart 
        projects={props.projects}
        risks={props.risks}
        departments={props.departments}
        users={props.users}
        userTrainingStatuses={props.userTrainingStatuses}
      />

      <CompetencyGapReport
        departments={props.departments}
        users={props.users}
        competencies={props.competencies}
      />
    </div>
  );
};

export default QualityInsightsPage;

import React, { useMemo, useState } from 'react';
import { NavigationState, Project, ChecklistItem } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import { ChartBarSquareIcon } from '@/components/icons';
import KpiCard from '@/components/analytics/KpiCard';
import ComplianceOverTimeChart from '@/components/analytics/ComplianceOverTimeChart';
import DepartmentalPerformanceChart from '@/components/analytics/DepartmentalPerformanceChart';
import ProblematicStandardsChart from '@/components/analytics/ProblematicStandardsChart';
import CapaRootCauseChart from '@/components/analytics/CapaRootCauseChart';
import TaskStatusDistributionChart from '@/components/analytics/TaskStatusDistributionChart';
import TaskDistributionByUserChart from '@/components/analytics/TaskDistributionByUserChart';
import StatCard from '@/components/common/StatCard';

interface AnalyticsPageProps {
  setNavigation: (state: NavigationState) => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { users } = useUserStore();
  const { departments, accreditationPrograms } = useAppStore();

  const [programFilter, setProgramFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredProjects = useMemo(() => {
    return projects.filter(p => programFilter === 'all' || p.programId === programFilter);
  }, [projects, programFilter]);
  
  const allChecklistItems = useMemo(() => {
    return filteredProjects.flatMap(p => p.checklist);
  }, [filteredProjects]);

  const kpis = useMemo(() => {
    const overdueTasks = allChecklistItems.filter(item => item.dueDate && new Date(item.dueDate) < new Date()).length;
    const activeProjects = filteredProjects.filter(p => p.status === 'In Progress').length;
    return { overdueTasks, activeProjects };
  }, [allChecklistItems, filteredProjects]);
  

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <ChartBarSquareIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('analyticsHub')}</h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('analyticsHubDescription')}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="border border-brand-border dark:border-dark-brand-border rounded-lg py-2 px-3 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface dark:bg-dark-brand-surface text-sm">
                <option value="all">{t('allPrograms')}</option>
                {accreditationPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title={t('overallComplianceRate')} value={87} total={allChecklistItems.length} completed={allChecklistItems.filter(i => i.status === 'Compliant').length} description={t('tasksCompliant')} color="#4f46e5" />
          <KpiCard title={t('capaResolutionRate')} value={62} total={50} completed={31} description={t('resolved')} color="#f97316" />
          <StatCard title={t('totalActiveProjects')} value={kpis.activeProjects} />
          <StatCard title={t('totalOverdueTasks')} value={kpis.overdueTasks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceOverTimeChart projects={filteredProjects} />
        <CapaRootCauseChart projects={filteredProjects} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProblematicStandardsChart checklistItems={allChecklistItems} />
        <TaskStatusDistributionChart checklistItems={allChecklistItems} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentalPerformanceChart projects={filteredProjects} departments={departments} users={users} setNavigation={setNavigation} />
        <TaskDistributionByUserChart checklistItems={allChecklistItems} users={users} setNavigation={setNavigation} />
      </div>
    </div>
  );
};

export default AnalyticsPage;

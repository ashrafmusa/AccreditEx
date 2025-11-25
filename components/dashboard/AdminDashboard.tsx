import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { NavigationState, ProjectStatus, CAPAReport, ComplianceStatus } from '@/types';
import { CheckCircleIcon, ExclamationTriangleIcon, FolderIcon, PlayCircleIcon, CalendarDaysIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';
import StatCard from '@/components/common/StatCard';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import DashboardHeader from './DashboardHeader';
// FIX: Corrected import path for CapaListItem
import CapaListItem from './CapaListItem';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

const CustomTooltip: React.FC<TooltipProps<ValueType, NameType> & { t: (key: any) => string }> = ({ active, payload, label, t }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{label}</p>
          <p className="text-sm text-brand-primary dark:text-brand-primary-400">{`${t('complianceRate')}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

const PieCustomTooltip: React.FC<TooltipProps<ValueType, NameType> & { t: (key: any) => string }> = ({ active, payload, t }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
          <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">{payload[0].name}</p>
          <p className="text-sm text-brand-primary dark:text-brand-primary-400">{`${t('projects')}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

const AdminDashboard: React.FC<DashboardPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const projects = useProjectStore(state => state.projects);
  const { users } = useUserStore();
  const { documents } = useAppStore();

  const dashboardData = useMemo(() => {
    const totalProjects = projects.length;
    const inProgressCount = projects.filter(p => p.status === ProjectStatus.InProgress).length;
    const completedCount = projects.filter(p => p.status === ProjectStatus.Completed).length;
    
    let totalScore = 0;
    let totalApplicableTasks = 0;
    projects.forEach(p => {
        const applicableItems = p.checklist.filter(c => c.status !== ComplianceStatus.NotApplicable);
        totalApplicableTasks += applicableItems.length;
        applicableItems.forEach(item => {
            if (item.status === ComplianceStatus.Compliant) totalScore += 1;
            if (item.status === ComplianceStatus.PartiallyCompliant) totalScore += 0.5;
        });
    });
    const overallCompliance = totalApplicableTasks > 0 ? ((totalScore / totalApplicableTasks) * 100).toFixed(1) : '0.0';

    const openCapaReports = projects.flatMap(p => p.capaReports.filter(c => c.status === 'Open'));
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingProjectDeadlines = projects.filter(p => p.endDate && new Date(p.endDate) <= thirtyDaysFromNow && new Date(p.endDate) > new Date());
    const upcomingDocReviews = documents.filter(d => d.reviewDate && new Date(d.reviewDate) <= thirtyDaysFromNow && new Date(d.reviewDate) > new Date());
    const upcomingDeadlinesCount = upcomingProjectDeadlines.length + upcomingDocReviews.length;

    const complianceChartData = projects.map(project => ({
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        compliance: parseFloat(project.progress.toFixed(1)),
        id: project.id
    }));

    const statusCounts = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {} as Record<ProjectStatus, number>);
    const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({ name: t((name.charAt(0).toLowerCase() + name.slice(1).replace(/\s/g, '')) as any) || name, value }));

    return {
        totalProjects, inProgressCount, completedCount,
        overallCompliance: `${overallCompliance}%`,
        openCapaCount: openCapaReports.length,
        upcomingDeadlinesCount, complianceChartData, pieChartData,
        recentOpenCapa: openCapaReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    };
  }, [projects, documents, t]);

  const PIE_COLORS = [ '#4f46e5', '#22c55e', '#6b7280', '#f59e0b', '#3b82f6'];
  const tickStyle = { fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '12px' };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const projectId = data.activePayload[0].payload.id;
      setNavigation({ view: 'projectDetail', projectId });
    }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader setNavigation={setNavigation} title={t('welcomeBack')} greeting={t('dashboardGreeting')} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title={t('totalProjects')} value={dashboardData.totalProjects} icon={FolderIcon} color="from-blue-500 to-blue-700 bg-gradient-to-br"/>
        <StatCard title={t('inProgress')} value={dashboardData.inProgressCount} icon={PlayCircleIcon} color="from-orange-400 to-orange-600 bg-gradient-to-br"/>
        <StatCard title={t('completed')} value={dashboardData.completedCount} icon={CheckCircleIcon} color="from-emerald-500 to-emerald-700 bg-gradient-to-br"/>
        <StatCard title={t('overallCompliance')} value={dashboardData.overallCompliance} icon={CheckCircleIcon} color="from-indigo-500 to-indigo-700 bg-gradient-to-br" isLiveLinkable />
        <StatCard title={t('openCapaReports')} value={dashboardData.openCapaCount} icon={ExclamationTriangleIcon} color="from-red-500 to-red-700 bg-gradient-to-br" isLiveLinkable />
        <StatCard title={t('upcomingDeadlines')} value={dashboardData.upcomingDeadlinesCount} icon={CalendarDaysIcon} color="from-amber-400 to-amber-600 bg-gradient-to-br" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('projectComplianceRate')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.complianceChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick}>
                    <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={1}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(128,128,128,0.1)' : 'rgba(128,128,128,0.2)'} />
                    <XAxis dataKey="name" tick={tickStyle} interval={0} angle={-45} textAnchor="end" height={80} />
                    <YAxis unit="%" tick={tickStyle} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{fill: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.4)'}} />
                    <Bar dataKey="compliance" fill="url(#barGradient)" name={t('complianceRate')} barSize={30} radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('projectStatusDistribution')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={dashboardData.pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5}>
                        {dashboardData.pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip t={t} />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={theme === 'dark' ? '#FFF' : '#000'} fontSize="24" fontWeight="bold">
                      {dashboardData.totalProjects}
                    </text>
                     <text x="50%" y="50%" dy={20} textAnchor="middle" fill={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize="12">
                      {t('projects')}
                    </text>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
      
       <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('openCapaReports')}</h3>
            <div className="space-y-3">
                {dashboardData.recentOpenCapa.length > 0 ? dashboardData.recentOpenCapa.map((capa: CAPAReport) => {
                    const project = projects.find(p => p.id === capa.sourceProjectId);
                    const assignee = users.find(u => u.id === capa.assignedTo);
                    return (
                        <CapaListItem
                            key={capa.id}
                            capa={capa}
                            project={project}
                            assignee={assignee}
                        />
                    )
                }) : (
                     <p className="text-center text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary py-6">{t('noOpenCapa')}</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
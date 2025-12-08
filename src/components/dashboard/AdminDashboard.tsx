import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { NavigationState, ProjectStatus, CAPAReport, ComplianceStatus } from '@/types';
import { CheckCircleIcon, ExclamationTriangleIcon, FolderIcon, PlayCircleIcon, CalendarDaysIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/components/common/ThemeProvider';
import StatCard from '@/components/common/StatCard';
import StatCardSkeleton from '@/components/common/StatCardSkeleton';
import ChartSkeleton from '@/components/common/ChartSkeleton';
import EmptyStatePlaceholder from '@/components/common/EmptyStatePlaceholder';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';
import { exportDashboardMetricsToCSV } from '@/utils/exportUtils';
import DashboardHeader from './DashboardHeader';
// FIX: Corrected import path for CapaListItem
import CapaListItem from './CapaListItem';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

// Default data structure for error fallback
const getDefaultDashboardData = () => ({
  totalProjects: 0,
  inProgressCount: 0,
  completedCount: 0,
  overallCompliance: '0.0%',
  openCapaCount: 0,
  upcomingDeadlinesCount: 0,
  complianceChartData: [],
  pieChartData: [],
  recentOpenCapa: [],
  // New metrics
  auditComplianceRate: '0%',
  riskExposure: 0,
  documentsReviewOverdue: 0,
  mitigatedRisks: 0,
});

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

const PIE_COLORS = ['#4f46e5', '#22c55e', '#6b7280', '#f59e0b', '#3b82f6'];

const AdminDashboard: React.FC<DashboardPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const projects = useProjectStore(state => state.projects);
  const { users } = useUserStore();
  const { documents, risks, auditPlans, audits } = useAppStore();
  
  // Loading state - simulate loading for first 1.5 seconds
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const dashboardData = useMemo(() => {
    try {
      // Validate inputs
      if (!projects || !Array.isArray(projects)) {
        console.warn('AdminDashboard: Projects data is invalid');
        return getDefaultDashboardData();
      }

      const totalProjects = projects.length;
      const inProgressCount = projects.filter(p => p?.status === ProjectStatus.InProgress).length;
      const completedCount = projects.filter(p => p?.status === ProjectStatus.Completed).length;
      
      let totalScore = 0;
      let totalApplicableTasks = 0;
      projects.forEach(p => {
        try {
          if (!p || !Array.isArray(p.checklist)) return;
          const applicableItems = p.checklist.filter(c => c?.status !== ComplianceStatus.NotApplicable);
          totalApplicableTasks += applicableItems.length;
          applicableItems.forEach(item => {
            if (!item) return;
            if (item.status === ComplianceStatus.Compliant) totalScore += 1;
            if (item.status === ComplianceStatus.PartiallyCompliant) totalScore += 0.5;
          });
        } catch (error) {
          console.warn('AdminDashboard: Error processing project checklist', error);
        }
      });
      const overallCompliance = totalApplicableTasks > 0 ? ((totalScore / totalApplicableTasks) * 100).toFixed(1) : '0.0';

      const openCapaReports = projects.flatMap(p => p?.capaReports || []).filter(c => c?.status === 'Open');
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const now = new Date();
      
      const upcomingProjectDeadlines = projects.filter(p => {
        try {
          return p?.endDate && new Date(p.endDate) <= thirtyDaysFromNow && new Date(p.endDate) > now;
        } catch (error) {
          console.warn('AdminDashboard: Error parsing project date', error);
          return false;
        }
      });
      
      const upcomingDocReviews = documents.filter(d => {
        try {
          return d?.reviewDate && new Date(d.reviewDate) <= thirtyDaysFromNow && new Date(d.reviewDate) > now;
        } catch (error) {
          console.warn('AdminDashboard: Error parsing document date', error);
          return false;
        }
      });
      
      const upcomingDeadlinesCount = (upcomingProjectDeadlines?.length || 0) + (upcomingDocReviews?.length || 0);

      const complianceChartData = projects
        .filter(p => p && p.name)
        .map(project => ({
          name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
          compliance: Math.min(100, Math.max(0, parseFloat(project.progress?.toFixed(1) || '0'))),
          id: project.id
        }));

      const statusCounts = projects.reduce((acc, p) => {
        if (!p?.status) return acc;
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<ProjectStatus, number>);
      
      const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({ 
        name: t((name.charAt(0).toLowerCase() + name.slice(1).replace(/\s/g, '')) as any) || name, 
        value 
      }));

      // NEW METRICS: Audit Compliance, Risk Exposure, Document Aging
      let auditMetrics = { complianceRate: 0, completedAudits: 0, scheduledAudits: 0 };
      try {
        if (auditPlans && audits) {
          const now = new Date();
          const completedAudits = audits?.filter(a => a && a.dateConducted)?.length || 0;
          const scheduledAudits = auditPlans?.filter(ap => {
            try {
              // Assuming scheduled date is needed - using createdAt as reference
              return ap && ap.id;
            } catch (e) {
              return false;
            }
          })?.length || 0;
          
          auditMetrics = {
            complianceRate: scheduledAudits > 0 ? Math.round((completedAudits / scheduledAudits) * 100) : 0,
            completedAudits,
            scheduledAudits
          };
        }
      } catch (error) {
        console.warn('AdminDashboard: Error calculating audit metrics', error);
      }

      // Risk Exposure Calculation
      let riskMetrics = { totalRisks: 0, highRisks: 0, mitigatedRisks: 0, riskExposure: 0 };
      try {
        if (risks && Array.isArray(risks)) {
          const totalRisks = risks.length;
          const highRisks = risks.filter(r => r && r.impact >= 4).length;
          const mitigatedRisks = risks.filter(r => r && (r.status === 'Mitigated' || r.status === 'Closed')).length;
          const riskExposure = totalRisks > 0 ? Math.round(((totalRisks - mitigatedRisks) / totalRisks) * 100) : 0;
          
          riskMetrics = { totalRisks, highRisks, mitigatedRisks, riskExposure };
        }
      } catch (error) {
        console.warn('AdminDashboard: Error calculating risk metrics', error);
      }

      // Document Review Aging
      let docMetrics = { totalDocuments: 0, reviewOverdue: 0, controlledDocs: 0 };
      try {
        if (documents && Array.isArray(documents)) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const totalDocuments = documents.length;
          const reviewOverdue = documents.filter(d => {
            try {
              return d && d.reviewDate && new Date(d.reviewDate) < thirtyDaysAgo;
            } catch (e) {
              return false;
            }
          }).length;
          const controlledDocs = documents.filter(d => d && d.isControlled).length;
          
          docMetrics = { totalDocuments, reviewOverdue, controlledDocs };
        }
      } catch (error) {
        console.warn('AdminDashboard: Error calculating document metrics', error);
      }

      return {
        totalProjects, inProgressCount, completedCount,
        overallCompliance: `${overallCompliance}%`,
        openCapaCount: openCapaReports.length,
        upcomingDeadlinesCount, complianceChartData, pieChartData,
        recentOpenCapa: openCapaReports.sort((a, b) => {
          const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 5),
        // New metrics
        auditComplianceRate: `${auditMetrics.complianceRate}%`,
        riskExposure: riskMetrics.riskExposure,
        documentsReviewOverdue: docMetrics.reviewOverdue,
        mitigatedRisks: riskMetrics.mitigatedRisks,

      };
    } catch (error) {
      console.error('AdminDashboard calculation error:', error);
      return getDefaultDashboardData();
    }
  }, [projects, documents, risks, auditPlans, audits, t]);
  const tickStyle = { fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '12px' };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const projectId = data.activePayload[0].payload.id;
      setNavigation({ view: 'projectDetail', projectId });
    }
  };

  const handleExportMetrics = () => {
    try {
      const metricsData = {
        'Total Projects': dashboardData.totalProjects,
        'In Progress': dashboardData.inProgressCount,
        'Completed': dashboardData.completedCount,
        'Overall Compliance': dashboardData.overallCompliance,
        'Open CAPA Reports': dashboardData.openCapaCount,
        'Audit Compliance Rate': dashboardData.auditComplianceRate,
        'Risk Exposure (%)': `${dashboardData.riskExposure}%`,
        'Documents Review Overdue': dashboardData.documentsReviewOverdue,
        'Risks Mitigated': dashboardData.mitigatedRisks
      };
      exportDashboardMetricsToCSV(metricsData, 'Admin Dashboard');
    } catch (error) {
      console.error('Error exporting metrics:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <DashboardHeader setNavigation={setNavigation} title={t('welcomeBack')} greeting={t('dashboardGreeting')} onExport={handleExportMetrics} />
      
      {/* Loading State for Stats Cards */}
      {isLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCardSkeleton count={6} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardSkeleton count={4} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton height="400px" />
            <ChartSkeleton height="400px" />
          </div>
          <div>
            <ChartSkeleton height="300px" />
          </div>
        </>
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title={t('totalProjects')} 
          value={dashboardData.totalProjects} 
          icon={FolderIcon} 
          color="from-blue-500 to-blue-700 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'projects' })}
        />
        <StatCard 
          title={t('inProgress')} 
          value={dashboardData.inProgressCount} 
          icon={PlayCircleIcon} 
          color="from-orange-400 to-orange-600 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'projects', filter: 'inProgress' })}
        />
        <StatCard 
          title={t('completed')} 
          value={dashboardData.completedCount} 
          icon={CheckCircleIcon} 
          color="from-emerald-500 to-emerald-700 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'projects', filter: 'completed' })}
        />
        <StatCard 
          title={t('overallCompliance')} 
          value={dashboardData.overallCompliance} 
          icon={CheckCircleIcon} 
          color="from-indigo-500 to-indigo-700 bg-gradient-to-br" 
          isLiveLinkable 
        />
        <StatCard 
          title={t('openCapaReports')} 
          value={dashboardData.openCapaCount} 
          icon={ExclamationTriangleIcon} 
          color="from-red-500 to-red-700 bg-gradient-to-br" 
          isLiveLinkable 
          onClick={() => setNavigation({ view: 'projects', filter: 'openCapa' })}
        />
        <StatCard 
          title={t('upcomingDeadlines')} 
          value={dashboardData.upcomingDeadlinesCount} 
          icon={CalendarDaysIcon} 
          color="from-amber-400 to-amber-600 bg-gradient-to-br" 
          onClick={() => setNavigation({ view: 'calendar' })}
        />
      </div>

      {/* New Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('auditScheduleCompliance')} 
          value={dashboardData.auditComplianceRate} 
          icon={CheckCircleIcon} 
          color="from-purple-500 to-purple-700 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'auditHub' })}
        />
        <StatCard 
          title={t('riskExposure')} 
          value={`${dashboardData.riskExposure}%`} 
          icon={ExclamationTriangleIcon} 
          color="from-rose-500 to-rose-700 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'riskHub' })}
        />
        <StatCard 
          title={t('documentsReviewOverdue')} 
          value={dashboardData.documentsReviewOverdue} 
          icon={CalendarDaysIcon} 
          color="from-yellow-500 to-yellow-700 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'documentControl', filter: 'overdue' })}
        />
        <StatCard 
          title={t('mitigatedRisks')} 
          value={dashboardData.mitigatedRisks} 
          icon={CheckCircleIcon} 
          color="from-teal-500 to-teal-700 bg-gradient-to-br"
          onClick={() => setNavigation({ view: 'riskHub', filter: 'mitigated' })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('projectComplianceRate')}</h3>
            {dashboardData.complianceChartData.length > 0 ? (
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
            ) : (
              <EmptyStatePlaceholder 
                title="No Projects" 
                message="Create your first project to see compliance metrics"
                actionLabel="Create Project"
                onAction={() => setNavigation({ view: 'createProject' })}
                secondary
                compact
              />
            )}
        </div>

        <div className="lg:col-span-2 bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('projectStatusDistribution')}</h3>
            {dashboardData.pieChartData.length > 0 ? (
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
            ) : (
              <EmptyStatePlaceholder 
                title="No Projects" 
                message="All projects appear here once created"
                secondary
                compact
              />
            )}
        </div>
      </div>
      
       <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">{t('openCapaReports')}</h3>
            {dashboardData.recentOpenCapa.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentOpenCapa.map((capa: CAPAReport) => {
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
                })}
              </div>
            ) : (
              <EmptyStatePlaceholder 
                title="All Clear!" 
                message="No open CAPA reports. Great work maintaining compliance!"
                secondary
                compact
              />
            )}
        </div>
      </>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
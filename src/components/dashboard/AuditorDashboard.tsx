import React, { useMemo, useState, useEffect } from 'react';
import { NavigationState, AuditPlan, Audit, ComplianceStatus, LocalizedString } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import StatCard from '@/components/common/StatCard';
import StatCardSkeleton from '@/components/common/StatCardSkeleton';
import ChartSkeleton from '@/components/common/ChartSkeleton';
import EmptyStatePlaceholder from '@/components/common/EmptyStatePlaceholder';
import { useAppStore } from '@/stores/useAppStore';
import { useUserStore } from '@/stores/useUserStore';
import DashboardHeader from './DashboardHeader';
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon, CheckCircleIcon, ChartBarIcon, DocumentTextIcon, UsersIcon } from '@/components/icons';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface DashboardPageProps {
  setNavigation: (state: NavigationState) => void;
}

const getDefaultAuditStats = () => ({
  totalScheduledAudits: 0,
  completedAudits: 0,
  nonConformities: 0,
  auditFindingsRate: '0.0%',
  departmentsAudited: 0,
  complianceScore: '0.0%'
});

const AuditorDashboard: React.FC<DashboardPageProps> = ({ setNavigation }) => {
    const { t } = useTranslation();
    const { currentUser } = useUserStore();
    const { auditPlans, audits, departments } = useAppStore();
    
    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }, []);

    // Get audits assigned to current auditor
    const myAudits = useMemo(() => {
        try {
            if (!currentUser) return [];
            return audits.filter(a => a?.auditorId === currentUser.id);
        } catch (error) {
            console.warn('AuditorDashboard: Error filtering audits', error);
            return [];
        }
    }, [audits, currentUser]);

    // Get audit plans assigned to current auditor
    const myAuditPlans = useMemo(() => {
        try {
            if (!currentUser) return [];
            return auditPlans.filter(p => p?.assignedAuditorId === currentUser.id);
        } catch (error) {
            console.warn('AuditorDashboard: Error filtering audit plans', error);
            return [];
        }
    }, [auditPlans, currentUser]);

    const auditStats = useMemo(() => {
        try {
            const totalScheduled = myAuditPlans.length;
            const completed = myAudits.length;
            
            // Count non-conformities from audit results
            let nonConformityCount = 0;
            let totalFindings = 0;
            const auditedDepartmentIds = new Set<string>();
            let totalComplianceScore = 0;
            let scoredAudits = 0;

            myAudits.forEach(audit => {
                try {
                    if (!audit || !Array.isArray(audit.results)) return;

                    audit.results.forEach(result => {
                        if (!result) return;
                        totalFindings += 1;
                        
                        // Count non-compliant findings
                        if (!result.isCompliant) {
                            nonConformityCount += 1;
                        } else {
                            totalComplianceScore += 1;
                        }
                    });
                    scoredAudits += 1;
                } catch (error) {
                    console.warn('AuditorDashboard: Error processing audit', error);
                }
            });

            // Calculate audit findings rate (non-conformities / total findings)
            const findingsRate = totalFindings > 0 ? ((nonConformityCount / totalFindings) * 100).toFixed(1) : '0.0';
            
            // Calculate overall compliance score
            const totalItems = myAudits.flatMap(a => a?.results || []).length;
            const complianceScore = totalItems > 0 ? ((totalComplianceScore / totalItems) * 100).toFixed(1) : '0.0';

            // Use department count from departments list
            const departmentsCount = departments.length;

            return {
                totalScheduledAudits: totalScheduled,
                completedAudits: completed,
                nonConformities: nonConformityCount,
                auditFindingsRate: `${findingsRate}%`,
                departmentsAudited: departmentsCount,
                complianceScore: `${complianceScore}%`
            };
        } catch (error) {
            console.error('AuditorDashboard stats calculation error:', error);
            return getDefaultAuditStats();
        }
    }, [myAudits, myAuditPlans, departments]);

    // Get pending audits (scheduled but not yet completed)
    const pendingAudits = useMemo(() => {
        try {
            const completedPlanIds = new Set(myAudits.map(a => a?.planId));
            return myAuditPlans.filter(p => p && !completedPlanIds.has(p.id));
        } catch (error) {
            console.warn('AuditorDashboard: Error getting pending audits', error);
            return [];
        }
    }, [myAuditPlans, myAudits]);

    // Get non-conformities by department
    const departmentNonConformities = useMemo(() => {
        try {
            const deptMap = new Map<string, { name: string | LocalizedString; count: number }>();

            myAudits.forEach(audit => {
                try {
                    if (!audit?.results) return;

                    // Count non-conformities (results with isCompliant=false)
                    const nonConformities = audit.results.filter(r => r && !r.isCompliant).length;

                    if (nonConformities > 0) {
                        // Track non-conformities by department (simple aggregation)
                        departments.forEach(dept => {
                            if (!dept) return;
                            const existing = deptMap.get(dept.id) || {
                                name: dept.name || 'Unknown Department',
                                count: 0
                            };
                            deptMap.set(dept.id, {
                                ...existing,
                                count: existing.count + nonConformities
                            });
                        });
                    }
                } catch (error) {
                    console.warn('AuditorDashboard: Error processing department data', error);
                }
            });

            return Array.from(deptMap.values()).sort((a, b) => b.count - a.count);
        } catch (error) {
            console.warn('AuditorDashboard: Error calculating department non-conformities', error);
            return [];
        }
    }, [myAudits, departments]);

    return (
        <ErrorBoundary>
            <div className="space-y-8">
                <DashboardHeader setNavigation={setNavigation} title={t('welcomeBack')} greeting={t('auditDashboard')} />
                
                {isLoading ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCardSkeleton count={6} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <ChartSkeleton height="350px" lines={5} />
                      <ChartSkeleton height="350px" lines={5} />
                    </div>
                  </div>
                ) : (
                <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      title={t('scheduledAudits')} 
                      value={auditStats.totalScheduledAudits} 
                      icon={ClipboardDocumentCheckIcon} 
                      color="from-blue-500 to-blue-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'auditHub' })}
                    />
                    <StatCard 
                      title={t('completedAudits')} 
                      value={auditStats.completedAudits} 
                      icon={CheckCircleIcon} 
                      color="from-green-500 to-green-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'auditHub' })}
                    />
                    <StatCard 
                      title={t('nonConformities')} 
                      value={auditStats.nonConformities} 
                      icon={ExclamationTriangleIcon} 
                      color="from-red-500 to-red-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'qualityInsights' })}
                    />
                    <StatCard 
                      title={t('findingsRate')} 
                      value={auditStats.auditFindingsRate} 
                      icon={ChartBarIcon} 
                      color="from-orange-500 to-orange-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'auditHub' })}
                    />
                    <StatCard 
                      title={t('departmentsAudited')} 
                      value={auditStats.departmentsAudited} 
                      icon={UsersIcon} 
                      color="from-rose-500 to-pink-600 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'departments' })}
                    />
                    <StatCard 
                      title={t('overallCompliance')} 
                      value={auditStats.complianceScore} 
                      icon={DocumentTextIcon} 
                      color="from-cyan-500 to-cyan-700 bg-gradient-to-br"
                      onClick={() => setNavigation({ view: 'analytics' })}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Audits */}
                    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                            {t('pendingAudits')} ({pendingAudits.length})
                        </h3>
                        {pendingAudits.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                                {pendingAudits.map(plan => {
                                    return (
                                        <div
                                            key={plan.id}
                                            className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-dark-brand-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                                                        {plan.name}
                                                    </p>
                                                    <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                                                        {t('itemsToAudit')}: {plan.itemCount}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                          </div>
                        ) : (
                          <EmptyStatePlaceholder 
                            icon={CheckCircleIcon}
                            title={t('allAuditsComplete')} 
                            message={t('allAuditsCompleteMessage') || 'No pending audits. All scheduled audits have been completed.'}
                            secondary
                            compact
                          />
                        )}
                    </div>

                    {/* Non-Conformities by Department */}
                    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-lg border border-brand-border dark:border-dark-brand-border">
                        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
                            {t('departmentNonConformities')}
                        </h3>
                        {departmentNonConformities.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                                {departmentNonConformities.map((dept, idx) => {
                                    const deptName = typeof dept.name === 'string' ? dept.name : dept.name.en;
                                    return (
                                        <div key={`${deptName}-${idx}`} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-dark-brand-border">
                                            <div className="flex-1">
                                                <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                                                    {deptName}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                                                    {dept.count}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                          </div>
                        ) : (
                          <EmptyStatePlaceholder 
                            icon={CheckCircleIcon}
                            title={t('allCompliant')} 
                            message={t('allCompliantMessage') || 'No non-conformities found. All departments are in compliance.'}
                            secondary
                            compact
                          />
                        )}
                    </div>
                </div>
                </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default AuditorDashboard;

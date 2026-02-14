/**
 * Analytics React Hooks
 * Hooks to access analytics data and control reporting
 */

import { useEffect, useState, useCallback } from 'react';
import { analyticsService } from '../services/hisIntegration/AnalyticsService';
import { reportingService } from '../services/hisIntegration/ReportingService';

// ============= useAnalytics =============
export interface AnalyticsData {
  performance: any;
  quality: any;
  health: any;
  isLoading: boolean;
  error: string | null;
}

export function useAnalytics(configId: string): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>({
    performance: null,
    quality: null,
    health: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const performance = analyticsService.getPerformanceAnalysis(configId);
      const quality = analyticsService.getDataQualityMetrics(configId);
      const health = analyticsService.calculateHealthScore(configId);

      setData({
        performance,
        quality,
        health,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics',
      }));
    }
  }, [configId]);

  return data;
}

// ============= useTrends =============
export interface TrendData {
  data: any[];
  period: number; // days
  isLoading: boolean;
  error: string | null;
  setPeriod: (days: number) => void;
}

export function useTrends(configId: string, initialPeriod = 30): TrendData {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState<TrendData>({
    data: [],
    period,
    isLoading: true,
    error: null,
    setPeriod,
  });

  useEffect(() => {
    try {
      const trendData = analyticsService.getTrendData(configId, period);

      setData({
        data: trendData,
        period,
        isLoading: false,
        error: null,
        setPeriod,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load trends',
      }));
    }
  }, [configId, period]);

  const updatePeriod = useCallback((newPeriod: number) => {
    setPeriod(newPeriod);
  }, []);

  return {
    ...data,
    setPeriod: updatePeriod,
  };
}

// ============= useInsights =============
export interface Insight {
  type: string;
  title: string;
  message: string;
  recommendation: string;
}

export interface InsightsData {
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useInsights(configId: string): InsightsData {
  const [data, setData] = useState<InsightsData>({
    insights: [],
    isLoading: true,
    error: null,
    refresh: () => { },
  });

  const loadInsights = useCallback(() => {
    try {
      const insights = analyticsService.getInsights(configId) as Insight[];

      setData({
        insights,
        isLoading: false,
        error: null,
        refresh: loadInsights,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load insights',
      }));
    }
  }, [configId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return data;
}

// ============= useComparison =============
export interface ComparisonData {
  configs: string[];
  metrics: any;
  isLoading: boolean;
  error: string | null;
  addConfig: (configId: string) => void;
  removeConfig: (configId: string) => void;
}

export function useComparison(initialConfigs: string[] = []): ComparisonData {
  const [configs, setConfigs] = useState(initialConfigs);
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (configs.length === 0) {
      setMetrics({});
      return;
    }

    try {
      setIsLoading(true);
      const comparison = (analyticsService as any).compareConfigurations(configs);

      setMetrics(comparison);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare configurations');
    } finally {
      setIsLoading(false);
    }
  }, [configs]);

  const addConfig = useCallback((configId: string) => {
    setConfigs((prev) => (prev.includes(configId) ? prev : [...prev, configId]));
  }, []);

  const removeConfig = useCallback((configId: string) => {
    setConfigs((prev) => prev.filter((id) => id !== configId));
  }, []);

  return {
    configs,
    metrics,
    isLoading,
    error,
    addConfig,
    removeConfig,
  };
}

// ============= useReport =============
export interface ReportData {
  reports: any[];
  templates: any[];
  schedules: any[];
  isLoading: boolean;
  error: string | null;
  generateReport: (name: string, configIds: string[], from: Date, to: Date) => Promise<any>;
  downloadReport: (reportId: string) => Blob | null;
  emailReport: (reportId: string, recipients: string[]) => Promise<boolean>;
}

export function useReport(): ReportData {
  const [reports, setReports] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setReports(reportingService.getReports());
      setTemplates(reportingService.getTemplates());
      setSchedules(reportingService.getSchedules());
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      setIsLoading(false);
    }
  }, []);

  const generateReport = useCallback(
    async (name: string, configIds: string[], from: Date, to: Date) => {
      try {
        const report = reportingService.generateReport(name, configIds, from, to);
        setReports((prev) => [...prev, report]);
        return report;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to generate report');
      }
    },
    []
  );

  const downloadReport = useCallback((reportId: string): Blob | null => {
    return reportingService.downloadReport(reportId);
  }, []);

  const emailReport = useCallback(async (reportId: string, recipients: string[]) => {
    return reportingService.emailReport(reportId, recipients);
  }, []);

  return {
    reports,
    templates,
    schedules,
    isLoading,
    error,
    generateReport,
    downloadReport,
    emailReport,
  };
}

// ============= useSyncStatistics =============
export interface SyncStatistics {
  totalSyncs: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  successRate: number;
  averageDuration: number;
  byStatus: Record<string, number>;
  isLoading: boolean;
}

export function useSyncStatistics(configId: string): SyncStatistics {
  const [stats, setStats] = useState<SyncStatistics>({
    totalSyncs: 0,
    successCount: 0,
    failureCount: 0,
    pendingCount: 0,
    successRate: 0,
    averageDuration: 0,
    byStatus: {},
    isLoading: true,
  });

  useEffect(() => {
    try {
      const data = analyticsService.getSyncStatistics(configId);

      setStats({
        ...(data as any),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load sync statistics:', error);
    }
  }, [configId]);

  return stats;
}

// ============= useHealthScore =============
export interface HealthScore {
  overall: number;
  syncHealth: number;
  dataQuality: number;
  systemStability: number;
  performanceTrend: string;
  isLoading: boolean;
}

export function useHealthScore(configId: string): HealthScore {
  const [health, setHealth] = useState<HealthScore>({
    overall: 0,
    syncHealth: 0,
    dataQuality: 0,
    systemStability: 0,
    performanceTrend: 'stable',
    isLoading: true,
  });

  useEffect(() => {
    try {
      const data = analyticsService.calculateHealthScore(configId);

      setHealth({
        ...data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load health score:', error);
    }
  }, [configId]);

  return health;
}

// ============= useDataQuality =============
export interface DataQualityMetrics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  validationErrorRate: number;
  dataIntegrity: number;
  duplicateCount: number;
  missingFieldErrors: Record<string, number>;
  isLoading: boolean;
}

export function useDataQuality(configId: string): DataQualityMetrics {
  const [quality, setQuality] = useState<DataQualityMetrics>({
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    validationErrorRate: 0,
    dataIntegrity: 0,
    duplicateCount: 0,
    missingFieldErrors: {},
    isLoading: true,
  });

  useEffect(() => {
    try {
      const data = analyticsService.getDataQualityMetrics(configId);

      setQuality({
        ...(data as any),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load data quality metrics:', error);
    }
  }, [configId]);

  return quality;
}

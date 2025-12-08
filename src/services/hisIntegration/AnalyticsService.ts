/**
 * Analytics Service
 * Provides comprehensive analytics for HIS sync performance and data quality
 */

import { useHISIntegrationStore } from '../../stores/useHISIntegrationStore';

interface SyncMetric {
  timestamp: Date;
  configId: string;
  duration: number; // milliseconds
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  conflictsDetected: number;
  conflictsResolved: number;
  status: 'success' | 'failure' | 'partial';
}

interface PerformanceAnalysis {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  successRate: number; // percentage
  averageDuration: number; // milliseconds
  averageRecordsPerSync: number;
  peakSyncTime: Date;
  lowestPerformanceTime: Date;
  totalRecordsSynced: number;
  totalConflicts: number;
  averageConflictsPerSync: number;
}

interface DataQualityMetrics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  missingFields: Record<string, number>;
  validationErrorRate: number; // percentage
  dataIntegrity: number; // percentage
  lastValidationTime: Date;
}

interface TrendData {
  timestamp: Date;
  syncCount: number;
  successRate: number;
  averageDuration: number;
  conflictRate: number;
}

interface HealthScore {
  overall: number; // 0-100
  syncHealth: number;
  dataQuality: number;
  systemStability: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
}

export class AnalyticsService {
  private metrics: SyncMetric[] = [];
  private maxMetricsSize: number = 10000;

  constructor() {
    this.loadMetrics();
  }

  /**
   * Record a sync metric
   */
  recordSyncMetric(metric: Omit<SyncMetric, 'timestamp'>): SyncMetric {
    const syncMetric: SyncMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(syncMetric);
    this.maintainMetrics();
    this.saveMetrics();

    return syncMetric;
  }

  /**
   * Get performance analysis
   */
  getPerformanceAnalysis(configId?: string, days: number = 30): PerformanceAnalysis {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let filtered = this.metrics.filter((m) => m.timestamp >= cutoffDate);

    if (configId) {
      filtered = filtered.filter((m) => m.configId === configId);
    }

    if (filtered.length === 0) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        partialSyncs: 0,
        successRate: 0,
        averageDuration: 0,
        averageRecordsPerSync: 0,
        peakSyncTime: new Date(),
        lowestPerformanceTime: new Date(),
        totalRecordsSynced: 0,
        totalConflicts: 0,
        averageConflictsPerSync: 0,
      };
    }

    const successful = filtered.filter((m) => m.status === 'success').length;
    const failed = filtered.filter((m) => m.status === 'failure').length;
    const partial = filtered.filter((m) => m.status === 'partial').length;

    const totalDuration = filtered.reduce((sum, m) => sum + m.duration, 0);
    const totalRecords = filtered.reduce((sum, m) => sum + m.recordsProcessed, 0);
    const totalConflicts = filtered.reduce((sum, m) => sum + m.conflictsDetected, 0);

    // Find slowest and fastest syncs
    const slowest = filtered.reduce((prev, current) =>
      prev.duration > current.duration ? prev : current
    );
    const fastest = filtered.reduce((prev, current) =>
      prev.duration < current.duration ? prev : current
    );

    return {
      totalSyncs: filtered.length,
      successfulSyncs: successful,
      failedSyncs: failed,
      partialSyncs: partial,
      successRate: Math.round((successful / filtered.length) * 100),
      averageDuration: Math.round(totalDuration / filtered.length),
      averageRecordsPerSync: Math.round(totalRecords / filtered.length),
      peakSyncTime: slowest.timestamp,
      lowestPerformanceTime: fastest.timestamp,
      totalRecordsSynced: totalRecords,
      totalConflicts: totalConflicts,
      averageConflictsPerSync: Math.round(totalConflicts / filtered.length),
    };
  }

  /**
   * Get data quality metrics
   */
  getDataQualityMetrics(configId?: string): DataQualityMetrics {
    const store = useHISIntegrationStore();
    const configs = configId
      ? store.configurations.filter((c) => c.id === configId)
      : store.configurations;

    let totalRecords = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let duplicateRecords = 0;
    const missingFields: Record<string, number> = {};

    // Aggregate from logs
    for (const config of configs) {
      const logs = store.getLogs(config.id);

      for (const log of logs) {
        if (log.status === 'success') {
          totalRecords += log.recordCount || 0;
          validRecords += log.recordCount || 0;
        } else if (log.status === 'error') {
          invalidRecords += log.recordCount || 0;
        }

        if (log.details?.missingFields) {
          for (const field of log.details.missingFields) {
            missingFields[field] = (missingFields[field] || 0) + 1;
          }
        }
      }
    }

    const totalProcessed = validRecords + invalidRecords;
    const validationErrorRate =
      totalProcessed > 0 ? Math.round((invalidRecords / totalProcessed) * 100) : 0;
    const dataIntegrity = totalProcessed > 0 ? Math.round((validRecords / totalProcessed) * 100) : 100;

    return {
      totalRecords: totalProcessed,
      validRecords,
      invalidRecords,
      duplicateRecords,
      missingFields,
      validationErrorRate,
      dataIntegrity,
      lastValidationTime: new Date(),
    };
  }

  /**
   * Get trend data over time
   */
  getTrendData(configId?: string, days: number = 30): TrendData[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let filtered = this.metrics.filter((m) => m.timestamp >= cutoffDate);

    if (configId) {
      filtered = filtered.filter((m) => m.configId === configId);
    }

    // Group by day
    const grouped = new Map<string, SyncMetric[]>();

    for (const metric of filtered) {
      const dateKey = metric.timestamp.toISOString().split('T')[0];

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(metric);
    }

    // Calculate trends
    const trends: TrendData[] = [];

    for (const [dateKey, dayMetrics] of grouped) {
      const successful = dayMetrics.filter((m) => m.status === 'success').length;
      const totalDuration = dayMetrics.reduce((sum, m) => sum + m.duration, 0);
      const totalConflicts = dayMetrics.reduce((sum, m) => sum + m.conflictsDetected, 0);

      trends.push({
        timestamp: new Date(dateKey),
        syncCount: dayMetrics.length,
        successRate: dayMetrics.length > 0 ? Math.round((successful / dayMetrics.length) * 100) : 0,
        averageDuration: dayMetrics.length > 0 ? Math.round(totalDuration / dayMetrics.length) : 0,
        conflictRate:
          dayMetrics.length > 0 ? Math.round((totalConflicts / dayMetrics.length) * 100) : 0,
      });
    }

    return trends.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(configId?: string): HealthScore {
    const performance = this.getPerformanceAnalysis(configId, 7); // Last 7 days
    const quality = this.getDataQualityMetrics(configId);
    const trends = this.getTrendData(configId, 7);

    // Sync health (0-100)
    const syncHealth = Math.max(0, Math.min(100, performance.successRate));

    // Data quality (0-100)
    const dataQuality = quality.dataIntegrity;

    // System stability (based on consistency)
    let systemStability = 100;
    if (trends.length > 1) {
      const successRates = trends.map((t) => t.successRate);
      const variance = this.calculateVariance(successRates);
      systemStability = Math.max(0, 100 - variance / 2);
    }

    // Overall score (weighted average)
    const overall = Math.round((syncHealth * 0.5 + dataQuality * 0.3 + systemStability * 0.2) / 100);

    // Determine trend
    let performanceTrend: 'improving' | 'stable' | 'declining' = 'stable';

    if (trends.length >= 3) {
      const recent = trends.slice(-3).map((t) => t.successRate);
      const older = trends.slice(-6, -3).map((t) => t.successRate);

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      if (recentAvg > olderAvg + 5) {
        performanceTrend = 'improving';
      } else if (recentAvg < olderAvg - 5) {
        performanceTrend = 'declining';
      }
    }

    return {
      overall: Math.max(0, Math.min(100, overall)),
      syncHealth,
      dataQuality,
      systemStability,
      performanceTrend,
    };
  }

  /**
   * Get detailed sync statistics
   */
  getSyncStatistics(configId?: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let filtered = this.metrics.filter((m) => m.timestamp >= cutoffDate);

    if (configId) {
      filtered = filtered.filter((m) => m.configId === configId);
    }

    const byStatus = {
      success: filtered.filter((m) => m.status === 'success').length,
      failure: filtered.filter((m) => m.status === 'failure').length,
      partial: filtered.filter((m) => m.status === 'partial').length,
    };

    const durations = filtered.map((m) => m.duration);
    const totalRecords = filtered.reduce((sum, m) => sum + m.recordsProcessed, 0);
    const totalSuccessful = filtered.reduce((sum, m) => sum + m.recordsSuccessful, 0);
    const totalFailed = filtered.reduce((sum, m) => sum + m.recordsFailed, 0);

    return {
      period: `Last ${days} days`,
      totalSyncs: filtered.length,
      byStatus,
      successRate: filtered.length > 0 ? Math.round((byStatus.success / filtered.length) * 100) : 0,
      statistics: {
        duration: {
          min: Math.min(...durations),
          max: Math.max(...durations),
          average: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
          median: this.calculateMedian(durations),
        },
        records: {
          total: totalRecords,
          successful: totalSuccessful,
          failed: totalFailed,
          successRate: totalRecords > 0 ? Math.round((totalSuccessful / totalRecords) * 100) : 0,
        },
      },
    };
  }

  /**
   * Get insights and recommendations
   */
  getInsights(configId?: string): Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    recommendation?: string;
  }> {
    const insights: Array<{
      type: 'warning' | 'info' | 'success';
      title: string;
      message: string;
      recommendation?: string;
    }> = [];

    const performance = this.getPerformanceAnalysis(configId, 7);
    const quality = this.getDataQualityMetrics(configId);
    const health = this.calculateHealthScore(configId);

    // Success rate check
    if (performance.successRate < 90) {
      insights.push({
        type: 'warning',
        title: 'Low Sync Success Rate',
        message: `Success rate is ${performance.successRate}%. Target is 99%+`,
        recommendation:
          'Review recent sync logs for errors and check HIS system connectivity',
      });
    } else if (performance.successRate >= 99) {
      insights.push({
        type: 'success',
        title: 'Excellent Sync Performance',
        message: `Success rate is ${performance.successRate}%. System performing optimally.`,
      });
    }

    // Data quality check
    if (quality.validationErrorRate > 5) {
      insights.push({
        type: 'warning',
        title: 'Data Quality Issues',
        message: `${quality.validationErrorRate}% of records have validation errors`,
        recommendation: 'Review mapping configuration and data sources',
      });
    }

    // Performance trend
    if (health.performanceTrend === 'declining') {
      insights.push({
        type: 'warning',
        title: 'Performance Declining',
        message: 'Sync success rate has been declining over the last week',
        recommendation: 'Check system resources and HIS connectivity',
      });
    } else if (health.performanceTrend === 'improving') {
      insights.push({
        type: 'success',
        title: 'Performance Improving',
        message: 'Sync success rate has been trending upward',
      });
    }

    // Conflict analysis
    if (performance.averageConflictsPerSync > 5) {
      insights.push({
        type: 'info',
        title: 'High Conflict Rate',
        message: `Average ${performance.averageConflictsPerSync} conflicts per sync`,
        recommendation: 'Review conflict resolution strategy or data synchronization timing',
      });
    }

    // Missing fields
    if (Object.keys(quality.missingFields).length > 0) {
      const topMissing = Object.entries(quality.missingFields)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([field]) => field)
        .join(', ');

      insights.push({
        type: 'info',
        title: 'Missing Fields Detected',
        message: `Top missing fields: ${topMissing}`,
        recommendation: 'Update data mapping to include these fields',
      });
    }

    return insights;
  }

  /**
   * Compare performance between configurations
   */
  compareConfigurations(): Map<string, PerformanceAnalysis> {
    const store = useHISIntegrationStore();
    const comparison = new Map<string, PerformanceAnalysis>();

    for (const config of store.configurations) {
      const analysis = this.getPerformanceAnalysis(config.id, 7);
      comparison.set(config.id, analysis);
    }

    return comparison;
  }

  /**
   * Export analytics report
   */
  exportReport(configId?: string, days: number = 30): string {
    const performance = this.getPerformanceAnalysis(configId, days);
    const quality = this.getDataQualityMetrics(configId);
    const health = this.calculateHealthScore(configId);
    const trends = this.getTrendData(configId, days);
    const insights = this.getInsights(configId);

    const report = {
      generatedAt: new Date().toISOString(),
      period: `Last ${days} days`,
      health,
      performance,
      quality,
      trends,
      insights,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Get comparative metrics for visualization
   */
  getComparisonMetrics(configIds: string[], days: number = 30) {
    const metrics = new Map<string, PerformanceAnalysis>();

    for (const configId of configIds) {
      metrics.set(configId, this.getPerformanceAnalysis(configId, days));
    }

    return metrics;
  }

  /**
   * Calculate variance for stability
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Calculate median
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Maintain metrics size
   */
  private maintainMetrics(): void {
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Load metrics from storage
   */
  private loadMetrics(): void {
    try {
      const stored = localStorage.getItem('his_analytics_metrics');
      if (stored) {
        const parsed = JSON.parse(stored) as SyncMetric[];
        this.metrics = parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
    } catch (error) {
      console.error('[Analytics] Failed to load metrics:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  private saveMetrics(): void {
    try {
      // Keep only last 5000 metrics to avoid storage limits
      const toStore = this.metrics.slice(-5000);
      localStorage.setItem('his_analytics_metrics', JSON.stringify(toStore));
    } catch (error) {
      console.error('[Analytics] Failed to save metrics:', error);
    }
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

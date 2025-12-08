/**
 * Reporting Service
 * Generates comprehensive reports for HIS integration analytics
 */

import { analyticsService } from './AnalyticsService';

interface Report {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  generatedAt: Date;
  period: { from: Date; to: Date };
  configIds: string[];
  format: 'json' | 'csv' | 'html';
  content: string;
  fileSize: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  schedule?: string; // cron pattern
  recipients?: string[];
  sections: Array<'overview' | 'performance' | 'quality' | 'health' | 'trends' | 'insights'>;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportSchedule {
  id: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  lastGenerated?: Date;
  nextGenerated?: Date;
  enabled: boolean;
}

export class ReportingService {
  private reports: Report[] = [];
  private templates: ReportTemplate[] = [];
  private schedules: ReportSchedule[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Generate a custom report
   */
  generateReport(
    name: string,
    configIds: string[],
    from: Date,
    to: Date,
    sections: string[] = ['overview', 'performance', 'quality', 'health', 'trends', 'insights'],
    format: 'json' | 'csv' | 'html' = 'json'
  ): Report {
    let content = '';
    let fileSize = 0;

    if (format === 'json') {
      content = this.generateJSONReport(configIds, from, to, sections);
      fileSize = Buffer.byteLength(content);
    } else if (format === 'csv') {
      content = this.generateCSVReport(configIds, from, to, sections);
      fileSize = Buffer.byteLength(content);
    } else if (format === 'html') {
      content = this.generateHTMLReport(name, configIds, from, to, sections);
      fileSize = Buffer.byteLength(content);
    }

    const report: Report = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: 'custom',
      generatedAt: new Date(),
      period: { from, to },
      configIds,
      format,
      content,
      fileSize,
    };

    this.reports.push(report);
    this.savereports();

    return report;
  }

  /**
   * Create a report template
   */
  createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ReportTemplate {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  /**
   * Schedule a report using a template
   */
  scheduleReport(
    templateId: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    time: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): ReportSchedule {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const schedule: ReportSchedule = {
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportId: templateId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      enabled: true,
    };

    // Calculate next run
    schedule.nextGenerated = this.calculateNextRun(frequency, time, dayOfWeek, dayOfMonth);

    this.schedules.push(schedule);
    return schedule;
  }

  /**
   * Get reports
   */
  getReports(filter?: { templateId?: string; from?: Date; to?: Date; limit?: number }): Report[] {
    let result = this.reports;

    if (filter?.from) {
      result = result.filter((r) => r.generatedAt >= filter.from!);
    }

    if (filter?.to) {
      result = result.filter((r) => r.generatedAt <= filter.to!);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): Report | undefined {
    return this.reports.find((r) => r.id === reportId);
  }

  /**
   * Download report
   */
  downloadReport(reportId: string, filename?: string): Blob | null {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return null;

    const mimeType = this.getMimeType(report.format);
    const blob = new Blob([report.content], { type: mimeType });

    return blob;
  }

  /**
   * Email report (placeholder for integration)
   */
  emailReport(reportId: string, recipients: string[]): Promise<boolean> {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return Promise.reject(new Error('Report not found'));

    // This would integrate with an email service
    console.log(`[Reporting] Would email ${report.name} to ${recipients.join(', ')}`);

    return Promise.resolve(true);
  }

  /**
   * Get templates
   */
  getTemplates(): ReportTemplate[] {
    return this.templates;
  }

  /**
   * Get schedules
   */
  getSchedules(enabled?: boolean): ReportSchedule[] {
    if (enabled !== undefined) {
      return this.schedules.filter((s) => s.enabled === enabled);
    }
    return this.schedules;
  }

  /**
   * Update schedule
   */
  updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): ReportSchedule | null {
    const schedule = this.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return null;

    Object.assign(schedule, updates);

    // Recalculate next run if frequency/time changed
    if (
      updates.frequency ||
      updates.time ||
      updates.dayOfWeek !== undefined ||
      updates.dayOfMonth !== undefined
    ) {
      schedule.nextGenerated = this.calculateNextRun(
        schedule.frequency,
        schedule.time,
        schedule.dayOfWeek,
        schedule.dayOfMonth
      );
    }

    return schedule;
  }

  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId: string): boolean {
    const index = this.schedules.findIndex((s) => s.id === scheduleId);
    if (index === -1) return false;

    this.schedules.splice(index, 1);
    return true;
  }

  /**
   * Get report statistics
   */
  getReportStatistics() {
    return {
      totalReports: this.reports.length,
      totalTemplates: this.templates.length,
      activeSchedules: this.schedules.filter((s) => s.enabled).length,
      reportsByType: {
        daily: this.reports.filter((r) => r.type === 'daily').length,
        weekly: this.reports.filter((r) => r.type === 'weekly').length,
        monthly: this.reports.filter((r) => r.type === 'monthly').length,
        custom: this.reports.filter((r) => r.type === 'custom').length,
      },
      totalSize: this.reports.reduce((sum, r) => sum + r.fileSize, 0),
    };
  }

  /**
   * Generate JSON report
   */
  private generateJSONReport(
    configIds: string[],
    from: Date,
    to: Date,
    sections: string[]
  ): string {
    const reportData: any = {
      generatedAt: new Date().toISOString(),
      period: { from: from.toISOString(), to: to.toISOString() },
      configurations: configIds,
    };

    if (sections.includes('overview')) {
      reportData.overview = {
        totalConfigurations: configIds.length,
        reportPeriod: this.getDaysDifference(from, to),
      };
    }

    if (sections.includes('performance')) {
      reportData.performance = {};
      for (const configId of configIds) {
        reportData.performance[configId] = analyticsService.getPerformanceAnalysis(configId);
      }
    }

    if (sections.includes('quality')) {
      reportData.quality = {};
      for (const configId of configIds) {
        reportData.quality[configId] = analyticsService.getDataQualityMetrics(configId);
      }
    }

    if (sections.includes('health')) {
      reportData.health = {};
      for (const configId of configIds) {
        reportData.health[configId] = analyticsService.calculateHealthScore(configId);
      }
    }

    if (sections.includes('trends')) {
      reportData.trends = {};
      for (const configId of configIds) {
        reportData.trends[configId] = analyticsService.getTrendData(configId);
      }
    }

    if (sections.includes('insights')) {
      reportData.insights = {};
      for (const configId of configIds) {
        reportData.insights[configId] = analyticsService.getInsights(configId);
      }
    }

    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(configIds: string[], from: Date, to: Date, sections: string[]): string {
    const lines: string[] = [];

    lines.push('HIS Integration Analytics Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Period: ${from.toISOString()} to ${to.toISOString()}`);
    lines.push('');

    if (sections.includes('performance')) {
      lines.push('Performance Metrics');
      lines.push('Configuration,Total Syncs,Success Rate,Avg Duration (ms),Total Records');

      for (const configId of configIds) {
        const perf = analyticsService.getPerformanceAnalysis(configId);
        lines.push(
          `${configId},${perf.totalSyncs},${perf.successRate}%,${perf.averageDuration},${perf.totalRecordsSynced}`
        );
      }

      lines.push('');
    }

    if (sections.includes('quality')) {
      lines.push('Data Quality Metrics');
      lines.push('Configuration,Total Records,Valid,Invalid,Validation Error Rate,Data Integrity');

      for (const configId of configIds) {
        const quality = analyticsService.getDataQualityMetrics(configId);
        lines.push(
          `${configId},${quality.totalRecords},${quality.validRecords},${quality.invalidRecords},${quality.validationErrorRate}%,${quality.dataIntegrity}%`
        );
      }

      lines.push('');
    }

    if (sections.includes('health')) {
      lines.push('System Health Score');
      lines.push('Configuration,Overall,Sync Health,Data Quality,System Stability,Trend');

      for (const configId of configIds) {
        const health = analyticsService.calculateHealthScore(configId);
        lines.push(
          `${configId},${health.overall},${health.syncHealth},${health.dataQuality},${health.systemStability},${health.performanceTrend}`
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(
    name: string,
    configIds: string[],
    from: Date,
    to: Date,
    sections: string[]
  ): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${name} - HIS Integration Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
    .metric-label { font-size: 12px; color: #666; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    .section { page-break-inside: avoid; margin-bottom: 30px; }
    .metadata { font-size: 12px; color: #999; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  
  <div class="metadata">
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Period:</strong> ${from.toLocaleDateString()} to ${to.toLocaleDateString()}</p>
    <p><strong>Configurations:</strong> ${configIds.join(', ')}</p>
  </div>
`;

    let body = html;

    if (sections.includes('overview')) {
      body += `
  <div class="section">
    <h2>Overview</h2>
    <div class="metric">
      <div class="metric-label">Configurations Monitored</div>
      <div class="metric-value">${configIds.length}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Report Period</div>
      <div class="metric-value">${this.getDaysDifference(from, to)} days</div>
    </div>
  </div>
`;
    }

    if (sections.includes('performance')) {
      body += `
  <div class="section">
    <h2>Performance Metrics</h2>
    <table>
      <tr>
        <th>Configuration</th>
        <th>Total Syncs</th>
        <th>Success Rate</th>
        <th>Avg Duration</th>
        <th>Total Records</th>
      </tr>
`;

      for (const configId of configIds) {
        const perf = analyticsService.getPerformanceAnalysis(configId);
        const rateClass = perf.successRate >= 95 ? 'success' : perf.successRate >= 90 ? 'warning' : 'danger';

        body += `
      <tr>
        <td>${configId}</td>
        <td>${perf.totalSyncs}</td>
        <td class="${rateClass}">${perf.successRate}%</td>
        <td>${perf.averageDuration}ms</td>
        <td>${perf.totalRecordsSynced}</td>
      </tr>
`;
      }

      body += `
    </table>
  </div>
`;
    }

    if (sections.includes('health')) {
      body += `
  <div class="section">
    <h2>System Health</h2>
    <table>
      <tr>
        <th>Configuration</th>
        <th>Overall Score</th>
        <th>Sync Health</th>
        <th>Data Quality</th>
        <th>Stability</th>
        <th>Trend</th>
      </tr>
`;

      for (const configId of configIds) {
        const health = analyticsService.calculateHealthScore(configId);
        const scoreClass = health.overall >= 80 ? 'success' : health.overall >= 60 ? 'warning' : 'danger';

        body += `
      <tr>
        <td>${configId}</td>
        <td class="${scoreClass}">${health.overall}/100</td>
        <td>${health.syncHealth}%</td>
        <td>${health.dataQuality}%</td>
        <td>${health.systemStability}%</td>
        <td>${health.performanceTrend}</td>
      </tr>
`;
      }

      body += `
    </table>
  </div>
`;
    }

    body += `
</body>
</html>
`;

    return body;
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(
    frequency: string,
    time: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const next = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    next.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekly') {
      const daysToAdd = dayOfWeek !== undefined ? dayOfWeek - next.getDay() : 7;
      next.setDate(next.getDate() + daysToAdd);
    } else if (frequency === 'monthly') {
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
        if (next <= new Date()) {
          next.setMonth(next.getMonth() + 1);
        }
      }
    }

    return next;
  }

  /**
   * Get days difference
   */
  private getDaysDifference(from: Date, to: Date): number {
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'html':
        return 'text/html';
      default:
        return 'text/plain';
    }
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    this.createTemplate({
      name: 'Daily Summary',
      description: 'Daily overview of sync performance and system health',
      schedule: '0 6 * * *', // 6 AM daily
      sections: ['overview', 'performance', 'health', 'insights'],
    });

    this.createTemplate({
      name: 'Weekly Report',
      description: 'Comprehensive weekly analysis with trends',
      schedule: '0 8 * * 0', // Sunday 8 AM
      sections: ['overview', 'performance', 'quality', 'health', 'trends', 'insights'],
    });

    this.createTemplate({
      name: 'Monthly Executive Summary',
      description: 'High-level monthly summary for stakeholders',
      schedule: '0 9 1 * *', // 1st of month at 9 AM
      sections: ['overview', 'performance', 'health', 'insights'],
    });
  }

  /**
   * Save reports (placeholder)
   */
  private savereports(): void {
    try {
      const toStore = this.reports.slice(-100); // Keep last 100
      localStorage.setItem('his_reports', JSON.stringify(toStore));
    } catch (error) {
      console.error('[Reporting] Failed to save reports:', error);
    }
  }
}

// Singleton instance
export const reportingService = new ReportingService();

/**
 * Audit Logging Service
 * Provides comprehensive audit trail for compliance and security
 * Tracks all HIS integration activities with user context
 */

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SYNC' | 'AUTHENTICATE' | 'ERROR' | 'EXPORT' | 'IMPORT';
  resourceType: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  details: Record<string, any>;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  duration?: number; // in milliseconds
}

interface AuditReport {
  id: string;
  generatedAt: Date;
  period: { from: Date; to: Date };
  events: AuditEvent[];
  statistics: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    eventsByAction: Record<string, number>;
    eventsByResourceType: Record<string, number>;
    eventsByUser: Record<string, number>;
  };
}

export class AuditLoggingService {
  private events: AuditEvent[] = [];
  private maxEvents: number = 50000;
  private enablePersistence: boolean = true;
  private currentUserId?: string;

  constructor(enablePersistence: boolean = true) {
    this.enablePersistence = enablePersistence;
    if (enablePersistence) {
      this.loadAuditLog();
    }
  }

  /**
   * Set current user context
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Log an audit event
   */
  log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'userId'>): AuditEvent {
    const auditEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.currentUserId,
      ...event,
    };

    this.events.push(auditEvent);
    this.maintainAuditLog();
    this.saveAuditLog();

    return auditEvent;
  }

  /**
   * Log successful operation
   */
  logSuccess(
    action: AuditEvent['action'],
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>,
    duration?: number
  ): AuditEvent {
    return this.log({
      action,
      resourceType,
      resourceId,
      status: 'SUCCESS',
      details: details || {},
      duration,
    });
  }

  /**
   * Log failed operation
   */
  logFailure(
    action: AuditEvent['action'],
    resourceType: string,
    resourceId: string,
    errorMessage: string,
    details?: Record<string, any>,
    duration?: number
  ): AuditEvent {
    return this.log({
      action,
      resourceType,
      resourceId,
      status: 'FAILURE',
      errorMessage,
      details: details || {},
      duration,
    });
  }

  /**
   * Log data change for compliance
   */
  logChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resourceType: string,
    resourceId: string,
    before?: Record<string, any>,
    after?: Record<string, any>
  ): AuditEvent {
    return this.log({
      action,
      resourceType,
      resourceId,
      status: 'SUCCESS',
      changesBefore: before,
      changesAfter: after,
      details: {
        fieldsChanged: after ? Object.keys(after).length : 0,
      },
    });
  }

  /**
   * Get audit events with filtering
   */
  getEvents(filter?: {
    userId?: string;
    action?: AuditEvent['action'];
    resourceType?: string;
    status?: AuditEvent['status'];
    from?: Date;
    to?: Date;
    limit?: number;
  }): AuditEvent[] {
    let result = this.events;

    if (filter?.userId) {
      result = result.filter((e) => e.userId === filter.userId);
    }

    if (filter?.action) {
      result = result.filter((e) => e.action === filter.action);
    }

    if (filter?.resourceType) {
      result = result.filter((e) => e.resourceType === filter.resourceType);
    }

    if (filter?.status) {
      result = result.filter((e) => e.status === filter.status);
    }

    if (filter?.from) {
      result = result.filter((e) => e.timestamp >= filter.from!);
    }

    if (filter?.to) {
      result = result.filter((e) => e.timestamp <= filter.to!);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Get specific event by ID
   */
  getEvent(eventId: string): AuditEvent | undefined {
    return this.events.find((e) => e.id === eventId);
  }

  /**
   * Generate audit report for compliance
   */
  generateReport(from: Date, to: Date): AuditReport {
    const events = this.getEvents({ from, to });

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: { from, to },
      events,
      statistics: {
        totalEvents: events.length,
        successfulEvents: events.filter((e) => e.status === 'SUCCESS').length,
        failedEvents: events.filter((e) => e.status === 'FAILURE').length,
        eventsByAction: this.groupAndCount(events, 'action'),
        eventsByResourceType: this.groupAndCount(events, 'resourceType'),
        eventsByUser: this.groupAndCount(events, 'userId'),
      },
    };
  }

  /**
   * Get user activity
   */
  getUserActivity(userId: string, limit?: number): AuditEvent[] {
    return this.getEvents({ userId, limit: limit || 100 });
  }

  /**
   * Get resource change history
   */
  getResourceHistory(
    resourceType: string,
    resourceId: string
  ): Array<{
    event: AuditEvent;
    before?: Record<string, any>;
    after?: Record<string, any>;
  }> {
    return this.getEvents({ resourceType, from: new Date(0) })
      .filter((e) => e.resourceId === resourceId)
      .map((event) => ({
        event,
        before: event.changesBefore,
        after: event.changesAfter,
      }));
  }

  /**
   * Detect suspicious activity
   */
  detectAnomalies(lookbackDays: number = 7): Array<{ type: string; description: string; events: AuditEvent[] }> {
    const from = new Date();
    from.setDate(from.getDate() - lookbackDays);

    const recentEvents = this.getEvents({ from, status: 'FAILURE' });
    const anomalies: Array<{ type: string; description: string; events: AuditEvent[] }> = [];

    // Check for repeated failures
    const failuresByUser = new Map<string, AuditEvent[]>();
    for (const event of recentEvents) {
      if (event.userId) {
        if (!failuresByUser.has(event.userId)) {
          failuresByUser.set(event.userId, []);
        }
        failuresByUser.get(event.userId)!.push(event);
      }
    }

    for (const [userId, events] of failuresByUser) {
      if (events.length > 5) {
        anomalies.push({
          type: 'REPEATED_FAILURES',
          description: `User ${userId} had ${events.length} failed operations in last ${lookbackDays} days`,
          events,
        });
      }
    }

    // Check for unusual patterns
    const allEvents = this.getEvents({ from });
    const eventsByHour = new Map<number, number>();

    for (const event of allEvents) {
      const hour = event.timestamp.getHours();
      eventsByHour.set(hour, (eventsByHour.get(hour) || 0) + 1);
    }

    const avgEvents = allEvents.length / 24;
    const suspiciousHours: AuditEvent[] = [];

    for (const [hour, count] of eventsByHour) {
      if (count > avgEvents * 3) {
        // 3x average activity
        suspiciousHours.push(...allEvents.filter((e) => e.timestamp.getHours() === hour));
      }
    }

    if (suspiciousHours.length > 0) {
      anomalies.push({
        type: 'UNUSUAL_ACTIVITY',
        description: `Unusual activity pattern detected during peak hours`,
        events: suspiciousHours.slice(0, 10), // Limit to 10 most recent
      });
    }

    return anomalies;
  }

  /**
   * Export audit log for external compliance
   */
  exportAuditLog(format: 'json' | 'csv' = 'json', filter?: Parameters<typeof this.getEvents>[0]): string {
    const events = this.getEvents(filter);

    if (format === 'csv') {
      return this.eventsToCSV(events);
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Clear old audit events
   */
  clearOldEvents(beforeDate: Date): number {
    const originalSize = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= beforeDate);
    this.saveAuditLog();

    return originalSize - this.events.length;
  }

  /**
   * Get audit statistics
   */
  getStatistics() {
    const all = this.events;

    return {
      totalEvents: all.length,
      successfulEvents: all.filter((e) => e.status === 'SUCCESS').length,
      failedEvents: all.filter((e) => e.status === 'FAILURE').length,
      partialEvents: all.filter((e) => e.status === 'PARTIAL').length,
      eventsByAction: this.groupAndCount(all, 'action'),
      eventsByResourceType: this.groupAndCount(all, 'resourceType'),
      topUsers: this.getTopUsers(10),
      averageOperationTime: this.getAverageOperationTime(),
      dateRange: all.length > 0 ? { from: all[0].timestamp, to: all[all.length - 1].timestamp } : null,
    };
  }

  /**
   * Convert events to CSV format
   */
  private eventsToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'Action',
      'Resource Type',
      'Resource ID',
      'Status',
      'Error Message',
      'Duration (ms)',
    ];

    const rows = events.map((e) => [
      e.id,
      e.timestamp.toISOString(),
      e.userId || '',
      e.action,
      e.resourceType,
      e.resourceId || '',
      e.status,
      e.errorMessage || '',
      e.duration || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Group and count events
   */
  private groupAndCount(events: AuditEvent[], field: keyof AuditEvent): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const event of events) {
      const value = String(event[field] || 'unknown');
      counts[value] = (counts[value] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get top users by event count
   */
  private getTopUsers(limit: number): Array<{ userId: string; eventCount: number }> {
    const userCounts = this.groupAndCount(this.events, 'userId');

    return Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, eventCount: count }));
  }

  /**
   * Get average operation time
   */
  private getAverageOperationTime(): number {
    const events = this.events.filter((e) => e.duration !== undefined);
    if (events.length === 0) return 0;

    const sum = events.reduce((acc, e) => acc + (e.duration || 0), 0);
    return Math.round(sum / events.length);
  }

  /**
   * Maintain audit log size
   */
  private maintainAuditLog(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Load audit log from storage
   */
  private loadAuditLog(): void {
    try {
      const stored = localStorage.getItem('his_audit_log');
      if (stored) {
        const parsed = JSON.parse(stored) as AuditEvent[];
        this.events = parsed.map((e) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
    } catch (error) {
      console.error('[Audit] Failed to load audit log:', error);
    }
  }

  /**
   * Save audit log to storage
   */
  private saveAuditLog(): void {
    if (!this.enablePersistence) return;

    try {
      // Keep only last 5000 events to avoid storage limits
      const toStore = this.events.slice(-5000);
      localStorage.setItem('his_audit_log', JSON.stringify(toStore));
    } catch (error) {
      console.error('[Audit] Failed to save audit log:', error);
    }
  }
}

// Singleton instance
export const auditLoggingService = new AuditLoggingService();

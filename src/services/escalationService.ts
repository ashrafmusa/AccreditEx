/**
 * Automated Escalation Rules Service
 * 
 * Evaluates incident severity and triggers notifications to appropriate personnel.
 * Rules are severity-based with configurable recipients per escalation level.
 */

import { IncidentReport, User, EscalationRule, EscalationEvent } from '@/types';
import { notificationService } from '@/services/notificationService';
import { useUserStore } from '@/stores/useUserStore';
import { logger } from '@/services/logger';

// Default escalation rules — can be overridden via AppSettings
const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
    {
        id: 'rule-sentinel',
        name: 'Sentinel Event Escalation',
        triggerSeverity: 'Sentinel Event',
        triggerTypes: [],  // empty = all types
        notifyRoles: ['Admin'],
        notifyDepartmentHead: true,
        notifySupervisor: true,
        notificationPriority: 'critical',
        responseTimeHours: 1,
        enabled: true,
    },
    {
        id: 'rule-severe',
        name: 'Severe Incident Escalation',
        triggerSeverity: 'Severe',
        triggerTypes: [],
        notifyRoles: ['Admin', 'ProjectLead'],
        notifyDepartmentHead: true,
        notifySupervisor: true,
        notificationPriority: 'high',
        responseTimeHours: 4,
        enabled: true,
    },
    {
        id: 'rule-moderate',
        name: 'Moderate Incident Notification',
        triggerSeverity: 'Moderate',
        triggerTypes: [],
        notifyRoles: [],
        notifyDepartmentHead: true,
        notifySupervisor: true,
        notificationPriority: 'normal',
        responseTimeHours: 24,
        enabled: true,
    },
    {
        id: 'rule-patient-safety',
        name: 'Patient Safety Alert',
        triggerSeverity: 'Moderate',
        triggerTypes: ['Patient Safety', 'Medication Error'],
        notifyRoles: ['Admin'],
        notifyDepartmentHead: true,
        notifySupervisor: false,
        notificationPriority: 'high',
        responseTimeHours: 2,
        enabled: true,
    },
    {
        id: 'rule-lab-safety',
        name: 'Lab Safety Alert',
        triggerSeverity: 'Moderate',
        triggerTypes: ['Biosafety Exposure', 'Specimen Error', 'Proficiency Testing Failure'],
        notifyRoles: ['Admin'],
        notifyDepartmentHead: true,
        notifySupervisor: true,
        notificationPriority: 'high',
        responseTimeHours: 2,
        enabled: true,
    },
];

class EscalationService {
    private rules: EscalationRule[] = DEFAULT_ESCALATION_RULES;
    private escalationHistory: EscalationEvent[] = [];

    /** Update rules (e.g., from AppSettings) */
    setRules(rules: EscalationRule[]) {
        this.rules = rules;
    }

    /** Get current escalation rules */
    getRules(): EscalationRule[] {
        return [...this.rules];
    }

    /** Get escalation history */
    getHistory(): EscalationEvent[] {
        return [...this.escalationHistory];
    }

    /** Evaluate and trigger escalation for an incident */
    async evaluateIncident(incident: IncidentReport, isNew: boolean = true): Promise<EscalationEvent[]> {
        const matchingRules = this.findMatchingRules(incident);
        const events: EscalationEvent[] = [];

        for (const rule of matchingRules) {
            try {
                const recipients = this.resolveRecipients(rule, incident);
                if (recipients.length === 0) continue;

                const event: EscalationEvent = {
                    id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    incidentId: incident.id,
                    ruleId: rule.id,
                    ruleName: rule.name,
                    severity: incident.severity,
                    triggeredAt: new Date().toISOString(),
                    recipientIds: recipients.map(r => r.id),
                    recipientNames: recipients.map(r => r.name),
                    notificationPriority: rule.notificationPriority,
                    responseTimeHours: rule.responseTimeHours,
                    status: 'sent',
                };

                // Send notifications to all recipients
                for (const recipient of recipients) {
                    await this.sendEscalationNotification(recipient, incident, rule, isNew);
                }

                events.push(event);
                this.escalationHistory.unshift(event);
            } catch (error) {
                logger.error(`Escalation rule ${rule.id} failed`, error);
            }
        }

        // Keep history manageable
        if (this.escalationHistory.length > 200) {
            this.escalationHistory = this.escalationHistory.slice(0, 200);
        }

        return events;
    }

    /** Find rules that match the incident */
    private findMatchingRules(incident: IncidentReport): EscalationRule[] {
        const incidentLevel = SEVERITY_LEVEL[incident.severity] || 0;

        return this.rules.filter(rule => {
            if (!rule.enabled) return false;

            const ruleLevel = SEVERITY_LEVEL[rule.triggerSeverity] || 0;

            // Incident must meet or exceed the rule's trigger severity
            if (incidentLevel < ruleLevel) return false;

            // If rule specifies types, incident must match one
            if (rule.triggerTypes.length > 0 && !rule.triggerTypes.includes(incident.type)) {
                return false;
            }

            return true;
        });
    }

    /** Resolve notification recipients based on rule configuration */
    private resolveRecipients(rule: EscalationRule, incident: IncidentReport): User[] {
        const allUsers = useUserStore.getState().users;
        const recipientMap = new Map<string, User>();

        // Add users by role
        for (const role of rule.notifyRoles) {
            const roleUsers = allUsers.filter(u => u.role === role && u.isActive !== false);
            roleUsers.forEach(u => recipientMap.set(u.id, u));
        }

        // Add department head
        if (rule.notifyDepartmentHead && incident.department) {
            const deptUsers = allUsers.filter(
                u => (u.department === incident.department || u.departmentId === incident.department) &&
                    u.role === 'ProjectLead' && u.isActive !== false
            );
            deptUsers.forEach(u => recipientMap.set(u.id, u));
        }

        // Add supervisor of reporter
        if (rule.notifySupervisor) {
            const reporter = allUsers.find(u => u.id === incident.reportedBy || u.name === incident.reportedBy);
            if (reporter?.supervisorId) {
                const supervisor = allUsers.find(u => u.id === reporter.supervisorId);
                if (supervisor) recipientMap.set(supervisor.id, supervisor);
            }
        }

        // Remove the reporter themselves from notifications
        const reporterId = allUsers.find(u => u.name === incident.reportedBy || u.id === incident.reportedBy)?.id;
        if (reporterId) recipientMap.delete(reporterId);

        return Array.from(recipientMap.values());
    }

    /** Send notification to a single recipient */
    private async sendEscalationNotification(
        recipient: User,
        incident: IncidentReport,
        rule: EscalationRule,
        isNew: boolean,
    ): Promise<void> {
        const severityEmoji = {
            'Minor': 'ℹ️',
            'Moderate': '⚠️',
            'Severe': '🔴',
            'Sentinel Event': '🚨',
        }[incident.severity] || '⚠️';

        const action = isNew ? 'reported' : 'updated';
        const title = `${severityEmoji} ${incident.severity} Incident ${action}`;
        const message = [
            `Type: ${incident.type}`,
            `Location: ${incident.location}`,
            incident.department ? `Department: ${incident.department}` : '',
            `Reported by: ${incident.reportedBy}`,
            rule.responseTimeHours <= 4 ? `⏰ Response required within ${rule.responseTimeHours}h` : '',
            incident.description.length > 100
                ? incident.description.slice(0, 100) + '...'
                : incident.description,
        ].filter(Boolean).join('\n');

        const notificationType = rule.notificationPriority === 'critical' ? 'error'
            : rule.notificationPriority === 'high' ? 'warning'
                : 'info';

        await notificationService.createNotification(
            recipient.id,
            title,
            message,
            {
                type: notificationType as 'info' | 'warning' | 'error',
                category: 'compliance',
                priority: rule.notificationPriority,
                relatedId: incident.id,
                relatedType: 'incident',
                data: {
                    incidentType: incident.type,
                    severity: incident.severity,
                    escalationRuleId: rule.id,
                    responseTimeHours: rule.responseTimeHours,
                },
            }
        );
    }

    /** Get escalation summary for display */
    getSeveritySummary(incidents: IncidentReport[]): { severity: string; count: number; escalated: number }[] {
        const severities: IncidentReport['severity'][] = ['Sentinel Event', 'Severe', 'Moderate', 'Minor'];
        return severities.map(severity => {
            const matching = incidents.filter(i => i.severity === severity);
            const escalated = this.escalationHistory.filter(
                e => e.severity === severity
            ).length;
            return { severity, count: matching.length, escalated };
        });
    }
}

export const escalationService = new EscalationService();

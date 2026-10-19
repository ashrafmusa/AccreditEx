/**
 * Workflow Engine Service
 *
 * Core rule-evaluation engine that:
 * 1. Stores workflow definitions (in-memory + Firestore)
 * 2. Evaluates triggers against incoming entity events
 * 3. Checks conditions (AND/OR logic)
 * 4. Executes actions (notifications, status changes, task creation, etc.)
 * 5. Logs execution history
 *
 * Integration pattern: Call `workflowEngine.evaluate(entity, event, data)` from
 * store actions — same pattern as escalationService.evaluateIncident().
 */

import {
    WorkflowDefinition,
    WorkflowExecutionLog,
    WorkflowAction,
    WorkflowConditionGroup,
    WorkflowCondition,
    TriggerEntity,
    TriggerEvent,
    ExecutionStatus,
    NotifyActionConfig,
    CreateTaskActionConfig,
    WORKFLOW_TEMPLATES,
} from '@/types/workflow';
import { ComplianceStatus, ProjectStatus } from '@/types';
import { notificationService } from '@/services/notificationService';
import { useUserStore } from '@/stores/useUserStore';
import { logger } from '@/services/logger';

class WorkflowEngine {
    private workflows: WorkflowDefinition[] = [];
    private executionLog: WorkflowExecutionLog[] = [];
    private maxLogEntries = 500;
    private _initialized = false;

    // ── Initialization ────────────────────────────────────────

    /** Initialize with any persisted workflows + system templates */
    initialize(savedWorkflows?: WorkflowDefinition[]) {
        if (savedWorkflows && savedWorkflows.length > 0) {
            this.workflows = savedWorkflows;
        }
        this._initialized = true;
        logger.info(`[WorkflowEngine] Initialized with ${this.workflows.length} workflows`);
    }

    get isInitialized() {
        return this._initialized;
    }

    // ── CRUD ──────────────────────────────────────────────────

    getWorkflows(): WorkflowDefinition[] {
        return [...this.workflows];
    }

    getActiveWorkflows(): WorkflowDefinition[] {
        return this.workflows.filter((w) => w.status === 'active');
    }

    getWorkflowById(id: string): WorkflowDefinition | undefined {
        return this.workflows.find((w) => w.id === id);
    }

    addWorkflow(workflow: WorkflowDefinition) {
        this.workflows.push(workflow);
        logger.info(`[WorkflowEngine] Added workflow: ${workflow.name} (${workflow.id})`);
    }

    updateWorkflow(id: string, updates: Partial<WorkflowDefinition>) {
        const idx = this.workflows.findIndex((w) => w.id === id);
        if (idx !== -1) {
            this.workflows[idx] = {
                ...this.workflows[idx],
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            logger.info(`[WorkflowEngine] Updated workflow: ${this.workflows[idx].name}`);
        }
    }

    deleteWorkflow(id: string) {
        this.workflows = this.workflows.filter((w) => w.id !== id);
        logger.info(`[WorkflowEngine] Deleted workflow: ${id}`);
    }

    toggleWorkflowStatus(id: string) {
        const wf = this.workflows.find((w) => w.id === id);
        if (wf) {
            wf.status = wf.status === 'active' ? 'paused' : 'active';
            wf.updatedAt = new Date().toISOString();
            logger.info(`[WorkflowEngine] Toggled workflow ${wf.name} → ${wf.status}`);
        }
    }

    // ── Execution Log ─────────────────────────────────────────

    getExecutionLog(): WorkflowExecutionLog[] {
        return [...this.executionLog];
    }

    getLogForWorkflow(workflowId: string): WorkflowExecutionLog[] {
        return this.executionLog.filter((l) => l.workflowId === workflowId);
    }

    clearExecutionLog() {
        this.executionLog = [];
    }

    // ── Template Creation ─────────────────────────────────────

    createFromTemplate(templateIndex: number, createdBy: string): WorkflowDefinition | null {
        const template = WORKFLOW_TEMPLATES[templateIndex];
        if (!template) return null;

        const now = new Date().toISOString();
        const workflow: WorkflowDefinition = {
            ...template,
            id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdBy,
            createdAt: now,
            updatedAt: now,
            executionCount: 0,
        };
        this.addWorkflow(workflow);
        return workflow;
    }

    // ── Core: Evaluate ────────────────────────────────────────

    /**
     * Called by store actions when an entity event occurs.
     * Evaluates all active workflows, checks triggers and conditions,
     * then executes matching workflows' actions.
     *
     * @param entity  The entity type (e.g., 'document', 'checklist_item')
     * @param event   The event type (e.g., 'status_changed', 'created')
     * @param data    The entity data object (used for condition evaluation)
     */
    async evaluate(
        entity: TriggerEntity,
        event: TriggerEvent,
        data: Record<string, unknown>,
    ): Promise<WorkflowExecutionLog[]> {
        const activeWorkflows = this.getActiveWorkflows();
        const matchingWorkflows = activeWorkflows.filter((wf) =>
            this.matchesTrigger(wf, entity, event, data),
        );

        if (matchingWorkflows.length === 0) return [];

        logger.info(
            `[WorkflowEngine] ${matchingWorkflows.length} workflow(s) matched for ${entity}.${event}`,
        );

        const logs: WorkflowExecutionLog[] = [];

        for (const wf of matchingWorkflows) {
            const log = await this.executeWorkflow(wf, entity, event, data);
            logs.push(log);
        }

        return logs;
    }

    // ── Trigger Matching ──────────────────────────────────────

    private matchesTrigger(
        wf: WorkflowDefinition,
        entity: TriggerEntity,
        event: TriggerEvent,
        data: Record<string, unknown>,
    ): boolean {
        if (wf.trigger.entity !== entity || wf.trigger.event !== event) return false;

        // Check field filters on the trigger (e.g., status === 'Non-Compliant')
        if (wf.trigger.fieldFilters && wf.trigger.fieldFilters.length > 0) {
            const allFiltersMatch = wf.trigger.fieldFilters.every((f) =>
                this.evaluateCondition(f, data),
            );
            if (!allFiltersMatch) return false;
        }

        // Check condition group
        if (wf.conditionGroup.conditions.length > 0) {
            if (!this.evaluateConditionGroup(wf.conditionGroup, data)) return false;
        }

        return true;
    }

    // ── Condition Evaluation ──────────────────────────────────

    private evaluateConditionGroup(
        group: WorkflowConditionGroup,
        data: Record<string, unknown>,
    ): boolean {
        if (group.conditions.length === 0) return true;

        if (group.logic === 'AND') {
            return group.conditions.every((c) => this.evaluateCondition(c, data));
        }
        return group.conditions.some((c) => this.evaluateCondition(c, data));
    }

    private evaluateCondition(
        condition: WorkflowCondition,
        data: Record<string, unknown>,
    ): boolean {
        const fieldValue = this.resolveField(condition.field, data);

        switch (condition.operator) {
            case 'equals':
                return String(fieldValue) === String(condition.value);
            case 'not_equals':
                return String(fieldValue) !== String(condition.value);
            case 'contains':
                return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
            case 'greater_than':
                return Number(fieldValue) > Number(condition.value);
            case 'less_than':
                return Number(fieldValue) < Number(condition.value);
            case 'is_empty':
                return fieldValue === undefined || fieldValue === null || fieldValue === '';
            case 'is_not_empty':
                return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
            case 'in_list':
                if (Array.isArray(condition.value)) {
                    return condition.value.includes(String(fieldValue));
                }
                return false;
            default:
                return false;
        }
    }

    /** Resolve dot-notation field paths like "severity" or "assignedTo.role" */
    private resolveField(field: string, data: Record<string, unknown>): unknown {
        const parts = field.split('.');
        let current: unknown = data;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = (current as Record<string, unknown>)[part];
        }
        return current;
    }

    // ── Workflow Execution ────────────────────────────────────

    private async executeWorkflow(
        wf: WorkflowDefinition,
        entity: TriggerEntity,
        event: TriggerEvent,
        data: Record<string, unknown>,
    ): Promise<WorkflowExecutionLog> {
        const logEntry: WorkflowExecutionLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            workflowId: wf.id,
            workflowName: wf.name,
            triggeredBy: `${entity}.${event}`,
            triggerEntityId: String(data.id || ''),
            startedAt: new Date().toISOString(),
            status: 'running',
            actionResults: [],
        };

        const sortedActions = [...wf.actions].sort((a, b) => a.order - b.order);

        try {
            for (const action of sortedActions) {
                // Handle delays
                if (action.delayMinutes > 0) {
                    // For now, skip delayed actions (they'd need a scheduler in production)
                    logEntry.actionResults.push({
                        actionId: action.id,
                        actionType: action.type,
                        status: 'skipped',
                        message: `Delayed action (${action.delayMinutes}min) — requires background scheduler`,
                        executedAt: new Date().toISOString(),
                    });
                    continue;
                }

                const result = await this.executeAction(action, entity, data);
                logEntry.actionResults.push(result);
            }

            logEntry.status = logEntry.actionResults.some((r) => r.status === 'failed')
                ? 'failed'
                : 'completed';
        } catch (error) {
            logEntry.status = 'failed';
            logEntry.error = error instanceof Error ? error.message : String(error);
        }

        logEntry.completedAt = new Date().toISOString();

        // Update workflow stats
        wf.executionCount++;
        wf.lastExecutedAt = logEntry.completedAt;

        // Store log (capped)
        this.executionLog.unshift(logEntry);
        if (this.executionLog.length > this.maxLogEntries) {
            this.executionLog = this.executionLog.slice(0, this.maxLogEntries);
        }

        logger.info(
            `[WorkflowEngine] Executed "${wf.name}" → ${logEntry.status} (${logEntry.actionResults.length} actions)`,
        );

        return logEntry;
    }

    // ── Action Execution ──────────────────────────────────────

    private async executeAction(
        action: WorkflowAction,
        entity: TriggerEntity,
        data: Record<string, unknown>,
    ): Promise<WorkflowExecutionLog['actionResults'][0]> {
        const executedAt = new Date().toISOString();

        try {
            switch (action.type) {
                case 'send_notification': {
                    const config = action.config as unknown as NotifyActionConfig;
                    const title = this.resolveTokens(config.title, data);
                    const message = this.resolveTokens(config.message, data);

                    // Get recipients
                    const recipientIds: string[] = [...(config.recipientUserIds || [])];
                    if (config.recipientRoles && config.recipientRoles.length > 0) {
                        const allUsers = useUserStore.getState().users;
                        for (const role of config.recipientRoles) {
                            const roleLower = role.toLowerCase();
                            const roleUsers = allUsers.filter(
                                (u) => u.role?.toLowerCase() === roleLower,
                            );
                            recipientIds.push(...roleUsers.map((u) => u.id));
                        }
                    }

                    // Deduplicate
                    const uniqueRecipients = [...new Set(recipientIds)];

                    for (const userId of uniqueRecipients) {
                        await notificationService.createNotification(
                            userId,
                            title,
                            message,
                            {
                                type: config.priority === 'critical' ? 'error' : config.priority === 'high' ? 'warning' : 'info',
                                category: 'system',
                                priority: config.priority,
                                relatedId: String(data.id || ''),
                            },
                        );
                    }

                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Notified ${uniqueRecipients.length} user(s)`,
                        executedAt,
                    };
                }

                case 'create_task': {
                    const config = action.config as unknown as CreateTaskActionConfig;
                    const title = this.resolveTokens(config.title, data);
                    const description = this.resolveTokens(config.description, data);

                    // Create a notification-based task (tasks are managed via notifications + My Tasks)
                    const assignees: string[] = [...(config.assignToUserIds || [])];
                    if (config.assignToRoles && config.assignToRoles.length > 0) {
                        const allUsers = useUserStore.getState().users;
                        for (const role of config.assignToRoles) {
                            const roleUsers = allUsers.filter(
                                (u) => u.role?.toLowerCase() === role.toLowerCase(),
                            );
                            assignees.push(...roleUsers.map((u) => u.id));
                        }
                    }

                    const unique = [...new Set(assignees)];
                    for (const userId of unique) {
                        await notificationService.createNotification(
                            userId,
                            `📋 Task: ${title}`,
                            description,
                            {
                                type: 'warning',
                                category: 'task',
                                priority: config.priority,
                                relatedId: String(data.id || ''),
                            },
                        );
                    }

                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Task created for ${unique.length} user(s): ${title}`,
                        executedAt,
                    };
                }

                case 'change_status': {
                    const targetStatus = String(action.config.targetStatus || '').trim();
                    const entityId = typeof data.id === 'string' ? data.id : '';
                    if (!targetStatus || !entityId) {
                        throw new Error('Status change requires a target status and entity ID.');
                    }

                    if (entity === 'checklist_item') {
                        const projectId = typeof data.projectId === 'string' ? data.projectId : '';
                        if (!projectId || !Object.values(ComplianceStatus).includes(targetStatus as ComplianceStatus)) {
                            throw new Error('Invalid checklist status or missing project ID.');
                        }
                        const { useProjectStore } = await import('@/stores/useProjectStore');
                        const project = useProjectStore.getState().projects.find((item) => item.id === projectId);
                        const checklistItem = project?.checklist.find((item) => item.id === entityId);
                        if (!checklistItem) throw new Error('Checklist item was not found in the active project.');
                        if (checklistItem.status !== targetStatus) {
                            await useProjectStore.getState().updateChecklistItem(
                                projectId,
                                entityId,
                                { status: targetStatus as ComplianceStatus },
                                { skipWorkflowEvaluation: true },
                            );
                        }
                    } else if (entity === 'incident') {
                        const statuses = ['Open', 'Under Investigation', 'Closed'] as const;
                        if (!statuses.includes(targetStatus as (typeof statuses)[number])) {
                            throw new Error('Invalid incident status.');
                        }
                        const { useAppStore } = await import('@/stores/useAppStore');
                        const report = useAppStore.getState().incidentReports.find((item) => item.id === entityId);
                        if (!report) throw new Error('Incident was not found in the active organization.');
                        if (report.status !== targetStatus) {
                            await useAppStore.getState().updateIncidentReport(
                                { ...report, status: targetStatus as (typeof statuses)[number] },
                                { skipWorkflowEvaluation: true },
                            );
                        }
                    } else if (entity === 'risk') {
                        const statuses = ['Open', 'Mitigated', 'Closed'] as const;
                        if (!statuses.includes(targetStatus as (typeof statuses)[number])) {
                            throw new Error('Invalid risk status.');
                        }
                        const { useAppStore } = await import('@/stores/useAppStore');
                        const risk = useAppStore.getState().risks.find((item) => item.id === entityId);
                        if (!risk) throw new Error('Risk was not found in the active organization.');
                        if (risk.status !== targetStatus) {
                            await useAppStore.getState().updateRisk({
                                ...risk,
                                status: targetStatus as (typeof statuses)[number],
                            });
                        }
                    } else if (entity === 'project') {
                        if (!Object.values(ProjectStatus).includes(targetStatus as ProjectStatus)) {
                            throw new Error('Invalid project status.');
                        }
                        const { useProjectStore } = await import('@/stores/useProjectStore');
                        const project = useProjectStore.getState().projects.find((item) => item.id === entityId);
                        if (!project) throw new Error('Project was not found in the active organization.');
                        if (project.status !== targetStatus) {
                            await useProjectStore.getState().updateProject({
                                ...project,
                                status: targetStatus as ProjectStatus,
                            });
                        }
                    } else if (entity === 'capa') {
                        if (!Object.values(ProjectStatus).includes(targetStatus as ProjectStatus)) {
                            throw new Error('Invalid CAPA status.');
                        }
                        const projectId = typeof data.projectId === 'string' ? data.projectId : '';
                        if (projectId) {
                            const { useProjectStore } = await import('@/stores/useProjectStore');
                            const project = useProjectStore.getState().projects.find((item) => item.id === projectId);
                            const capa = project?.capaReports?.find((item) => item.id === entityId);
                            if (!capa) throw new Error('CAPA was not found in the active project.');
                            if (capa.status !== targetStatus) {
                                await useProjectStore.getState().updateCapa(projectId, {
                                    ...capa,
                                    status: targetStatus as ProjectStatus,
                                });
                            }
                        } else {
                            const capaService = await import('@/services/capaService');
                            const capa = (await capaService.getCAPAReports()).find((item) => item.id === entityId);
                            if (!capa) throw new Error('CAPA was not found in the active organization.');
                            if (capa.status !== targetStatus) {
                                await capaService.updateCAPAReport({
                                    ...capa,
                                    status: targetStatus as ProjectStatus,
                                });
                            }
                        }
                    } else {
                        throw new Error(`Status changes are not supported for ${entity}.`);
                    }

                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Updated ${entity} status to ${targetStatus}.`,
                        executedAt,
                    };
                }

                case 'assign_user': {
                    const assignee = this.resolveSingleAssignee(action.config, data);
                    const entityId = typeof data.id === 'string' ? data.id : '';
                    if (!entityId) throw new Error('Assignment requires an entity ID.');

                    if (entity === 'checklist_item') {
                        const projectId = typeof data.projectId === 'string' ? data.projectId : '';
                        const { useProjectStore } = await import('@/stores/useProjectStore');
                        const project = useProjectStore.getState().projects.find((item) => item.id === projectId);
                        const checklistItem = project?.checklist.find((item) => item.id === entityId);
                        if (!projectId || !checklistItem) throw new Error('Checklist item was not found in the active project.');
                        await useProjectStore.getState().updateChecklistItem(
                            projectId,
                            entityId,
                            { assignedTo: assignee.id },
                            { skipWorkflowEvaluation: true },
                        );
                    } else if (entity === 'incident') {
                        const { useAppStore } = await import('@/stores/useAppStore');
                        const report = useAppStore.getState().incidentReports.find((item) => item.id === entityId);
                        if (!report) throw new Error('Incident was not found in the active organization.');
                        await useAppStore.getState().updateIncidentReport(
                            { ...report, investigatorId: assignee.id },
                            { skipWorkflowEvaluation: true },
                        );
                    } else if (entity === 'risk') {
                        const { useAppStore } = await import('@/stores/useAppStore');
                        const risk = useAppStore.getState().risks.find((item) => item.id === entityId);
                        if (!risk) throw new Error('Risk was not found in the active organization.');
                        await useAppStore.getState().updateRisk({ ...risk, ownerId: assignee.id });
                    } else if (entity === 'capa') {
                        const projectId = typeof data.projectId === 'string' ? data.projectId : '';
                        if (projectId) {
                            const { useProjectStore } = await import('@/stores/useProjectStore');
                            const project = useProjectStore.getState().projects.find((item) => item.id === projectId);
                            const capa = project?.capaReports?.find((item) => item.id === entityId);
                            if (!capa) throw new Error('CAPA was not found in the active project.');
                            await useProjectStore.getState().updateCapa(projectId, {
                                ...capa,
                                assignedTo: assignee.id,
                            });
                        } else {
                            const capaService = await import('@/services/capaService');
                            const capa = (await capaService.getCAPAReports()).find((item) => item.id === entityId);
                            if (!capa) throw new Error('CAPA was not found in the active organization.');
                            await capaService.updateCAPAReport({ ...capa, assignedTo: assignee.id });
                        }
                    } else {
                        throw new Error(`User assignment is not supported for ${entity}.`);
                    }

                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Assigned ${entity} to ${assignee.name}.`,
                        executedAt,
                    };
                }

                case 'create_capa': {
                    const title = this.resolveTokens(
                        String(action.config.title || `CAPA: ${data.description || data.item || data.id || ''}`),
                        data,
                    ).trim();
                    const description = this.resolveTokens(
                        String(action.config.description || data.description || title),
                        data,
                    ).trim();
                    if (!title) throw new Error('CAPA creation requires a title.');
                    const assignee = this.resolveOptionalAssignee(action.config, data);
                    const projectId = typeof data.projectId === 'string' ? data.projectId : '';

                    if (entity === 'checklist_item') {
                        const checklistItemId = typeof data.id === 'string' ? data.id : '';
                        if (!projectId || !checklistItemId) {
                            throw new Error('Checklist CAPA creation requires a project and checklist item.');
                        }
                        const { useProjectStore } = await import('@/stores/useProjectStore');
                        await useProjectStore.getState().addCapaReport(
                            projectId,
                            checklistItemId,
                            {
                                title,
                                description,
                                assignedTo: assignee?.id,
                            },
                            { skipWorkflowEvaluation: true },
                        );
                    } else if (entity === 'incident') {
                        const incidentId = typeof data.id === 'string' ? data.id : '';
                        if (!incidentId) throw new Error('Incident CAPA creation requires an incident ID.');
                        const capaService = await import('@/services/capaService');
                        const now = new Date().toISOString();
                        const created = await capaService.addCAPAReport({
                            type: 'CAPA',
                            title,
                            description,
                            checklistItemId: '',
                            sourceIncidentId: incidentId,
                            assignedTo: assignee?.id,
                            rootCause: '',
                            correctiveAction: '',
                            status: ProjectStatus.InProgress,
                            createdAt: now,
                            updatedAt: now,
                        });
                        return {
                            actionId: action.id,
                            actionType: action.type,
                            status: 'completed' as ExecutionStatus,
                            message: `Created CAPA ${created.id} for incident ${incidentId}.`,
                            executedAt,
                        };
                    } else {
                        throw new Error(`CAPA creation is not supported for ${entity}.`);
                    }

                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Created CAPA: ${title}.`,
                        executedAt,
                    };
                }

                case 'escalate': {
                    const msg = this.resolveTokens(
                        String((action.config as Record<string, unknown>).message || ''),
                        data,
                    );
                    const roles = (action.config as Record<string, unknown>).escalateToRoles as string[] || ['Admin'];
                    const allUsers = useUserStore.getState().users;
                    const targets = allUsers.filter((u) =>
                        roles.some((r) => u.role?.toLowerCase() === r.toLowerCase()),
                    );

                    for (const user of targets) {
                        await notificationService.createNotification(
                            user.id,
                            '⚡ Escalation',
                            msg,
                            {
                                type: 'error',
                                category: 'system',
                                priority: 'critical',
                                relatedId: String(data.id || ''),
                            },
                        );
                    }

                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Escalated to ${targets.length} user(s)`,
                        executedAt,
                    };
                }

                case 'add_comment': {
                    if (entity !== 'checklist_item') {
                        throw new Error(`Comments are not supported for ${entity}.`);
                    }
                    const projectId = typeof data.projectId === 'string' ? data.projectId : '';
                    const checklistItemId = typeof data.id === 'string' ? data.id : '';
                    const comment = this.resolveTokens(String(action.config.comment || ''), data).trim();
                    if (!projectId || !checklistItemId || !comment) {
                        throw new Error('Comment action requires a project, checklist item, and comment.');
                    }
                    const { useProjectStore } = await import('@/stores/useProjectStore');
                    await useProjectStore.getState().addComment(projectId, checklistItemId, comment);
                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'completed' as ExecutionStatus,
                        message: `Added a comment to checklist item ${checklistItemId}.`,
                        executedAt,
                    };
                }

                default:
                    return {
                        actionId: action.id,
                        actionType: action.type,
                        status: 'skipped' as ExecutionStatus,
                        message: `Action type "${action.type}" not yet implemented`,
                        executedAt,
                    };
            }
        } catch (error) {
            return {
                actionId: action.id,
                actionType: action.type,
                status: 'failed' as ExecutionStatus,
                message: error instanceof Error ? error.message : String(error),
                executedAt,
            };
        }
    }

    // ── Token Resolution ──────────────────────────────────────

    private resolveOptionalAssignee(
        config: Record<string, unknown>,
        data: Record<string, unknown>,
    ): { id: string; name: string } | undefined {
        const userIds = Array.isArray(config.userIds)
            ? config.userIds.filter((value): value is string => typeof value === 'string')
            : [];
        const roles = Array.isArray(config.roles)
            ? config.roles.filter((value): value is string => typeof value === 'string')
            : Array.isArray(config.assignToRoles)
                ? config.assignToRoles.filter((value): value is string => typeof value === 'string')
                : [];
        if (userIds.length === 0 && roles.length === 0) return undefined;

        const { currentUser, users } = useUserStore.getState();
        const organizationId =
            typeof data.organizationId === 'string'
                ? data.organizationId
                : currentUser?.organizationId;
        const candidates = users.filter((user) => {
            if (organizationId && user.organizationId !== organizationId) return false;
            return (
                userIds.includes(user.id) ||
                roles.some((role) => role.toLowerCase() === String(user.role).toLowerCase())
            );
        });
        const uniqueCandidates = [...new Map(candidates.map((user) => [user.id, user])).values()];
        if (uniqueCandidates.length !== 1) {
            throw new Error(
                uniqueCandidates.length === 0
                    ? 'Workflow assignment did not resolve to an active user in this organization.'
                    : 'Workflow assignment resolved to multiple users; configure exactly one user or a role with one member.',
            );
        }

        const assignee = uniqueCandidates[0];
        return { id: assignee.id, name: assignee.name || assignee.id };
    }

    private resolveSingleAssignee(
        config: Record<string, unknown>,
        data: Record<string, unknown>,
    ): { id: string; name: string } {
        const assignee = this.resolveOptionalAssignee(config, data);
        if (!assignee) {
            throw new Error('User assignment requires a selected user or role.');
        }
        return assignee;
    }

    /** Replace {{entity.field}} tokens with actual values from data */
    private resolveTokens(template: string, data: Record<string, unknown>): string {
        return template.replace(/\{\{entity\.(\w+(?:\.\w+)*)\}\}/g, (_match, field: string) => {
            const value = this.resolveField(field, data);
            return value !== undefined && value !== null ? String(value) : '';
        });
    }
}

// Singleton export
export const workflowEngine = new WorkflowEngine();

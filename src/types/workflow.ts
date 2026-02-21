/**
 * Workflow Automation Types
 *
 * Defines the complete type system for the visual workflow builder,
 * rule engine, and automation execution.
 */

import { UserRole } from './index';

// ── Trigger Types ─────────────────────────────────────────

export type TriggerEntity =
    | 'document'
    | 'project'
    | 'checklist_item'
    | 'capa'
    | 'pdca_cycle'
    | 'incident'
    | 'risk'
    | 'audit'
    | 'training'
    | 'task';

export type TriggerEvent =
    | 'created'
    | 'updated'
    | 'status_changed'
    | 'overdue'
    | 'assigned'
    | 'completed'
    | 'approved'
    | 'rejected'
    | 'escalated'
    | 'stage_changed';

export interface WorkflowTrigger {
    entity: TriggerEntity;
    event: TriggerEvent;
    /** Optional filter: only fire when the field matches a specific value */
    fieldFilters?: WorkflowCondition[];
}

// ── Conditions ────────────────────────────────────────────

export type ConditionOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty'
    | 'in_list';

export interface WorkflowCondition {
    field: string;
    operator: ConditionOperator;
    value: string | number | boolean | string[];
}

export type ConditionLogic = 'AND' | 'OR';

export interface WorkflowConditionGroup {
    logic: ConditionLogic;
    conditions: WorkflowCondition[];
}

// ── Actions ───────────────────────────────────────────────

export type ActionType =
    | 'send_notification'
    | 'assign_user'
    | 'change_status'
    | 'create_task'
    | 'create_capa'
    | 'send_email_digest'
    | 'add_comment'
    | 'set_field'
    | 'escalate'
    | 'start_approval_chain'
    | 'ai_generate';

export interface WorkflowAction {
    id: string;
    type: ActionType;
    /** Action-specific config — each type has its own shape */
    config: Record<string, unknown>;
    /** Delay before executing (in minutes). 0 = immediate */
    delayMinutes: number;
    /** Order of execution within the workflow step */
    order: number;
}

// ── Notification Action Config ────────────────────────────

export interface NotifyActionConfig {
    recipientRoles?: UserRole[];
    recipientUserIds?: string[];
    notifyDepartmentHead?: boolean;
    notifySupervisor?: boolean;
    priority: 'low' | 'normal' | 'high' | 'critical';
    title: string;
    message: string;
    /** Dynamic tokens like {{entity.name}}, {{entity.status}} */
    useTokens?: boolean;
}

// ── Status Change Action Config ───────────────────────────

export interface StatusChangeActionConfig {
    targetStatus: string;
}

// ── Task Creation Action Config ───────────────────────────

export interface CreateTaskActionConfig {
    title: string;
    description: string;
    assignToRoles?: UserRole[];
    assignToUserIds?: string[];
    dueDaysFromTrigger: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
}

// ── Approval Chain Action Config ──────────────────────────

export interface ApprovalChainActionConfig {
    steps: {
        step: number;
        reviewerRole?: UserRole;
        reviewerUserId?: string;
        autoApproveAfterDays?: number;
    }[];
}

// ── Workflow Definition ───────────────────────────────────

export type WorkflowStatus = 'active' | 'paused' | 'draft' | 'archived';

export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    /** The trigger that starts this workflow */
    trigger: WorkflowTrigger;
    /** Conditions that must all be true for the workflow to proceed */
    conditionGroup: WorkflowConditionGroup;
    /** Actions to execute when triggered and conditions pass */
    actions: WorkflowAction[];
    /** Status: active workflows are evaluated, paused/draft are not */
    status: WorkflowStatus;
    /** Who created this workflow */
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    /** Execution statistics */
    executionCount: number;
    lastExecutedAt?: string;
    /** Category for organization */
    category: 'compliance' | 'document' | 'quality' | 'safety' | 'training' | 'custom';
    /** Whether this is a system-provided template */
    isTemplate: boolean;
}

// ── Workflow Execution Log ────────────────────────────────

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowExecutionLog {
    id: string;
    workflowId: string;
    workflowName: string;
    triggeredBy: string; // entity type + event
    triggerEntityId: string;
    startedAt: string;
    completedAt?: string;
    status: ExecutionStatus;
    /** Per-action results */
    actionResults: {
        actionId: string;
        actionType: ActionType;
        status: ExecutionStatus;
        message?: string;
        executedAt: string;
    }[];
    error?: string;
}

// ── Visual Builder Node Types ─────────────────────────────

export type NodeType = 'trigger' | 'condition' | 'action';

export interface WorkflowNode {
    id: string;
    type: NodeType;
    label: string;
    /** Position for visual rendering */
    x: number;
    y: number;
    /** Configuration data associated with this node */
    data: WorkflowTrigger | WorkflowConditionGroup | WorkflowAction;
}

// ── Preset Templates ──────────────────────────────────────

export const WORKFLOW_TEMPLATES: Omit<WorkflowDefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecutedAt'>[] = [
    {
        name: 'Document Approval Chain',
        description: 'When a document goes Under Review, route through an approval chain and notify the author on completion.',
        trigger: { entity: 'document', event: 'status_changed', fieldFilters: [{ field: 'status', operator: 'equals', value: 'Under Review' }] },
        conditionGroup: { logic: 'AND', conditions: [] },
        actions: [
            { id: 'a1', type: 'send_notification', config: { recipientRoles: ['ProjectLead'], priority: 'high', title: 'Document Pending Approval', message: 'A document requires your approval: {{entity.title}}' } as NotifyActionConfig, delayMinutes: 0, order: 1 },
            { id: 'a2', type: 'start_approval_chain', config: { steps: [{ step: 1, reviewerRole: 'ProjectLead' }, { step: 2, reviewerRole: 'Admin', autoApproveAfterDays: 7 }] } as ApprovalChainActionConfig, delayMinutes: 0, order: 2 },
        ],
        status: 'draft',
        category: 'document',
        isTemplate: true,
    },
    {
        name: 'Non-Compliant Escalation',
        description: 'When a checklist item is marked Non-Compliant, create a CAPA task and notify quality leadership.',
        trigger: { entity: 'checklist_item', event: 'status_changed', fieldFilters: [{ field: 'status', operator: 'equals', value: 'Non-Compliant' }] },
        conditionGroup: { logic: 'AND', conditions: [] },
        actions: [
            { id: 'a1', type: 'send_notification', config: { recipientRoles: ['Admin', 'ProjectLead'], priority: 'critical', title: '⚠️ Non-Compliance Detected', message: 'A checklist item has been marked Non-Compliant: {{entity.item}}' } as NotifyActionConfig, delayMinutes: 0, order: 1 },
            { id: 'a2', type: 'create_task', config: { title: 'Investigate: {{entity.item}}', description: 'Non-compliant item requires corrective action.', assignToRoles: ['ProjectLead'], dueDaysFromTrigger: 7, priority: 'high' } as CreateTaskActionConfig, delayMinutes: 0, order: 2 },
        ],
        status: 'draft',
        category: 'compliance',
        isTemplate: true,
    },
    {
        name: 'Overdue Task Reminder',
        description: 'When a task becomes overdue, send escalating reminders to the assignee and their manager.',
        trigger: { entity: 'task', event: 'overdue' },
        conditionGroup: { logic: 'AND', conditions: [{ field: 'status', operator: 'not_equals', value: 'Completed' }] },
        actions: [
            { id: 'a1', type: 'send_notification', config: { recipientRoles: [], priority: 'high', title: '⏰ Overdue Task', message: 'Your task "{{entity.title}}" is overdue. Please complete it as soon as possible.' } as NotifyActionConfig, delayMinutes: 0, order: 1 },
            { id: 'a2', type: 'escalate', config: { escalateToRoles: ['ProjectLead'], message: 'Task "{{entity.title}}" is overdue and requires attention.' }, delayMinutes: 1440, order: 2 },
        ],
        status: 'draft',
        category: 'quality',
        isTemplate: true,
    },
    {
        name: 'CAPA Auto-Create on Sentinel',
        description: 'Automatically create a CAPA when a Sentinel Event incident is reported.',
        trigger: { entity: 'incident', event: 'created', fieldFilters: [{ field: 'severity', operator: 'equals', value: 'Sentinel Event' }] },
        conditionGroup: { logic: 'AND', conditions: [] },
        actions: [
            { id: 'a1', type: 'create_capa', config: { title: 'CAPA: {{entity.description}}', assignToRoles: ['Admin'], priority: 'critical' }, delayMinutes: 0, order: 1 },
            { id: 'a2', type: 'send_notification', config: { recipientRoles: ['Admin'], priority: 'critical', title: '🚨 Sentinel Event — CAPA Created', message: 'A sentinel event has triggered automatic CAPA creation.' } as NotifyActionConfig, delayMinutes: 0, order: 2 },
        ],
        status: 'draft',
        category: 'safety',
        isTemplate: true,
    },
    {
        name: 'Training Overdue Alert',
        description: 'Notify when a training assignment is not completed by its due date.',
        trigger: { entity: 'training', event: 'overdue' },
        conditionGroup: { logic: 'AND', conditions: [{ field: 'status', operator: 'not_equals', value: 'Completed' }] },
        actions: [
            { id: 'a1', type: 'send_notification', config: { recipientRoles: [], notifyDepartmentHead: true, priority: 'high', title: '📚 Training Overdue', message: 'Training "{{entity.title}}" is past its due date. Please complete it promptly.' } as NotifyActionConfig, delayMinutes: 0, order: 1 },
        ],
        status: 'draft',
        category: 'training',
        isTemplate: true,
    },
    {
        name: 'PDCA Stage Gate Enforcement',
        description: 'When a PDCA cycle moves to a new stage, validate completion criteria and notify stakeholders.',
        trigger: { entity: 'pdca_cycle', event: 'stage_changed' },
        conditionGroup: { logic: 'AND', conditions: [] },
        actions: [
            { id: 'a1', type: 'send_notification', config: { recipientRoles: ['ProjectLead', 'Admin'], priority: 'normal', title: '🔄 PDCA Stage Transition', message: 'PDCA cycle "{{entity.title}}" has moved to stage: {{entity.currentStage}}' } as NotifyActionConfig, delayMinutes: 0, order: 1 },
        ],
        status: 'draft',
        category: 'quality',
        isTemplate: true,
    },
];

// ── Helper: Human-readable labels ─────────────────────────

export const TRIGGER_ENTITY_LABELS: Record<TriggerEntity, string> = {
    document: 'Document',
    project: 'Project',
    checklist_item: 'Checklist Item',
    capa: 'CAPA Report',
    pdca_cycle: 'PDCA Cycle',
    incident: 'Incident Report',
    risk: 'Risk Entry',
    audit: 'Audit',
    training: 'Training Program',
    task: 'Task',
};

export const TRIGGER_EVENT_LABELS: Record<TriggerEvent, string> = {
    created: 'Is Created',
    updated: 'Is Updated',
    status_changed: 'Status Changes',
    overdue: 'Becomes Overdue',
    assigned: 'Is Assigned',
    completed: 'Is Completed',
    approved: 'Is Approved',
    rejected: 'Is Rejected',
    escalated: 'Is Escalated',
    stage_changed: 'Stage Changes',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
    send_notification: 'Send Notification',
    assign_user: 'Assign User',
    change_status: 'Change Status',
    create_task: 'Create Task',
    create_capa: 'Create CAPA',
    send_email_digest: 'Send Email Digest',
    add_comment: 'Add Comment',
    set_field: 'Set Field Value',
    escalate: 'Escalate',
    start_approval_chain: 'Start Approval Chain',
    ai_generate: 'AI Generate Content',
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
    equals: 'Equals',
    not_equals: 'Does Not Equal',
    contains: 'Contains',
    greater_than: 'Greater Than',
    less_than: 'Less Than',
    is_empty: 'Is Empty',
    is_not_empty: 'Is Not Empty',
    in_list: 'Is In List',
};

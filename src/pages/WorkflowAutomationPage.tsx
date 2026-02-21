/**
 * Workflow Automation Page
 *
 * Hub for creating, managing, and monitoring workflow automations.
 * Features:
 *  - Workflow list with status badges and controls
 *  - Template gallery for quick-start workflows
 *  - Visual workflow builder modal (trigger → conditions → actions)
 *  - Execution log viewer with per-action status
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Modal, Input, TextArea, EmptyState } from "@/components/ui";
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseCircleIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@/components/icons";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import { useWorkflowStore } from "@/stores/useWorkflowStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  WorkflowDefinition,
  WorkflowExecutionLog,
  WorkflowAction,
  WorkflowCondition,
  WorkflowConditionGroup,
  TriggerEntity,
  TriggerEvent,
  ActionType,
  ConditionOperator,
  WorkflowCategory,
  TRIGGER_ENTITY_LABELS,
  TRIGGER_EVENT_LABELS,
  ACTION_TYPE_LABELS,
  CONDITION_OPERATOR_LABELS,
  WORKFLOW_TEMPLATES,
} from "@/types/workflow";

type WorkflowTab = "workflows" | "templates" | "logs";

// ── Status badge config ─────────────────────────────────────
const STATUS_STYLES = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const;

const CATEGORY_COLORS = {
  compliance:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  quality:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  safety: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  training:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
} as const;

const LOG_STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircleIcon className="h-4 w-4 text-emerald-500" />,
  failed: <XCircleIcon className="h-4 w-4 text-red-500" />,
  running: <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />,
  skipped: <MinusIcon className="h-4 w-4 text-gray-400" />,
};

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

// ── Sub-components ──────────────────────────────────────────

/** Stat card for top-level metrics */
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className={`rounded-xl border p-4 ${color} flex items-center gap-3`}>
    <div className="shrink-0">{icon}</div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  </div>
);

/** Collapsible execution log detail */
const ExecutionLogRow: React.FC<{ log: WorkflowExecutionLog }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {LOG_STATUS_ICONS[log.status] || LOG_STATUS_ICONS.skipped}
          <span className="font-medium truncate">{log.workflowName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {log.triggeredBy}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">
            {new Date(log.startedAt).toLocaleString()}
          </span>
          {expanded ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-900/50 space-y-2">
          <p className="text-xs text-gray-500">
            Entity ID:{" "}
            <span className="font-mono">{log.triggerEntityId || "—"}</span>
          </p>
          {log.error && (
            <p className="text-xs text-red-500 font-medium">{log.error}</p>
          )}
          <div className="space-y-1">
            {log.actionResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {LOG_STATUS_ICONS[r.status] || LOG_STATUS_ICONS.skipped}
                <span className="font-medium">{r.actionType}</span>
                <span className="text-gray-500 truncate">{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Workflow Builder State ───────────────────────────────────

interface BuilderState {
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerEntity: TriggerEntity;
  triggerEvent: TriggerEvent;
  conditionLogic: "AND" | "OR";
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

const INITIAL_BUILDER: BuilderState = {
  name: "",
  description: "",
  category: "general",
  triggerEntity: "document",
  triggerEvent: "status_changed",
  conditionLogic: "AND",
  conditions: [],
  actions: [],
};

// ── Main Page Component ─────────────────────────────────────

const WorkflowAutomationPage: React.FC = () => {
  const {
    workflows,
    executionLogs,
    loading,
    fetchWorkflows,
    fetchExecutionLogs,
    addWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
    initializeEngine,
    createFromTemplate,
  } = useWorkflowStore();

  const currentUser = useUserStore((s) => s.currentUser);

  const [activeTab, setActiveTab] = useState<WorkflowTab>("workflows");
  const [showBuilder, setShowBuilder] = useState(false);
  const [builder, setBuilder] = useState<BuilderState>({ ...INITIAL_BUILDER });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [aiModalTitle, setAiModalTitle] = useState("");

  // Initialize on mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  // ── Computed ────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      total: workflows.length,
      active: workflows.filter((w) => w.status === "active").length,
      paused: workflows.filter((w) => w.status === "paused").length,
      executions: executionLogs.length,
    }),
    [workflows, executionLogs],
  );

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const q = searchQuery.toLowerCase();
    return workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q),
    );
  }, [workflows, searchQuery]);

  // ── Builder Helpers ─────────────────────────────────────

  const addCondition = useCallback(() => {
    setBuilder((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          field: "",
          operator: "equals" as ConditionOperator,
          value: "",
        },
      ],
    }));
  }, []);

  const updateCondition = useCallback(
    (index: number, updates: Partial<WorkflowCondition>) => {
      setBuilder((prev) => ({
        ...prev,
        conditions: prev.conditions.map((c, i) =>
          i === index ? { ...c, ...updates } : c,
        ),
      }));
    },
    [],
  );

  const removeCondition = useCallback((index: number) => {
    setBuilder((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  }, []);

  const addAction = useCallback(() => {
    const newAction: WorkflowAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "send_notification",
      config: {
        title: "",
        message: "",
        recipientRoles: ["Admin"],
        priority: "normal",
      },
      delayMinutes: 0,
      order: builder.actions.length + 1,
    };
    setBuilder((prev) => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  }, [builder.actions.length]);

  const updateAction = useCallback(
    (index: number, updates: Partial<WorkflowAction>) => {
      setBuilder((prev) => ({
        ...prev,
        actions: prev.actions.map((a, i) =>
          i === index ? { ...a, ...updates } : a,
        ),
      }));
    },
    [],
  );

  const removeAction = useCallback((index: number) => {
    setBuilder((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  }, []);

  const resetBuilder = useCallback(() => {
    setBuilder({ ...INITIAL_BUILDER });
    setEditingId(null);
    setShowBuilder(false);
  }, []);

  const handleSaveWorkflow = useCallback(async () => {
    if (!builder.name.trim()) return;

    const now = new Date().toISOString();
    const conditionGroup: WorkflowConditionGroup = {
      logic: builder.conditionLogic,
      conditions: builder.conditions,
    };

    const workflowDef: WorkflowDefinition = {
      id:
        editingId ||
        `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: builder.name,
      description: builder.description,
      trigger: {
        entity: builder.triggerEntity,
        event: builder.triggerEvent,
        fieldFilters: [],
      },
      conditionGroup,
      actions: builder.actions,
      status: "draft",
      category: builder.category,
      isTemplate: false,
      createdBy: currentUser?.id || "system",
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    };

    await addWorkflow(workflowDef);
    resetBuilder();
  }, [builder, editingId, currentUser, addWorkflow, resetBuilder]);

  const handleEditWorkflow = useCallback((wf: WorkflowDefinition) => {
    setBuilder({
      name: wf.name,
      description: wf.description,
      category: wf.category,
      triggerEntity: wf.trigger.entity,
      triggerEvent: wf.trigger.event,
      conditionLogic: wf.conditionGroup.logic,
      conditions: wf.conditionGroup.conditions,
      actions: wf.actions,
    });
    setEditingId(wf.id);
    setShowBuilder(true);
  }, []);

  const handleDeleteWorkflow = useCallback(
    async (id: string) => {
      if (
        window.confirm("Delete this workflow? This action cannot be undone.")
      ) {
        await deleteWorkflow(id);
      }
    },
    [deleteWorkflow],
  );

  const handleCreateFromTemplate = useCallback(
    async (index: number) => {
      await createFromTemplate(index, currentUser?.id || "system");
    },
    [createFromTemplate, currentUser],
  );

  // ── AI: Suggest Workflow ────────────────────────────────
  const handleAISuggestWorkflow = useCallback(async () => {
    setAiLoading(true);
    try {
      const workflowSummary = workflows
        .map(
          (w) =>
            `"${w.name}" (${w.category}, ${w.status}, trigger: ${w.trigger.entity}→${w.trigger.event}, ${w.actions.length} actions)`,
        )
        .join("\n");

      const prompt = `You are a healthcare accreditation workflow automation expert. Analyze the current workflows and suggest new automations:

**Current Workflows (${workflows.length}):**
${workflowSummary || "None created yet"}

**Available Triggers:** document, project, checklist_item, capa, pdca_cycle, incident, risk, audit, training, task × created, updated, status_changed, overdue, assigned, completed, approved, rejected, escalated, stage_changed

**Available Actions:** send_notification, assign_user, change_status, create_task, create_capa, send_email_digest, add_comment, set_field, escalate, start_approval_chain, ai_generate

Provide:
1. **Gap Analysis** — What critical automations are missing for healthcare accreditation
2. **Top 5 Recommended Workflows** — Each with trigger, conditions, and actions
3. **Compliance Automations** — Workflows that ensure regulatory compliance
4. **Efficiency Gains** — Estimated time savings from each recommendation
5. **Implementation Priority** — Ordered by impact and urgency

Format in clear Markdown with structured details for each workflow.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalTitle("AI Workflow Suggestions");
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI workflow suggestion failed:", error);
    } finally {
      setAiLoading(false);
    }
  }, [workflows]);

  // ── AI: Analyze Execution Logs ──────────────────────────
  const handleAIAnalyzeLogs = useCallback(async () => {
    setAiLoading(true);
    try {
      const recentLogs = executionLogs.slice(0, 20);
      const logSummary = recentLogs
        .map(
          (l) =>
            `${l.workflowName}: ${l.status} (${l.actionResults.length} actions, ${l.error ? "error: " + l.error : "no errors"})`,
        )
        .join("\n");

      const statusCounts = {
        completed: executionLogs.filter((l) => l.status === "completed").length,
        failed: executionLogs.filter((l) => l.status === "failed").length,
        running: executionLogs.filter((l) => l.status === "running").length,
      };

      const prompt = `You are a healthcare workflow operations analyst. Analyze these workflow execution logs and provide insights:

**Execution Summary:**
- Total Executions: ${executionLogs.length}
- Completed: ${statusCounts.completed}
- Failed: ${statusCounts.failed}
- Running: ${statusCounts.running}

**Recent Executions (last 20):**
${logSummary || "No executions yet"}

Provide:
1. **Health Assessment** — Overall workflow health score (1-10)
2. **Failure Analysis** — Common failure patterns and root causes
3. **Performance Metrics** — Execution success rate and trends
4. **Bottlenecks** — Workflows that fail most or take longest
5. **Optimization Recommendations** — How to improve reliability
6. **Alert Triggers** — What should trigger immediate attention

Format in clear Markdown.`;

      const response = await aiAgentService.chat(prompt, false);
      setAiModalTitle("AI Execution Log Analysis");
      setAiModalContent(
        typeof response === "string" ? response : response.response || "",
      );
      setAiModalOpen(true);
    } catch (error) {
      console.error("AI log analysis failed:", error);
    } finally {
      setAiLoading(false);
    }
  }, [executionLogs]);

  // ── Tab navigation ──────────────────────────────────────

  const tabItems: {
    key: WorkflowTab;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
  }[] = [
    { key: "workflows", label: "Workflows", icon: BoltIcon },
    { key: "templates", label: "Templates", icon: SparklesIcon },
    { key: "logs", label: "Execution Logs", icon: ClockIcon },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BoltIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              Workflow Automation
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              Create automated rules with triggers, conditions &amp; actions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetBuilder();
              setShowBuilder(true);
            }}
            className="flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            Create Workflow
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAISuggestWorkflow}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            {aiLoading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SparklesIcon className="h-4 w-4" />
            )}
            AI Suggest
          </Button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Workflows"
          value={stats.total}
          icon={
            <BoltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          }
          color="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={
            <PlayIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          }
          color="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
        />
        <StatCard
          label="Paused"
          value={stats.paused}
          icon={
            <PauseCircleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          }
          color="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
        />
        <StatCard
          label="Executions"
          value={stats.executions}
          icon={
            <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          }
          color="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20"
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────── */}
      {activeTab === "workflows" && (
        <WorkflowList
          workflows={filteredWorkflows}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onEdit={handleEditWorkflow}
          onDelete={handleDeleteWorkflow}
          onToggle={toggleWorkflowStatus}
          loading={loading}
        />
      )}

      {activeTab === "templates" && (
        <TemplateGallery onUseTemplate={handleCreateFromTemplate} />
      )}

      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {executionLogs.length} execution
              {executionLogs.length !== 1 ? "s" : ""} recorded
            </p>
            {executionLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIAnalyzeLogs}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                {aiLoading ? (
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <SparklesIcon className="h-3.5 w-3.5" />
                )}
                AI Analyze Logs
              </Button>
            )}
          </div>
          <ExecutionLogList logs={executionLogs} />
        </div>
      )}

      {/* ── Builder Modal ──────────────────────────────────── */}
      {showBuilder && (
        <Modal
          isOpen={showBuilder}
          onClose={resetBuilder}
          title={editingId ? "Edit Workflow" : "Create Workflow"}
          size="4xl"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={resetBuilder}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveWorkflow}
                disabled={!builder.name.trim() || builder.actions.length === 0}
              >
                {editingId ? "Update" : "Create"} Workflow
              </Button>
            </div>
          }
        >
          <WorkflowBuilder
            builder={builder}
            setBuilder={setBuilder}
            addCondition={addCondition}
            updateCondition={updateCondition}
            removeCondition={removeCondition}
            addAction={addAction}
            updateAction={updateAction}
            removeAction={removeAction}
          />
        </Modal>
      )}

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        content={aiModalContent}
        type="improvements"
      />
    </div>
  );
};

// ── Workflow List Sub-component ────────────────────────────

const WorkflowList: React.FC<{
  workflows: WorkflowDefinition[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEdit: (wf: WorkflowDefinition) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  loading: boolean;
}> = ({
  workflows,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onToggle,
  loading,
}) => (
  <div className="space-y-4">
    <Input
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search workflows by name, description, or category..."
      className="max-w-xl"
    />

    {loading ? (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-lg"
          />
        ))}
      </div>
    ) : workflows.length === 0 ? (
      <EmptyState
        icon={<BoltIcon className="h-12 w-12 text-gray-400" />}
        title="No workflows yet"
        message="Create your first workflow or start from a template"
      />
    ) : (
      <div className="space-y-3">
        {workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            onEdit={() => onEdit(wf)}
            onDelete={() => onDelete(wf.id)}
            onToggle={() => onToggle(wf.id)}
          />
        ))}
      </div>
    )}
  </div>
);

// ── Workflow Card ──────────────────────────────────────────

const WorkflowCard: React.FC<{
  workflow: WorkflowDefinition;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}> = ({ workflow: wf, onEdit, onDelete, onToggle }) => (
  <div className="border rounded-xl p-4 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold dark:text-white truncate">
            {wf.name}
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[wf.status]}`}
          >
            {wf.status}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[wf.category] || CATEGORY_COLORS.general}`}
          >
            {wf.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {wf.description}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Trigger:{" "}
            <span className="font-medium">
              {TRIGGER_ENTITY_LABELS[wf.trigger.entity]}
            </span>{" "}
            →{" "}
            <span className="font-medium">
              {TRIGGER_EVENT_LABELS[wf.trigger.event]}
            </span>
          </span>
          <span>
            {wf.actions.length} action{wf.actions.length !== 1 ? "s" : ""}
          </span>
          <span>
            {wf.executionCount} execution{wf.executionCount !== 1 ? "s" : ""}
          </span>
          {wf.lastExecutedAt && (
            <span>
              Last: {new Date(wf.lastExecutedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={wf.status === "active" ? "Pause" : "Activate"}
        >
          {wf.status === "active" ? (
            <PauseCircleIcon className="h-5 w-5 text-amber-500" />
          ) : (
            <PlayIcon className="h-5 w-5 text-emerald-500" />
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Edit"
        >
          <PencilIcon className="h-5 w-5 text-blue-500" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-5 w-5 text-red-500" />
        </button>
      </div>
    </div>
  </div>
);

// ── Template Gallery ──────────────────────────────────────

const TemplateGallery: React.FC<{
  onUseTemplate: (index: number) => void;
}> = ({ onUseTemplate }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Quick-start with pre-configured workflow templates. Customize after
      creation.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {WORKFLOW_TEMPLATES.map((tpl, idx) => (
        <div
          key={idx}
          className="border rounded-xl p-4 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="h-5 w-5 text-brand-primary" />
            <h3 className="font-semibold dark:text-white text-sm">
              {tpl.name}
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 line-clamp-3">
            {tpl.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.general}`}
            >
              {tpl.category}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUseTemplate(idx)}
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Use
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {TRIGGER_ENTITY_LABELS[tpl.trigger.entity]} →{" "}
            {TRIGGER_EVENT_LABELS[tpl.trigger.event]} • {tpl.actions.length}{" "}
            action{tpl.actions.length !== 1 ? "s" : ""}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Execution Log List ────────────────────────────────────

const ExecutionLogList: React.FC<{
  logs: WorkflowExecutionLog[];
}> = ({ logs }) => (
  <div className="space-y-3">
    {logs.length === 0 ? (
      <EmptyState
        icon={<ClockIcon className="h-12 w-12 text-gray-400" />}
        title="No execution logs"
        message="Logs will appear here when workflows run"
      />
    ) : (
      logs.map((log) => <ExecutionLogRow key={log.id} log={log} />)
    )}
  </div>
);

// ── Workflow Builder Modal Content ────────────────────────

const WorkflowBuilder: React.FC<{
  builder: BuilderState;
  setBuilder: React.Dispatch<React.SetStateAction<BuilderState>>;
  addCondition: () => void;
  updateCondition: (index: number, updates: Partial<WorkflowCondition>) => void;
  removeCondition: (index: number) => void;
  addAction: () => void;
  updateAction: (index: number, updates: Partial<WorkflowAction>) => void;
  removeAction: (index: number) => void;
}> = ({
  builder,
  setBuilder,
  addCondition,
  updateCondition,
  removeCondition,
  addAction,
  updateAction,
  removeAction,
}) => {
  const entityOptions: TriggerEntity[] = [
    "document",
    "project",
    "checklist_item",
    "capa",
    "pdca_cycle",
    "incident",
    "risk",
    "audit",
    "training",
    "task",
  ];

  const eventOptions: TriggerEvent[] = [
    "created",
    "updated",
    "status_changed",
    "overdue",
    "assigned",
    "completed",
    "approved",
    "rejected",
    "escalated",
    "stage_changed",
  ];

  const actionTypes: ActionType[] = [
    "send_notification",
    "assign_user",
    "change_status",
    "create_task",
    "create_capa",
    "send_email_digest",
    "add_comment",
    "set_field",
    "escalate",
    "start_approval_chain",
    "ai_generate",
  ];

  const operatorOptions: ConditionOperator[] = [
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
    "in_list",
  ];

  const categoryOptions: WorkflowCategory[] = [
    "compliance",
    "quality",
    "safety",
    "training",
    "general",
  ];

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
      {/* ── Step 1: Basic Info ─────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center">
            1
          </span>
          Basic Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            value={builder.name}
            onChange={(e) =>
              setBuilder((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Workflow name"
          />
          <select
            value={builder.category}
            onChange={(e) =>
              setBuilder((p) => ({
                ...p,
                category: e.target.value as WorkflowCategory,
              }))
            }
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <TextArea
          value={builder.description}
          onChange={(e) =>
            setBuilder((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Description (optional)"
          className="mt-3"
          rows={2}
        />
      </section>

      {/* ── Step 2: Trigger ────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center">
            2
          </span>
          Trigger — When should this run?
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Entity
            </label>
            <select
              value={builder.triggerEntity}
              onChange={(e) =>
                setBuilder((p) => ({
                  ...p,
                  triggerEntity: e.target.value as TriggerEntity,
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary"
            >
              {entityOptions.map((e) => (
                <option key={e} value={e}>
                  {TRIGGER_ENTITY_LABELS[e]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Event
            </label>
            <select
              value={builder.triggerEvent}
              onChange={(e) =>
                setBuilder((p) => ({
                  ...p,
                  triggerEvent: e.target.value as TriggerEvent,
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary"
            >
              {eventOptions.map((e) => (
                <option key={e} value={e}>
                  {TRIGGER_EVENT_LABELS[e]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Step 3: Conditions ─────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center">
            3
          </span>
          Conditions (optional) — Only run if…
        </h3>
        {builder.conditions.length > 1 && (
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-gray-500">Logic:</label>
            <select
              value={builder.conditionLogic}
              onChange={(e) =>
                setBuilder((p) => ({
                  ...p,
                  conditionLogic: e.target.value as "AND" | "OR",
                }))
              }
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
            >
              <option value="AND">ALL conditions (AND)</option>
              <option value="OR">ANY condition (OR)</option>
            </select>
          </div>
        )}
        <div className="space-y-2">
          {builder.conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-wrap">
              <Input
                value={cond.field}
                onChange={(e) =>
                  updateCondition(idx, { field: e.target.value })
                }
                placeholder="Field (e.g. status)"
                className="w-32 text-xs"
              />
              <select
                value={cond.operator}
                onChange={(e) =>
                  updateCondition(idx, {
                    operator: e.target.value as ConditionOperator,
                  })
                }
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs"
              >
                {operatorOptions.map((op) => (
                  <option key={op} value={op}>
                    {CONDITION_OPERATOR_LABELS[op]}
                  </option>
                ))}
              </select>
              {!["is_empty", "is_not_empty"].includes(cond.operator) && (
                <Input
                  value={String(cond.value ?? "")}
                  onChange={(e) =>
                    updateCondition(idx, { value: e.target.value })
                  }
                  placeholder="Value"
                  className="w-32 text-xs"
                />
              )}
              <button
                type="button"
                onClick={() => removeCondition(idx)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={addCondition}
          className="mt-2 flex items-center gap-1 text-xs"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Condition
        </Button>
      </section>

      {/* ── Step 4: Actions ────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center">
            4
          </span>
          Actions — What should happen?
        </h3>
        <div className="space-y-3">
          {builder.actions.map((action, idx) => (
            <div
              key={action.id}
              className="border rounded-lg p-3 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    #{idx + 1}
                  </span>
                  <select
                    value={action.type}
                    onChange={(e) =>
                      updateAction(idx, {
                        type: e.target.value as ActionType,
                        config: getDefaultConfig(e.target.value as ActionType),
                      })
                    }
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs font-medium"
                  >
                    {actionTypes.map((at) => (
                      <option key={at} value={at}>
                        {ACTION_TYPE_LABELS[at]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeAction(idx)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <ActionConfigFields
                action={action}
                onUpdate={(updates) => updateAction(idx, updates)}
              />
              <div className="mt-2">
                <label className="text-xs text-gray-500">
                  Delay (minutes):
                </label>
                <Input
                  type="number"
                  value={String(action.delayMinutes)}
                  onChange={(e) =>
                    updateAction(idx, {
                      delayMinutes: Number(e.target.value) || 0,
                    })
                  }
                  className="w-24 text-xs mt-1"
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={addAction}
          className="mt-2 flex items-center gap-1 text-xs"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Action
        </Button>
      </section>
    </div>
  );
};

// ── Dynamic Action Config Fields ──────────────────────────

function getDefaultConfig(type: ActionType): Record<string, unknown> {
  switch (type) {
    case "send_notification":
      return {
        title: "",
        message: "",
        recipientRoles: ["Admin"],
        priority: "normal",
      };
    case "create_task":
      return {
        title: "",
        description: "",
        assignToRoles: ["Admin"],
        priority: "normal",
      };
    case "change_status":
      return { targetStatus: "" };
    case "escalate":
      return { message: "", escalateToRoles: ["Admin"] };
    case "add_comment":
      return { comment: "" };
    case "set_field":
      return { field: "", value: "" };
    case "assign_user":
      return { userIds: [], roles: ["Admin"] };
    default:
      return {};
  }
}

const ActionConfigFields: React.FC<{
  action: WorkflowAction;
  onUpdate: (updates: Partial<WorkflowAction>) => void;
}> = ({ action, onUpdate }) => {
  const config = (action.config || {}) as Record<string, unknown>;

  const updateConfig = (key: string, value: unknown) => {
    onUpdate({ config: { ...config, [key]: value } });
  };

  switch (action.type) {
    case "send_notification":
      return (
        <div className="space-y-2">
          <Input
            value={String(config.title || "")}
            onChange={(e) => updateConfig("title", e.target.value)}
            placeholder="Notification title (supports {{entity.name}} tokens)"
            className="text-xs"
          />
          <TextArea
            value={String(config.message || "")}
            onChange={(e) => updateConfig("message", e.target.value)}
            placeholder="Message body..."
            rows={2}
            className="text-xs"
          />
          <Input
            value={String(config.recipientRoles || "Admin")}
            onChange={(e) =>
              updateConfig(
                "recipientRoles",
                e.target.value.split(",").map((s: string) => s.trim()),
              )
            }
            placeholder="Recipient roles (comma-separated)"
            className="text-xs"
          />
          <select
            value={String(config.priority || "normal")}
            onChange={(e) => updateConfig("priority", e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      );

    case "create_task":
      return (
        <div className="space-y-2">
          <Input
            value={String(config.title || "")}
            onChange={(e) => updateConfig("title", e.target.value)}
            placeholder="Task title"
            className="text-xs"
          />
          <TextArea
            value={String(config.description || "")}
            onChange={(e) => updateConfig("description", e.target.value)}
            placeholder="Task description..."
            rows={2}
            className="text-xs"
          />
          <Input
            value={String(config.assignToRoles || "Admin")}
            onChange={(e) =>
              updateConfig(
                "assignToRoles",
                e.target.value.split(",").map((s: string) => s.trim()),
              )
            }
            placeholder="Assign to roles (comma-separated)"
            className="text-xs"
          />
        </div>
      );

    case "change_status":
      return (
        <Input
          value={String(config.targetStatus || "")}
          onChange={(e) => updateConfig("targetStatus", e.target.value)}
          placeholder="Target status value"
          className="text-xs"
        />
      );

    case "escalate":
      return (
        <div className="space-y-2">
          <TextArea
            value={String(config.message || "")}
            onChange={(e) => updateConfig("message", e.target.value)}
            placeholder="Escalation message..."
            rows={2}
            className="text-xs"
          />
          <Input
            value={String(config.escalateToRoles || "Admin")}
            onChange={(e) =>
              updateConfig(
                "escalateToRoles",
                e.target.value.split(",").map((s: string) => s.trim()),
              )
            }
            placeholder="Escalate to roles (comma-separated)"
            className="text-xs"
          />
        </div>
      );

    case "add_comment":
      return (
        <TextArea
          value={String(config.comment || "")}
          onChange={(e) => updateConfig("comment", e.target.value)}
          placeholder="Comment text (supports {{entity.name}} tokens)"
          rows={2}
          className="text-xs"
        />
      );

    case "set_field":
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={String(config.field || "")}
            onChange={(e) => updateConfig("field", e.target.value)}
            placeholder="Field name"
            className="text-xs"
          />
          <Input
            value={String(config.value || "")}
            onChange={(e) => updateConfig("value", e.target.value)}
            placeholder="New value"
            className="text-xs"
          />
        </div>
      );

    case "ai_generate":
      return (
        <div className="space-y-2">
          <TextArea
            value={String(config.promptTemplate || "")}
            onChange={(e) => updateConfig("promptTemplate", e.target.value)}
            placeholder="AI prompt template (use {{entity.name}}, {{entity.status}} tokens)..."
            rows={3}
            className="text-xs"
          />
          <Input
            value={String(config.targetField || "")}
            onChange={(e) => updateConfig("targetField", e.target.value)}
            placeholder="Target field to populate (e.g., summary, recommendation)"
            className="text-xs"
          />
          <select
            value={String(config.outputFormat || "text")}
            onChange={(e) => updateConfig("outputFormat", e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          >
            <option value="text">Plain Text</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>
          <div className="flex items-center gap-2 mt-1">
            <SparklesIcon className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs text-purple-600 dark:text-purple-400">
              AI will generate content using the prompt when this action fires
            </span>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-xs text-gray-400 italic">
          Configuration for &quot;{ACTION_TYPE_LABELS[action.type]}&quot; —
          additional fields coming soon.
        </p>
      );
  }
};

export default WorkflowAutomationPage;

/**
 * Workflow Automation Store
 *
 * Zustand store that manages WorkflowDefinitions and ExecutionLogs
 * with Firestore persistence. Integrates with the WorkflowEngine
 * singleton for trigger evaluation and action execution.
 */

import { create } from 'zustand';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import {
    WorkflowDefinition,
    WorkflowExecutionLog,
    WORKFLOW_TEMPLATES,
} from '@/types/workflow';
import { workflowEngine } from '@/services/workflowEngine';
import { logger } from '@/services/logger';

// ── Firestore collection names ──────────────────────────────
const WORKFLOWS_COLLECTION = 'workflowDefinitions';
const EXECUTION_LOGS_COLLECTION = 'workflowExecutionLogs';

// ── Store Interface ─────────────────────────────────────────
interface WorkflowState {
    workflows: WorkflowDefinition[];
    executionLogs: WorkflowExecutionLog[];
    loading: boolean;
    error: string | null;

    // Initialization
    fetchWorkflows: () => Promise<void>;
    fetchExecutionLogs: (limit?: number) => Promise<void>;
    initializeEngine: () => Promise<void>;

    // CRUD
    addWorkflow: (workflow: WorkflowDefinition) => Promise<void>;
    updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;
    toggleWorkflowStatus: (id: string) => Promise<void>;

    // Template creation
    createFromTemplate: (templateIndex: number, createdBy: string) => Promise<WorkflowDefinition | null>;

    // Log management
    addExecutionLog: (log: WorkflowExecutionLog) => Promise<void>;
    clearOldLogs: (daysToKeep?: number) => Promise<void>;

    // Engine integration
    getActiveWorkflowCount: () => number;
    getTemplates: () => typeof WORKFLOW_TEMPLATES;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    workflows: [],
    executionLogs: [],
    loading: false,
    error: null,

    // ── Initialization ──────────────────────────────────────

    fetchWorkflows: async () => {
        set({ loading: true, error: null });
        try {
            const ref = collection(db, WORKFLOWS_COLLECTION);
            const q = query(ref, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const workflows = snapshot.docs.map(
                (d) => ({ ...d.data(), id: d.id }) as WorkflowDefinition,
            );
            set({ workflows, loading: false });
            logger.info(`[WorkflowStore] Fetched ${workflows.length} workflows`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.warn(`[WorkflowStore] Failed to fetch workflows: ${msg}`);
            set({ loading: false, error: msg });
        }
    },

    fetchExecutionLogs: async (logLimit = 100) => {
        try {
            const ref = collection(db, EXECUTION_LOGS_COLLECTION);
            const q = query(ref, orderBy('startedAt', 'desc'), firestoreLimit(logLimit));
            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(
                (d) => ({ ...d.data(), id: d.id }) as WorkflowExecutionLog,
            );
            set({ executionLogs: logs });
        } catch (error) {
            logger.warn(`[WorkflowStore] Failed to fetch execution logs: ${error}`);
        }
    },

    initializeEngine: async () => {
        await get().fetchWorkflows();
        const { workflows } = get();
        workflowEngine.initialize(workflows);
        await get().fetchExecutionLogs();
        logger.info('[WorkflowStore] Engine initialized');
    },

    // ── CRUD ────────────────────────────────────────────────

    addWorkflow: async (workflow: WorkflowDefinition) => {
        try {
            // Persist to Firestore (let Firestore generate the ID)
            const ref = collection(db, WORKFLOWS_COLLECTION);
            const docRef = await addDoc(ref, {
                ...workflow,
                id: undefined, // Will be replaced on read with doc.id
            });

            const saved: WorkflowDefinition = { ...workflow, id: docRef.id };

            // Update local state + engine
            set((state) => ({ workflows: [saved, ...state.workflows] }));
            workflowEngine.addWorkflow(saved);

            logger.info(`[WorkflowStore] Added workflow: ${saved.name}`);
        } catch (error) {
            logger.error(`[WorkflowStore] Failed to add workflow: ${error}`);
            throw error;
        }
    },

    updateWorkflow: async (id: string, updates: Partial<WorkflowDefinition>) => {
        try {
            const docRef = doc(db, WORKFLOWS_COLLECTION, id);
            const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
            await updateDoc(docRef, cleanUpdates);

            set((state) => ({
                workflows: state.workflows.map((w) =>
                    w.id === id ? { ...w, ...cleanUpdates } : w,
                ),
            }));

            workflowEngine.updateWorkflow(id, cleanUpdates);
            logger.info(`[WorkflowStore] Updated workflow: ${id}`);
        } catch (error) {
            logger.error(`[WorkflowStore] Failed to update workflow: ${error}`);
            throw error;
        }
    },

    deleteWorkflow: async (id: string) => {
        try {
            const docRef = doc(db, WORKFLOWS_COLLECTION, id);
            await deleteDoc(docRef);

            set((state) => ({
                workflows: state.workflows.filter((w) => w.id !== id),
            }));

            workflowEngine.deleteWorkflow(id);
            logger.info(`[WorkflowStore] Deleted workflow: ${id}`);
        } catch (error) {
            logger.error(`[WorkflowStore] Failed to delete workflow: ${error}`);
            throw error;
        }
    },

    toggleWorkflowStatus: async (id: string) => {
        const workflow = get().workflows.find((w) => w.id === id);
        if (!workflow) return;

        const newStatus = workflow.status === 'active' ? 'paused' : 'active';
        await get().updateWorkflow(id, { status: newStatus });
        workflowEngine.toggleWorkflowStatus(id);
    },

    // ── Template Creation ───────────────────────────────────

    createFromTemplate: async (templateIndex: number, createdBy: string) => {
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

        await get().addWorkflow(workflow);
        return workflow;
    },

    // ── Log Management ──────────────────────────────────────

    addExecutionLog: async (log: WorkflowExecutionLog) => {
        try {
            const ref = collection(db, EXECUTION_LOGS_COLLECTION);
            await addDoc(ref, log);

            set((state) => ({
                executionLogs: [log, ...state.executionLogs].slice(0, 200),
            }));
        } catch (error) {
            logger.warn(`[WorkflowStore] Failed to persist execution log: ${error}`);
            // Still add to local state
            set((state) => ({
                executionLogs: [log, ...state.executionLogs].slice(0, 200),
            }));
        }
    },

    clearOldLogs: async (daysToKeep = 30) => {
        const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
        set((state) => ({
            executionLogs: state.executionLogs.filter((l) => l.startedAt > cutoff),
        }));
    },

    // ── Helpers ─────────────────────────────────────────────

    getActiveWorkflowCount: () => {
        return get().workflows.filter((w) => w.status === 'active').length;
    },

    getTemplates: () => WORKFLOW_TEMPLATES,
}));

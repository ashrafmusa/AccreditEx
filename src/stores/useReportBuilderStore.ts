/**
 * Report Builder Store
 *
 * Zustand store for managing custom report definitions
 * with Firestore persistence and template instantiation.
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
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { getAuthInstance } from '@/firebase/firebaseConfig';
import {
    ReportDefinition,
    REPORT_TEMPLATES,
} from '@/types/reportBuilder';

// ── Firestore collection ────────────────────────────────────
const COLLECTION = 'reportDefinitions';

// ── Store Interface ─────────────────────────────────────────
interface ReportBuilderState {
    reports: ReportDefinition[];
    activeReport: ReportDefinition | null;
    loading: boolean;
    error: string | null;

    // Initialization
    fetchReports: () => Promise<void>;

    // CRUD
    createReport: (report: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateReport: (id: string, updates: Partial<ReportDefinition>) => Promise<void>;
    deleteReport: (id: string) => Promise<void>;
    duplicateReport: (id: string) => Promise<string>;

    // Template
    createFromTemplate: (templateId: string, name?: string) => Promise<string>;

    // Active selection
    setActiveReport: (report: ReportDefinition | null) => void;

    // Generation tracking
    incrementGenerationCount: (id: string) => Promise<void>;
}

// ── Store ───────────────────────────────────────────────────
export const useReportBuilderStore = create<ReportBuilderState>((set, get) => ({
    reports: [],
    activeReport: null,
    loading: false,
    error: null,

    // ── Fetch from Firestore ────────────────────────────────
    fetchReports: async () => {
        set({ loading: true, error: null });
        try {
            const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
            const snap = await getDocs(q);
            const reports: ReportDefinition[] = snap.docs.map((d) => ({
                ...(d.data() as Omit<ReportDefinition, 'id'>),
                id: d.id,
            }));
            set({ reports, loading: false });
        } catch (err) {
            console.error('[ReportBuilderStore] fetchReports error:', err);
            set({ error: 'Failed to load reports', loading: false });
        }
    },

    // ── Create ──────────────────────────────────────────────
    createReport: async (report) => {
        const now = new Date().toISOString();
        const auth = getAuthInstance();
        const data: Omit<ReportDefinition, 'id'> = {
            ...report,
            createdBy: report.createdBy || auth.currentUser?.uid || 'unknown',
            createdAt: now,
            updatedAt: now,
            generationCount: 0,
        };
        try {
            const ref = await addDoc(collection(db, COLLECTION), data);
            const full: ReportDefinition = { ...data, id: ref.id };
            set((s) => ({ reports: [full, ...s.reports] }));
            return ref.id;
        } catch (err) {
            console.error('[ReportBuilderStore] createReport error:', err);
            throw err;
        }
    },

    // ── Update ──────────────────────────────────────────────
    updateReport: async (id, updates) => {
        try {
            const patch = { ...updates, updatedAt: new Date().toISOString() };
            await updateDoc(doc(db, COLLECTION, id), patch);
            set((s) => ({
                reports: s.reports.map((r) => (r.id === id ? { ...r, ...patch } : r)),
                activeReport: s.activeReport?.id === id ? { ...s.activeReport, ...patch } : s.activeReport,
            }));
        } catch (err) {
            console.error('[ReportBuilderStore] updateReport error:', err);
            throw err;
        }
    },

    // ── Delete ──────────────────────────────────────────────
    deleteReport: async (id) => {
        try {
            await deleteDoc(doc(db, COLLECTION, id));
            set((s) => ({
                reports: s.reports.filter((r) => r.id !== id),
                activeReport: s.activeReport?.id === id ? null : s.activeReport,
            }));
        } catch (err) {
            console.error('[ReportBuilderStore] deleteReport error:', err);
            throw err;
        }
    },

    // ── Duplicate ───────────────────────────────────────────
    duplicateReport: async (id) => {
        const source = get().reports.find((r) => r.id === id);
        if (!source) throw new Error('Report not found');
        const newName = `${source.name} (Copy)`;
        return get().createReport({
            ...source,
            name: newName,
            generationCount: 0,
        });
    },

    // ── Template Instantiation ──────────────────────────────
    createFromTemplate: async (templateId, name?) => {
        const tpl = REPORT_TEMPLATES.find((t) => t.id === templateId);
        if (!tpl) throw new Error('Template not found');
        return get().createReport({
            ...tpl,
            name: name || tpl.name,
        });
    },

    // ── Active selection ────────────────────────────────────
    setActiveReport: (report) => set({ activeReport: report }),

    // ── Generation tracking ─────────────────────────────────
    incrementGenerationCount: async (id) => {
        const report = get().reports.find((r) => r.id === id);
        if (!report) return;
        const newCount = (report.generationCount || 0) + 1;
        await get().updateReport(id, { generationCount: newCount });
    },
}));

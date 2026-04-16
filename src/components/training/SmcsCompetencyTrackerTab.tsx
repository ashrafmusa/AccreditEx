/**
 * SmcsCompetencyTrackerTab.tsx
 *
 * SMCS-aligned Staff Clinical Competency Tracker.
 * Covers SMCS standards: .55 (Nursing), .67 (OT), .82 (ICU), .96 (Lab),
 * .104 (Anaesthesia), .116 (ED) — all require documented annual competency
 * assessments for clinical staff.
 *
 * Features:
 * - Department filter (14 SMCS departments)
 * - Staff competency status grid: Competent / Due / Overdue / Not Assessed
 * - Add / edit competency records per staff member
 * - Export summary for accreditation evidence
 */

import {
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { UserRole } from "@/types";
import React, { useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type CompetencyStatus = "Competent" | "Due" | "Overdue" | "Not Assessed";

interface CompetencyRecord {
  id: string;
  staffId: string;
  department: string;
  competencyName: string;
  assessedDate: string; // ISO date string
  nextDueDate: string;
  assessorName: string;
  status: CompetencyStatus;
  notes: string;
}

// ── SMCS Department list ──────────────────────────────────────────────────────

const SMCS_DEPARTMENTS = [
  "All Departments",
  "Provision of Care",
  "Laboratory Services",
  "Nursing Services",
  "Operation Theatre",
  "Critical Care (ICU)",
  "Emergency Department",
  "Anaesthesia Care",
  "Burn Care Unit",
  "Obstetrics & Gynaecology",
  "Neonatal ICU (NICU)",
  "Diagnostic Imaging (Radiology)",
  "Respiratory Therapy",
  "Medical Rehabilitation & Physiotherapy",
  "Nutrition & Dietary Services",
] as const;

// ── Core SMCS competency items per department ─────────────────────────────────

const SMCS_CORE_COMPETENCIES: Record<string, string[]> = {
  "Nursing Services": [
    "Medication Administration & Safety",
    "IV Line Insertion & Maintenance",
    "Wound Assessment & Dressing",
    "Patient Assessment & Documentation",
    "BLS (Basic Life Support)",
    "Pressure Injury Prevention",
    "Patient Handling & Mobility",
    "Infection Control Practices",
  ],
  "Operation Theatre": [
    "Surgical Scrub Technique",
    "WHO Surgical Safety Checklist",
    "Sterile Field Maintenance",
    "Instrument Count Protocol",
    "Patient Positioning",
    "Electrosurgery Safety",
    "Specimen Handling",
    "BLS & Emergency Response",
  ],
  "Critical Care (ICU)": [
    "Ventilator Management",
    "Haemodynamic Monitoring",
    "Central Line Care",
    "Sedation & Analgesia Assessment",
    "ACLS (Advanced Cardiac Life Support)",
    "NEWS2 Early Warning Score",
    "ICU Bundles (VAP, CLABSI, CAUTI)",
    "End-of-Life Communication",
  ],
  "Laboratory Services": [
    "Specimen Collection & Labelling",
    "Blood Culture Technique",
    "Point-of-Care Testing (POCT)",
    "Biosafety & Spill Response",
    "Calibration & QC Procedures",
    "Proficiency Testing",
    "Critical Value Reporting",
    "Instrument Maintenance Logs",
  ],
  "Anaesthesia Care": [
    "Pre-operative Patient Assessment",
    "Airway Management (RSI, LMA, ETT)",
    "Anaesthetic Machine Check",
    "Regional Anaesthesia Techniques",
    "ACLS",
    "Difficult Airway Management",
    "Perioperative Drug Safety",
    "Post-Anaesthesia Recovery Monitoring",
  ],
  "Emergency Department": [
    "Triage Assessment (MTS)",
    "ATLS Principles",
    "ACLS",
    "Paediatric Emergency Care (PALS)",
    "Trauma Assessment",
    "Sepsis Bundle Implementation",
    "ECG Interpretation",
    "Toxicology & Overdose Management",
  ],
  "Burn Care Unit": [
    "Burn Depth & TBSA Assessment",
    "Parkland Fluid Resuscitation Calculation",
    "Wound Debridement & Dressing",
    "Infection Control in Burns",
    "Nutritional Assessment (Curreri)",
    "Pain Management in Burns",
    "Burn Rehabilitation Basics",
    "BLS",
  ],
  "Obstetrics & Gynaecology": [
    "Partogram Interpretation",
    "Fetal Monitoring (CTG)",
    "Assisted Delivery Techniques",
    "Obstetric Emergency Management",
    "Postpartum Haemorrhage Protocol",
    "Neonatal Resuscitation",
    "Infection Control in Labour",
    "Documentation of Birth",
  ],
  "Neonatal ICU (NICU)": [
    "Neonatal Resuscitation (NRP)",
    "Thermoregulation & Incubator Management",
    "Total Parenteral Nutrition (TPN) Administration",
    "CPAP / Ventilator Management (Neonatal)",
    "Blood Glucose Monitoring",
    "Developmental Positioning",
    "Family-Centred Care Communication",
    "NICU Infection Control Bundles",
  ],
  "Diagnostic Imaging (Radiology)": [
    "Radiation Safety & ALARA Principles",
    "MRI Safety Screening",
    "Contrast Media Administration",
    "Patient Positioning (X-Ray / CT / MRI)",
    "Paediatric Imaging Techniques",
    "Contrast Reaction Emergency Response",
    "Image Quality Assessment",
    "Equipment Safety Checks",
  ],
  "Respiratory Therapy": [
    "Mechanical Ventilation Management",
    "Arterial Blood Gas Interpretation",
    "Bronchodilator Therapy",
    "Airway Clearance Techniques",
    "Oxygen Therapy Delivery",
    "Non-Invasive Ventilation (NIV/CPAP/BiPAP)",
    "Weaning Protocols",
    "BLS",
  ],
  "Medical Rehabilitation & Physiotherapy": [
    "Functional Assessment Tools",
    "Manual Handling & Patient Transfers",
    "Early Mobilisation Protocols",
    "Stroke Rehabilitation Techniques",
    "Electrotherapy Safety",
    "Respiratory Physiotherapy",
    "Documentation & Goal Setting",
    "BLS",
  ],
  "Nutrition & Dietary Services": [
    "Nutritional Screening Tools (MUST / NRS)",
    "Enteral Nutrition Administration",
    "Total Parenteral Nutrition (TPN) Monitoring",
    "Dysphagia Assessment",
    "Food Safety & HACCP Basics",
    "Therapeutic Diet Planning",
    "Patient Counselling Skills",
    "Documentation Standards",
  ],
  "Provision of Care": [
    "Patient Rights & Informed Consent",
    "Clinical Documentation Standards",
    "Handover Communication (SBAR)",
    "Falls Prevention Protocol",
    "Pressure Injury Bundle",
    "Pain Assessment & Management",
    "BLS",
    "Incident Reporting",
  ],
};

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CompetencyStatus,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  Competent: {
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircleIcon className="w-4 h-4 text-green-600" />,
  },
  Due: {
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />,
  },
  Overdue: {
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />,
  },
  "Not Assessed": {
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
    icon: null,
  },
};

function deriveStatus(nextDueDate: string): CompetencyStatus {
  if (!nextDueDate) return "Not Assessed";
  const now = new Date();
  const due = new Date(nextDueDate);
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (due < now) return "Overdue";
  if (due < thirtyDaysOut) return "Due";
  return "Competent";
}

// ── Empty form ────────────────────────────────────────────────────────────────

interface RecordForm {
  staffId: string;
  department: string;
  competencyName: string;
  assessedDate: string;
  nextDueDate: string;
  assessorName: string;
  notes: string;
}

const EMPTY_FORM: RecordForm = {
  staffId: "",
  department: "Nursing Services",
  competencyName: "",
  assessedDate: "",
  nextDueDate: "",
  assessorName: "",
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

const SmcsCompetencyTrackerTab: React.FC = () => {
  const { currentUser, users } = useUserStore();
  const { departments } = useAppStore();

  const isAdmin =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Manager;

  const [selectedDept, setSelectedDept] = useState<string>("All Departments");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<CompetencyRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RecordForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Clinical users only
  const clinicalUsers = useMemo(
    () =>
      users.filter(
        (u) => u.role !== UserRole.Admin || u.department !== undefined,
      ),
    [users],
  );

  const filteredRecords = useMemo(() => {
    let list = records;
    if (selectedDept !== "All Departments") {
      list = list.filter((r) => r.department === selectedDept);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.competencyName.toLowerCase().includes(q) ||
          (users.find((u) => u.id === r.staffId)?.name ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return list;
  }, [records, selectedDept, search, users]);

  // Summary stats
  const stats = useMemo(() => {
    const competent = records.filter((r) => r.status === "Competent").length;
    const due = records.filter((r) => r.status === "Due").length;
    const overdue = records.filter((r) => r.status === "Overdue").length;
    const notAssessed = records.filter(
      (r) => r.status === "Not Assessed",
    ).length;
    return { competent, due, overdue, notAssessed, total: records.length };
  }, [records]);

  const coreCompetencies =
    SMCS_CORE_COMPETENCIES[
      selectedDept === "All Departments" ? "Nursing Services" : selectedDept
    ] ?? [];

  const handleSave = () => {
    if (!form.staffId || !form.competencyName || !form.assessedDate) return;
    const status = deriveStatus(form.nextDueDate);
    if (editingId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...form, status } : r)),
      );
    } else {
      const newRecord: CompetencyRecord = {
        id: `comp-${Date.now()}`,
        ...form,
        status,
      };
      setRecords((prev) => [...prev, newRecord]);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rec: CompetencyRecord) => {
    setForm({
      staffId: rec.staffId,
      department: rec.department,
      competencyName: rec.competencyName,
      assessedDate: rec.assessedDate,
      nextDueDate: rec.nextDueDate,
      assessorName: rec.assessorName,
      notes: rec.notes,
    });
    setEditingId(rec.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleExport = () => {
    const rows = [
      [
        "Staff Name",
        "Department",
        "Competency",
        "Assessed Date",
        "Next Due",
        "Assessor",
        "Status",
        "Notes",
      ].join(","),
      ...filteredRecords.map((r) => {
        const name = users.find((u) => u.id === r.staffId)?.name ?? r.staffId;
        return [
          `"${name}"`,
          `"${r.department}"`,
          `"${r.competencyName}"`,
          r.assessedDate,
          r.nextDueDate,
          `"${r.assessorName}"`,
          r.status,
          `"${r.notes}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smcs-competency-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-brand-primary" />
            SMCS Staff Competency Tracker
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            Tracks annual clinical competency assessments per SMCS standards
            (.55, .67, .82, .96, .104, .116)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Export CSV
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setShowForm(true);
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Record
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Competent",
            value: stats.competent,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Due Soon",
            value: stats.due,
            color: "text-yellow-600",
            bg: "bg-yellow-50 dark:bg-yellow-900/20",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20",
          },
          {
            label: "Not Assessed",
            value: stats.notAssessed,
            color: "text-gray-500",
            bg: "bg-gray-50 dark:bg-gray-800",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-lg p-3 text-center border border-gray-200 dark:border-dark-brand-border`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
        >
          {SMCS_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search staff or competency..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
        />
      </div>

      {/* Core competencies reference for selected department */}
      {selectedDept !== "All Departments" && (
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-brand-primary mb-2">
            SMCS Core Competencies — {selectedDept}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {coreCompetencies.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface border border-gray-200 dark:border-dark-brand-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
              {editingId ? "Edit Competency Record" : "Add Competency Record"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Staff Member *
              </label>
              <select
                value={form.staffId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, staffId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              >
                <option value="">Select staff member...</option>
                {clinicalUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.department ? `(${u.department})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Department *
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              >
                {SMCS_DEPARTMENTS.filter((d) => d !== "All Departments").map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Competency *
              </label>
              <input
                list="competency-suggestions"
                value={form.competencyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, competencyName: e.target.value }))
                }
                placeholder="e.g. Medication Administration & Safety"
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              />
              <datalist id="competency-suggestions">
                {(SMCS_CORE_COMPETENCIES[form.department] ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Assessor Name
              </label>
              <input
                type="text"
                value={form.assessorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assessorName: e.target.value }))
                }
                placeholder="Name of assessing clinician"
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Date Assessed *
              </label>
              <input
                type="date"
                value={form.assessedDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assessedDate: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Next Due Date
              </label>
              <input
                type="date"
                value={form.nextDueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nextDueDate: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Remediation plan, special observations..."
                className="w-full rounded-lg border border-gray-300 dark:border-dark-brand-border bg-brand-background dark:bg-dark-brand-background text-brand-text-primary dark:text-dark-brand-text-primary px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                !form.staffId || !form.competencyName || !form.assessedDate
              }
            >
              {editingId ? "Save Changes" : "Add Record"}
            </Button>
          </div>
        </div>
      )}

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 text-brand-text-secondary dark:text-dark-brand-text-secondary">
          <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No competency records yet</p>
          <p className="text-sm mt-1">
            {isAdmin
              ? 'Click "Add Record" to log the first SMCS competency assessment.'
              : "Contact your administrator to add competency records."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-brand-border">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border text-sm">
            <thead className="bg-gray-50 dark:bg-dark-brand-surface">
              <tr>
                {[
                  "Staff Member",
                  "Department",
                  "Competency",
                  "Assessed",
                  "Next Due",
                  "Assessor",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-brand-background dark:bg-dark-brand-background divide-y divide-gray-100 dark:divide-dark-brand-border">
              {filteredRecords.map((rec) => {
                const staffName =
                  users.find((u) => u.id === rec.staffId)?.name ?? rec.staffId;
                const cfg = STATUS_CONFIG[rec.status];
                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-brand-surface transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-brand-text-primary dark:text-dark-brand-text-primary whitespace-nowrap">
                      {staffName}
                    </td>
                    <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {rec.department}
                    </td>
                    <td className="px-4 py-3 text-brand-text-primary dark:text-dark-brand-text-primary max-w-[200px] truncate">
                      {rec.competencyName}
                    </td>
                    <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary whitespace-nowrap">
                      {rec.assessedDate}
                    </td>
                    <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary whitespace-nowrap">
                      {rec.nextDueDate || "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {rec.assessorName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.icon}
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(rec)}
                            className="text-xs text-brand-primary hover:underline"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
        SMCS standards requiring competency documentation: SMCS.55 (Nursing) ·
        SMCS.67 (OT) · SMCS.82 (ICU) · SMCS.96 (Lab) · SMCS.104 (Anaesthesia) ·
        SMCS.116 (ED)
      </p>
    </div>
  );
};

export default SmcsCompetencyTrackerTab;

/**
 * ohasService.ts
 * Seeds the 14 Oman SMCS (Specialized Medical Care Services) accreditation
 * projects from the pre-built SMCS standards dataset.
 *
 * Each project corresponds to one SMCS department chapter (e.g., Nursing,
 * Operation Theatre, ICU) and comes pre-loaded with a full checklist of
 * sub-standard items mapped to the OHAS accreditation program.
 */

import smcsRaw from "@/data/smcsStandards.json";
import type {
  AccreditationProgram,
  ChecklistItem,
  Project,
  Standard,
} from "@/types";
import { ComplianceStatus } from "@/types";
import { createProject, getProjects } from "./projectService";
import { getAccreditationPrograms } from "./accreditationProgramService";
import { getStandards } from "./standardService";

// ── Types ────────────────────────────────────────────────

interface SmcsSubStandard {
  id: string;
  description: string;
}

interface SmcsStandard {
  standardId: string;
  programId: string;
  chapter: string;
  section: string;
  description: string;
  criticality: string;
  totalMeasures: number;
  subStandards: SmcsSubStandard[];
  category: string;
}

// ── Display names (human-readable, shown in project cards) ───

const DISPLAY_NAMES: Record<string, string> = {
  "Provision of Care": "Provision of Care",
  Laboratory: "Laboratory Services",
  "Diagnostic Imaging Services (RD)": "Diagnostic Imaging (Radiology)",
  "Emergency Department": "Emergency Department",
  Nursing: "Nursing Services",
  "Operation Theatre": "Operation Theatre",
  "Anaesthesia Care (AN)": "Anaesthesia Care",
  "Critical Care": "Critical Care (ICU)",
  "Neonatal Intensive Care Unit (NICU)": "Neonatal ICU (NICU)",
  "Burn Care Unit": "Burn Care Unit",
  "Obstetrics and Gynaecology": "Obstetrics & Gynaecology",
  "Respiratory Therapy  service": "Respiratory Therapy",
  "Medical Rehabilitation and Physiotherapy Service":
    "Medical Rehabilitation & Physiotherapy",
  "Nutrition and Dietary Services": "Nutrition & Dietary Services",
};

// ── Priority classification ──────────────────────────────

const PRIORITY: Record<string, "Critical" | "High" | "Medium"> = {
  "Provision of Care": "Critical",
  Laboratory: "Critical",
  Nursing: "Critical",
  "Operation Theatre": "Critical",
  "Critical Care": "Critical",
  "Emergency Department": "High",
  "Anaesthesia Care (AN)": "High",
  "Burn Care Unit": "High",
  "Obstetrics and Gynaecology": "High",
  "Neonatal Intensive Care Unit (NICU)": "High",
  "Diagnostic Imaging Services (RD)": "Medium",
  "Respiratory Therapy  service": "Medium",
  "Medical Rehabilitation and Physiotherapy Service": "Medium",
  "Nutrition and Dietary Services": "Medium",
};

// ── Seed function ────────────────────────────────────────

export interface OhasSeedResult {
  created: number;
  skipped: number;
  errors: string[];
  departments: string[];
}

/**
 * Seeds all 14 SMCS department projects into Firestore.
 * Resolves the program from complete SMCS standard coverage, not its display name
 * or a legacy dataset identifier.
 */
export const resolveOhasSmcsProgram = (
  programs: AccreditationProgram[],
  standards: Pick<Standard, "programId" | "standardId">[],
): AccreditationProgram | null => {
  const required = new Set(smcsRaw.map((standard) => standard.standardId));
  const candidates = programs.filter((program) => {
    if (program.status && program.status !== "active") return false;
    const available = new Set(
      standards
        .filter((standard) => standard.programId === program.id)
        .map((standard) => standard.standardId),
    );
    return [...required].every((id) => available.has(id));
  });
  return candidates.length === 1 ? candidates[0] : null;
};

export const seedOhasSmcsProjects = async (
  programId: string,
): Promise<OhasSeedResult> => {
  const [programs, storedStandards, projects] = await Promise.all([
    getAccreditationPrograms(),
    getStandards(),
    getProjects(),
  ]);
  const program = resolveOhasSmcsProgram(programs, storedStandards);
  if (!program || program.id !== programId) {
    throw new Error(
      "SMCS requires one active accreditation program containing all dataset standards.",
    );
  }
  if (hasOhasSmcsProjects(projects)) {
    throw new Error(
      "SMCS projects already exist. Reconcile their program references instead of seeding duplicates.",
    );
  }
  const standards = smcsRaw as SmcsStandard[];

  // Group standards by department category
  const byCategory = new Map<string, SmcsStandard[]>();
  for (const std of standards) {
    if (!byCategory.has(std.category)) byCategory.set(std.category, []);
    byCategory.get(std.category)!.push(std);
  }

  const errors: string[] = [];
  const departments: string[] = [];
  let created = 0;
  let skipped = 0;

  const today = new Date().toISOString().split("T")[0];

  for (const [category, stds] of byCategory) {
    try {
      // Build one ChecklistItem per sub-standard measure
      const checklist: ChecklistItem[] = [];

      for (const std of stds) {
        for (const sub of std.subStandards) {
          const itemId = sub.id.toLowerCase().replace(/\./g, "-");
          checklist.push({
            id: itemId,
            item: sub.description,
            requirement: std.description,
            standardId: std.standardId,
            status: ComplianceStatus.NotStarted,
            assignedTo: "",
            dueDate: "",
            actionPlan: "",
            notes: "",
            evidenceFiles: [],
            comments: [],
          });
        }
      }

      if (checklist.length === 0) {
        skipped++;
        continue;
      }

      const displayName = DISPLAY_NAMES[category] ?? category;
      const priority = PRIORITY[category] ?? "Medium";
      const totalMeasures = stds.reduce(
        (sum, s) => sum + (s.totalMeasures ?? s.subStandards.length),
        0,
      );

      const projectData: Omit<Project, "id"> = {
        name: `SMCS — ${displayName}`,
        description: `Oman SMCS Accreditation — ${displayName}. ${stds.length} standard${stds.length !== 1 ? "s" : ""}, ${totalMeasures} measurable sub-criteria. Priority: ${priority}.`,
        programId: program.id,
        status: "Open",
        startDate: today,
        progress: 0,
        checklist,
        standardIds: stds.map((s) => s.standardId),
        capaReports: [],
        pdcaCycles: [],
        mockSurveys: [],
        designControls: [],
        activityLog: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createProject(projectData);
      created++;
      departments.push(displayName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${DISPLAY_NAMES[category] ?? category}: ${msg}`);
    }
  }

  return { created, skipped, errors, departments };
};

/**
 * Returns true if SMCS projects have already been seeded
 * Recognizes both legacy and repaired SMCS projects to prevent re-seeding.
 */
export const hasOhasSmcsProjects = (
  projects: Pick<Project, "programId" | "name">[],
): boolean => projects.some((p) => p.name.startsWith("SMCS —"));

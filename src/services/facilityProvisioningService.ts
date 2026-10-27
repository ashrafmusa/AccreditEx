import {
  AccreditationProgramKey,
  getFacilityBlueprint,
  OrganizationScaleMode,
  PROGRAM_CHECKLIST_TEMPLATES,
} from "@/data/facilityBlueprints";
import { addDepartment, getDepartments } from "@/services/departmentService";
import { addDocument, getDocuments } from "@/services/documentService";
import { createProject, getProjects } from "@/services/projectService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  ChecklistItem,
  ComplianceStatus,
  ProjectStatus,
  User,
} from "@/types";

export interface ProvisionFacilityOptions {
  user: User;
  program: string;
  organizationName: string;
  organizationType: string;
  organizationSize?: OrganizationScaleMode;
  autoProvisionStarterPack?: boolean;
}

export interface ProvisionFacilityResult {
  departmentsCreated: number;
  projectCreated: boolean;
  documentsCreated: number;
}

export async function provisionFacilityWorkspace(
  options: ProvisionFacilityOptions,
): Promise<ProvisionFacilityResult> {
  const {
    user,
    program,
    organizationName,
    organizationType,
    organizationSize = "medium",
    autoProvisionStarterPack = true,
  } = options;

  if (!autoProvisionStarterPack) {
    return {
      departmentsCreated: 0,
      projectCreated: false,
      documentsCreated: 0,
    };
  }

  const blueprint = getFacilityBlueprint(organizationType);
  const programKey = (
    program in PROGRAM_CHECKLIST_TEMPLATES ? program : "other"
  ) as AccreditationProgramKey;
  const programTemplate =
    PROGRAM_CHECKLIST_TEMPLATES[programKey] ||
    PROGRAM_CHECKLIST_TEMPLATES.other;

  let departmentsCreated = 0;
  let projectCreated = false;
  let documentsCreated = 0;

  // 1. Idempotently seed Facility Departments if none exist yet
  try {
    const existingDepartments = await getDepartments();
    if (existingDepartments.length === 0) {
      // Small facilities get top 3 core departments; medium/enterprise get full blueprint
      const departmentsToCreate =
        organizationSize === "small"
          ? blueprint.departments.slice(0, 3)
          : blueprint.departments;

      for (const dept of departmentsToCreate) {
        await addDepartment({
          name: dept.name,
          description: dept.description,
          isActive: true,
          members: [user.id],
          createdAt: new Date().toISOString(),
        });
        departmentsCreated++;
      }
    }
  } catch (err) {
    console.warn("[Provisioning] Department seeding skipped:", err);
  }

  // 2. Idempotently seed Starter Controlled Policy Documents if none exist yet
  const createdDocIds: string[] = [];
  try {
    const existingDocs = await getDocuments();
    if (existingDocs.length === 0) {
      const now = new Date().toISOString();
      const nextReviewDate = new Date();
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);

      for (const policy of blueprint.starterPolicies) {
        const created = await addDocument({
          name: policy.name,
          type: policy.type,
          documentNumber: policy.documentNumber,
          isControlled: true,
          status: organizationSize === "small" ? "Approved" : "Draft",
          content: policy.content,
          currentVersion: 1,
          uploadedAt: now,
          createdAt: now,
          uploadedBy: user.name || user.email,
          category: policy.category,
          reviewDate: nextReviewDate.toISOString().split("T")[0],
          ...(organizationSize === "small"
            ? {
                approvedBy: user.name || user.email,
                approvalDate: now,
              }
            : {}),
        });
        createdDocIds.push(created.id);
        documentsCreated++;
      }
    }
  } catch (err) {
    console.warn("[Provisioning] Starter document seeding skipped:", err);
  }

  // 3. Idempotently seed Baseline Accreditation Readiness Project if none exist yet
  try {
    const existingProjects = await getProjects();
    if (existingProjects.length === 0) {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 90);
      const dueDateStr = targetDate.toISOString().split("T")[0];

      const checklist: ChecklistItem[] = programTemplate.items.map(
        (item, idx) => ({
          id: `chk-${programTemplate.programCode.toLowerCase()}-${idx + 1}`,
          standardId: item.standardId,
          category: item.category,
          item: item.item,
          status:
            idx === 0 && createdDocIds.length > 0
              ? ComplianceStatus.PartiallyCompliant
              : ComplianceStatus.NotStarted,
          assignedTo: user.id,
          dueDate: dueDateStr,
          actionPlan: item.actionPlan,
          notes: `Required evidence: ${item.requiredEvidence.join(", ")}`,
          evidenceFiles: idx === 0 && createdDocIds[0] ? [createdDocIds[0]] : [],
          comments: [],
          requiredEvidence: item.requiredEvidence,
        }),
      );

      await createProject({
        name: `${organizationName} — ${programTemplate.projectTitleEn}`,
        description: `Automated ${programTemplate.programCode} baseline survey readiness project tailored for ${blueprint.label.en} (${organizationSize} governance mode).`,
        programId: programTemplate.programCode,
        status: ProjectStatus.InProgress,
        startDate,
        endDate: dueDateStr,
        projectLead: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        teamMembers: [user.id],
        progress: 0,
        checklist,
        capaReports: [],
        pdcaCycles: [],
        mockSurveys: [],
        designControls: [],
        activityLog: [
          {
            id: `act-${Date.now()}`,
            timestamp: now.toISOString(),
            user: user.name || user.email,
            action: {
              en: `Provisioned ${programTemplate.programCode} baseline readiness workspace`,
              ar: `تم تهيئة مشروع الجاهزية الأساسي (${programTemplate.programCode})`,
            },
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      projectCreated = true;
    }
  } catch (err) {
    console.warn("[Provisioning] Baseline project seeding skipped:", err);
  }

  // 4. Refresh application & project stores so Dashboard immediately reflects provisioned data
  try {
    await Promise.all([
      useAppStore.getState().fetchAllData(),
      useProjectStore.getState().fetchAllProjects(),
    ]);
  } catch {
    // Non-fatal
  }

  return {
    departmentsCreated,
    projectCreated,
    documentsCreated,
  };
}

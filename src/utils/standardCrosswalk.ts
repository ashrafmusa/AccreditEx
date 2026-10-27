import { ChecklistItem, ComplianceStatus, Project } from "@/types";

export interface CrosswalkDomain {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  equivalents: {
    cbahi: string[];
    jci: string[];
    cap_iso15189: string[];
    dnv_iso9001: string[];
    regional_moh: string[];
  };
  matchTokens: string[];
}

export const STANDARD_CROSSWALK_DOMAINS: CrosswalkDomain[] = [
  {
    id: "patient_identification",
    titleEn: "Patient Identification & Specimen Labeling",
    titleAr: "التعرف الصحيح على المريض وترميز العينات",
    descriptionEn:
      "Two-identifier verification before medication administration, procedures, and diagnostic specimen collection.",
    descriptionAr:
      "التحقق باستخدام معرفين قبل إعطاء الأدوية أو الإجراءات أو سحب العينات.",
    equivalents: {
      cbahi: ["IPSG.1", "PC.1", "LB.2"],
      jci: ["IPSG.1", "AOP.5.1"],
      cap_iso15189: ["ISO15189-7.2", "LAB.2", "COM.06100"],
      dnv_iso9001: ["ISO-9001-8.5.2", "PR.1"],
      regional_moh: ["DOH-PS.1", "ASHK-PC.1"],
    },
    matchTokens: ["ipsg.1", "pc.1", "lab.2", "doh-ps.1", "ashk-pc.1", "7.2"],
  },
  {
    id: "infection_control",
    titleEn: "Infection Prevention, Hand Hygiene & Sterilization",
    titleAr: "مكافحة العدوى ونظافة اليدين والتعقيم",
    descriptionEn:
      "Facility-wide infection surveillance, WHO 5 Moments hand hygiene, and instrument sterilization logs.",
    descriptionAr:
      "ترصد العدوى، نظافة اليدين، وسجلات التعقيم المركزي.",
    equivalents: {
      cbahi: ["IPC.1", "IPC.4", "IC.1"],
      jci: ["PCI.1", "PCI.5", "PCI.6", "PCI.7"],
      cap_iso15189: ["LAB.5", "GEN.74000"],
      dnv_iso9001: ["ISO-7.1.4", "IC.1"],
      regional_moh: ["DOH-IPC.1", "ASHK-IPC.1"],
    },
    matchTokens: [
      "ipc.1",
      "ipc.4",
      "pci.1",
      "pci.5",
      "pci.6",
      "pci.7",
      "doh-ipc.1",
      "7.1.4",
    ],
  },
  {
    id: "medication_safety",
    titleEn: "Medication Management & High-Alert / LASA Safety",
    titleAr: "إدارة الأدوية وسلامة الأدوية عالية الخطورة",
    descriptionEn:
      "High-alert medication double-checks, LASA segregation, crash cart checks, and medication reconciliation.",
    descriptionAr:
      "الفحص المزدوج للأدوية عالية الخطورة، فصل المتشابهات، ومطابقة الأدوية.",
    equivalents: {
      cbahi: ["MM.1", "IPSG.3"],
      jci: ["MMU.3", "MMU.4", "IPSG.3"],
      cap_iso15189: ["GEN.43000"],
      dnv_iso9001: ["MM.1", "ISO-8.5.1"],
      regional_moh: ["DOH-MM.1", "ASHK-MM.1"],
    },
    matchTokens: ["mm.1", "mmu.3", "mmu.4", "ipsg.3", "doh-mm.1", "ashk-mm.1"],
  },
  {
    id: "quality_capa_risk",
    titleEn: "Quality Management, Incident Reporting & CAPA",
    titleAr: "إدارة الجودة وتقارير الحوادث والإجراءات التصحيحية",
    descriptionEn:
      "Continuous quality improvement, sentinel/adverse event root cause analysis, and risk register governance.",
    descriptionAr:
      "التحسين المستمر، تحليل السبب الجذري للحوادث الجسيمة، وإدارة المخاطر.",
    equivalents: {
      cbahi: ["QM.1", "QM.2"],
      jci: ["QPS.1", "QPS.2", "QPS.7"],
      cap_iso15189: ["CAP-GEN.20375", "ISO15189-8.7", "ISO15189-8.9"],
      dnv_iso9001: ["ISO-9001-4.4", "ISO-9001-6.1", "ISO-9001-10.2"],
      regional_moh: ["DOH-CG.1", "ASHK-QI.1"],
    },
    matchTokens: [
      "qm.1",
      "qm.2",
      "qps.1",
      "qps.2",
      "gen.20375",
      "iso15189-8.7",
      "iso-9001-4.4",
      "iso-9001-6.1",
      "iso-9001-10.2",
      "doh-cg.1",
      "ashk-qi.1",
    ],
  },
  {
    id: "lab_iqc_pt_critical",
    titleEn: "Laboratory IQC Westgard, Proficiency Testing & Critical Values",
    titleAr: "ضبط الجودة الداخلي، اختبارات الكفاءة، والنتائج الحرجة",
    descriptionEn:
      "Daily Levey-Jennings / Westgard IQC verification, external EQA/PT enrollment, and critical value read-back.",
    descriptionAr:
      "ضبط الجودة اليومي (Westgard)، اختبارات الكفاءة الخارجية، وإبلاغ النتائج الحرجة.",
    equivalents: {
      cbahi: ["LB.1", "IPSG.2"],
      jci: ["AOP.5", "IPSG.2"],
      cap_iso15189: [
        "ISO15189-7.3.7",
        "CAP-COM.01200",
        "CAP-COM.30000",
        "LAB.1",
        "LAB.3",
        "LAB.4",
      ],
      dnv_iso9001: ["ISO-9001-8.6"],
      regional_moh: ["DOH-LAB.1"],
    },
    matchTokens: [
      "lb.1",
      "aop.5",
      "ipsg.2",
      "iso15189-7.3.7",
      "cap-com.01200",
      "cap-com.30000",
      "lab.1",
      "lab.3",
      "lab.4",
    ],
  },
  {
    id: "facility_fire_safety",
    titleEn: "Facility Management, Fire Drills & Medical Equipment",
    titleAr: "سلامة المنشأة، الإخلاء والحرائق، وصيانة الأجهزة الطبية",
    descriptionEn:
      "Fire safety drills, hazardous materials (HAZMAT), utility backups, and preventive biomedical calibration.",
    descriptionAr:
      "فرضيات الإخلاء، المواد الخطرة، والصيانة الوقائية للأجهزة الطبية.",
    equivalents: {
      cbahi: ["FMS.1", "FMS.2"],
      jci: ["FMS.2", "FMS.5", "FMS.8"],
      cap_iso15189: ["LAB.5", "ISO15189-6.4"],
      dnv_iso9001: ["PE.1", "ISO-9001-7.1.3"],
      regional_moh: ["DOH-FMS.1"],
    },
    matchTokens: ["fms.1", "fms.2", "fms.5", "lab.5", "doh-fms.1", "pe.1"],
  },
  {
    id: "patient_rights_consent",
    titleEn: "Patient Rights, Informed Consent & Medical Records",
    titleAr: "حقوق المرضى، الموافقة المستنيرة، والسجل الطبي",
    descriptionEn:
      "Informed consent before procedures, patient privacy, complaint resolution, and complete medical records.",
    descriptionAr:
      "الموافقة المستنيرة، خصوصية المريض، والاكتمال التوثيقي للسجل الطبي.",
    equivalents: {
      cbahi: ["PR.1", "MR.1"],
      jci: ["PCC.1", "PCC.4", "COP.2", "MOI.9"],
      cap_iso15189: ["ISO15189-7.4"],
      dnv_iso9001: ["ISO-9001-8.5"],
      regional_moh: ["ASHK-PR.1", "DOH-PR.1"],
    },
    matchTokens: [
      "pr.1",
      "mr.1",
      "pcc.1",
      "pcc.4",
      "cop.2",
      "iso-9001-8.5",
      "ashk-pr.1",
    ],
  },
  {
    id: "workforce_competency",
    titleEn: "Staff Credentialing, Privileging & Annual Competency",
    titleAr: "التحقق من المؤهلات، الامتيازات الإكلينيكية، والكفاءة السنوية",
    descriptionEn:
      "Primary source verification of licenses, clinical privileging, and mandatory annual staff training.",
    descriptionAr:
      "التحقق من التراخيص المهنية، الامتيازات السريرية، والتدريب الإلزامي.",
    equivalents: {
      cbahi: ["HR.1", "MS.1"],
      jci: ["SQE.1", "SQE.5", "SQE.10"],
      cap_iso15189: ["ISO15189-6.2", "CAP-GEN.55500"],
      dnv_iso9001: ["ISO-9001-7.2"],
      regional_moh: ["DOH-HR.1", "ASHK-HR.1"],
    },
    matchTokens: [
      "hr.1",
      "sqe.1",
      "sqe.5",
      "iso-9001-7.2",
      "iso15189-6.2",
      "gen.55500",
    ],
  },
];

export function matchStandardToCrosswalkDomain(
  standardId: string,
): CrosswalkDomain | null {
  const norm = (standardId || "").trim().toLowerCase();
  if (!norm) return null;
  for (const domain of STANDARD_CROSSWALK_DOMAINS) {
    if (
      domain.matchTokens.some(
        (token) => norm === token || norm.includes(token),
      )
    ) {
      return domain;
    }
  }
  return null;
}

export interface CrosswalkDomainAnalysis {
  domain: CrosswalkDomain;
  matchedItems: Array<{
    projectId: string;
    projectName: string;
    programId: string;
    item: ChecklistItem;
  }>;
  sharedEvidenceDocIds: string[];
  itemsMissingSharedEvidence: number;
}

export function analyzeCrossProjectCrosswalk(
  projects: Project[],
): CrosswalkDomainAnalysis[] {
  const activeProjects = projects.filter((p) => !p.archived);

  return STANDARD_CROSSWALK_DOMAINS.map((domain) => {
    const matchedItems: CrosswalkDomainAnalysis["matchedItems"] = [];
    const docIdSet = new Set<string>();

    for (const proj of activeProjects) {
      for (const item of proj.checklist || []) {
        const matched = matchStandardToCrosswalkDomain(item.standardId);
        if (matched?.id === domain.id) {
          matchedItems.push({
            projectId: proj.id,
            projectName: proj.name,
            programId: proj.programId,
            item,
          });
          for (const docId of item.evidenceFiles || []) {
            if (docId) docIdSet.add(docId);
          }
        }
      }
    }

    const sharedEvidenceDocIds = Array.from(docIdSet);
    const itemsMissingSharedEvidence =
      sharedEvidenceDocIds.length > 0
        ? matchedItems.filter((m) => {
            const existing = new Set(m.item.evidenceFiles || []);
            return sharedEvidenceDocIds.some((id) => !existing.has(id));
          }).length
        : 0;

    return {
      domain,
      matchedItems,
      sharedEvidenceDocIds,
      itemsMissingSharedEvidence,
    };
  });
}

export async function syncCrosswalkEvidenceAcrossProjects(
  projects: Project[],
  updateProject: (project: Project) => Promise<void> | void,
): Promise<{
  projectsUpdated: number;
  itemsSynced: number;
}> {
  const analyses = analyzeCrossProjectCrosswalk(projects);
  const projectUpdatesMap = new Map<string, Project>();
  let itemsSynced = 0;

  for (const analysis of analyses) {
    if (analysis.sharedEvidenceDocIds.length === 0) continue;

    for (const match of analysis.matchedItems) {
      const currentProj =
        projectUpdatesMap.get(match.projectId) ||
        projects.find((p) => p.id === match.projectId);
      if (!currentProj) continue;

      const existingEvidence = new Set(match.item.evidenceFiles || []);
      const missingDocs = analysis.sharedEvidenceDocIds.filter(
        (id) => !existingEvidence.has(id),
      );
      if (missingDocs.length === 0) continue;

      const updatedChecklist = (currentProj.checklist || []).map((chk) => {
        if (chk.id !== match.item.id) return chk;
        itemsSynced++;
        const mergedDocs = Array.from(
          new Set([...(chk.evidenceFiles || []), ...missingDocs]),
        );
        return {
          ...chk,
          evidenceFiles: mergedDocs,
          status:
            chk.status === ComplianceStatus.NotStarted
              ? ComplianceStatus.PartiallyCompliant
              : chk.status,
          notes: chk.notes
            ? `${chk.notes} | [Crosswalk Synced: ${analysis.domain.titleEn}]`
            : `[Crosswalk Synced: ${analysis.domain.titleEn}]`,
        };
      });

      projectUpdatesMap.set(currentProj.id, {
        ...currentProj,
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const updatedProj of projectUpdatesMap.values()) {
    await updateProject(updatedProj);
  }

  return {
    projectsUpdated: projectUpdatesMap.size,
    itemsSynced,
  };
}

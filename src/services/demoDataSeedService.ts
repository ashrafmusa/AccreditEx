import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import {
  AccreditationProgram,
  AppDocument,
  Audit,
  AuditFinding,
  AuditPlan,
  Branch,
  CAPAReport,
  Competency,
  CustomCalendarEvent,
  Department,
  IncidentReport,
  Project,
  QualityRound,
  RoundingFinding,
  RoundingTemplate,
  Risk,
  Standard,
  TrainingProgram,
  User,
} from "@/types";
import {
  SEED_CAPA_RECORDS,
  SEED_CALIBRATION_RECORDS,
  SEED_COMPETENCY_RECORDS,
  SEED_EQUIPMENT,
  SEED_IQC_ANALYTES,
  SEED_IQC_RESULTS,
  SEED_MAINTENANCE_LOGS,
  SEED_PROFICIENCY_TESTS,
  SEED_QUALITY_EVENTS,
  SEED_QUALITY_RISKS,
  SEED_REAGENTS,
} from "@/types/labOps";
import type { LabOpsPersistedData } from "@/services/labOpsService";
import { REPORT_TEMPLATES } from "@/types/reportBuilder";
import { WORKFLOW_TEMPLATES } from "@/types/workflow";
import { db } from "@/firebase/firebaseConfig";
import { Supplier, SupplierAudit } from "@/types/supplier";
import { ChangeRequest } from "@/types/changeControl";

export const DEMO_SEED_ORGANIZATION_ID = "org-accreditex";
export const DEMO_SEED_VERSION = "accreditex-marketing-v1";
const ID_PREFIX = "demo-accreditex-marketing-v1";

export interface DemoSeedRecord {
  collectionName: string;
  id: string;
  data: DocumentData;
}

export interface DemoSeedResult {
  created: number;
  skipped: number;
  labOpsRecordsAdded: number;
}

const DEMO_COLLECTIONS = [
  "branches",
  "accreditationPrograms",
  "standards",
  "departments",
  "competencies",
  "trainingPrograms",
  "projects",
  "documents",
  "risks",
  "auditPlans",
  "audits",
  "auditFindings",
  "incidentReports",
  "capaReports",
  "changeRequests",
  "suppliers",
  "supplierAudits",
  "nonConformances",
  "correctionPlans",
  "quality_rounds",
  "rounding_templates",
  "rounding_findings",
  "customEvents",
  "activity_logs",
  "reportDefinitions",
  "workflowDefinitions",
  "labOpsData",
] as const;

const idFor = (suffix: string): string => `${ID_PREFIX}-${suffix}`;

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitUndefined);
  }
  if (value instanceof Date) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, field]) => field !== undefined)
        .map(([key, field]) => [key, omitUndefined(field)]),
    );
  }
  return value;
}

function withDemoMarker<T extends object>(
  value: T,
  organizationId: string,
): DocumentData {
  return omitUndefined({
    ...value,
    organizationId,
    syntheticDemo: true,
    demoSeedVersion: DEMO_SEED_VERSION,
  }) as DocumentData;
}

const localized = (en: string, ar: string) => ({ en, ar });

export function buildSyntheticDemoSeed(
  organizationId: string,
  currentUser: User,
  now = new Date(),
): DemoSeedRecord[] {
  if (organizationId !== DEMO_SEED_ORGANIZATION_ID) {
    throw new Error("Synthetic marketing data is restricted to Accreditex.");
  }
  if (
    currentUser.role !== "Admin" ||
    currentUser.organizationId !== organizationId ||
    !currentUser.id
  ) {
    throw new Error("An Accreditex organization admin is required.");
  }

  const createdAt = now.toISOString();
  const date = (offsetDays: number): string =>
    new Date(now.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10);
  const records: DemoSeedRecord[] = [];
  const add = <T extends object>(
    collectionName: string,
    id: string,
    value: T,
  ): void => {
    records.push({
      collectionName,
      id,
      data: withDemoMarker(value, organizationId),
    });
  };

  const branchIds = [
    idFor("branch-main"),
    idFor("branch-north"),
    idFor("branch-east"),
  ];
  const departmentIds = [
    idFor("department-quality"),
    idFor("department-laboratory"),
    idFor("department-infection-control"),
  ];
  const competencyIds = [
    idFor("competency-document-control"),
    idFor("competency-internal-audit"),
    idFor("competency-laboratory-qc"),
  ];
  const trainingIds = [
    idFor("training-document-control"),
    idFor("training-internal-audit"),
    idFor("training-laboratory-qc"),
  ];
  const projectId = idFor("project-accreditation-readiness");
  const programId = idFor("program-demo-accreditation");
  const standardIds = [
    idFor("standard-document-control"),
    idFor("standard-internal-audit"),
    idFor("standard-quality-improvement"),
  ];
  const documentIds = [
    idFor("document-controlled-policy"),
    idFor("document-audit-procedure"),
    idFor("document-qc-procedure"),
  ];
  const checklistIds = standardIds.map((_, index) =>
    idFor(`checklist-${index + 1}`),
  );

  const branches: Branch[] = [
    {
      id: branchIds[0],
      organizationId,
      name: "[DEMO] Accreditex Main Campus",
      nameAr: "[عرض] المقر الرئيسي",
      location: "Synthetic demonstration site",
      city: "Demo City",
      country: "Synthetic",
      isActive: true,
      createdAt,
    },
    {
      id: branchIds[1],
      organizationId,
      name: "[DEMO] Accreditex North Clinic",
      nameAr: "[عرض] عيادة أكريديتكس الشمالية",
      location: "Synthetic demonstration site",
      city: "Demo City",
      country: "Synthetic",
      isActive: true,
      createdAt,
    },
    {
      id: branchIds[2],
      organizationId,
      name: "[DEMO] Accreditex East Laboratory",
      nameAr: "[عرض] مختبر أكريديتكس الشرقي",
      location: "Synthetic demonstration site",
      city: "Demo City",
      country: "Synthetic",
      isActive: true,
      createdAt,
    },
  ];
  branches.forEach((branch) => add("branches", branch.id, branch));

  const program: AccreditationProgram = {
    id: programId,
    organizationId,
    scope: "tenant",
    name: "[DEMO] Healthcare Quality Accreditation",
    description: localized(
      "Synthetic program for demonstrating accreditation workflows.",
      "برنامج اصطناعي لعرض إجراءات الاعتماد.",
    ),
    accreditingBody: "Synthetic demonstration standard",
    status: "active",
    version: "Demo 1.0",
  };
  add("accreditationPrograms", programId, program);

  const standards: Standard[] = [
    {
      id: standardIds[0],
      organizationId,
      scope: "tenant",
      standardId: "DEMO-DC-01",
      programId,
      section: "Document Control",
      description: "Synthetic controls for document approval and review.",
      criticality: "High",
      totalMeasures: 4,
      version: "Demo 1.0",
      category: "Quality Management",
    },
    {
      id: standardIds[1],
      organizationId,
      scope: "tenant",
      standardId: "DEMO-AU-01",
      programId,
      section: "Internal Audit",
      description: "Synthetic controls for audit planning and follow-up.",
      criticality: "Medium",
      totalMeasures: 3,
      version: "Demo 1.0",
      category: "Governance",
    },
    {
      id: standardIds[2],
      organizationId,
      scope: "tenant",
      standardId: "DEMO-QI-01",
      programId,
      section: "Quality Improvement",
      description: "Synthetic controls for risk and corrective action.",
      criticality: "High",
      totalMeasures: 5,
      version: "Demo 1.0",
      category: "Quality Management",
    },
  ];
  standards.forEach((standard) =>
    add("standards", standard.id ?? "", standard),
  );

  const competencies: Competency[] = [
    ["document-control", "Document Control", "ضبط الوثائق"],
    ["internal-audit", "Internal Audit", "التدقيق الداخلي"],
    ["laboratory-qc", "Laboratory Quality Control", "ضبط جودة المختبر"],
  ].map(([suffix, name, nameAr], index) => ({
    id: competencyIds[index],
    organizationId,
    name: localized(`[DEMO] ${name}`, `[عرض] ${nameAr}`),
    description: localized(
      `Synthetic competency record for ${name}.`,
      `سجل كفاءة اصطناعي لمجال ${nameAr}.`,
    ),
    category: "Quality",
    level: index === 0 ? "basic" : "intermediate",
    validityPeriodMonths: 12,
    relatedTrainingIds: [trainingIds[index]],
    isActive: true,
  }));
  competencies.forEach((competency) =>
    add("competencies", competency.id, { ...competency, scope: "tenant" }),
  );

  const departments: Department[] = [
    ["quality", "Quality Management", "إدارة الجودة"],
    ["laboratory", "Laboratory Services", "خدمات المختبر"],
    ["infection-control", "Infection Prevention", "مكافحة العدوى"],
  ].map(([suffix, name, nameAr], index) => ({
    id: departmentIds[index],
    organizationId,
    name: localized(`[DEMO] ${name}`, `[عرض] ${nameAr}`),
    description: localized(
      "Synthetic department for product demonstrations.",
      "قسم اصطناعي لعرض المنتج.",
    ),
    requiredCompetencyIds: [competencyIds[index]],
    members: [],
    isActive: true,
    createdAt,
    location: branches[index]?.name,
  }));
  departments.forEach((department) =>
    add("departments", department.id, department),
  );

  const trainingPrograms: TrainingProgram[] = [
    ["Document Control Essentials", "أساسيات ضبط الوثائق"],
    ["Internal Audit Fundamentals", "أساسيات التدقيق الداخلي"],
    ["Laboratory QC and Westgard Rules", "ضبط جودة المختبر وقواعد ويستغارد"],
  ].map(([title, titleAr], index) => ({
    id: trainingIds[index],
    organizationId,
    title: localized(`[DEMO] ${title}`, `[عرض] ${titleAr}`),
    description: localized(
      "Synthetic training course; no real learner completion is recorded.",
      "دورة تدريبية اصطناعية؛ لا يتم تسجيل إكمال متعلم حقيقي.",
    ),
    content: localized(
      "Demonstration course content covering responsibilities, evidence, escalation, and review.",
      "محتوى تدريبي تجريبي يغطي المسؤوليات والأدلة والتصعيد والمراجعة.",
    ),
    passingScore: 80,
    quiz: [
      {
        id: idFor(`quiz-${index + 1}`),
        question: localized(
          "Which action best demonstrates controlled improvement?",
          "ما الإجراء الذي يوضح التحسين المنضبط؟",
        ),
        options: [
          localized("Document, review, and verify the change", "توثيق التغيير ومراجعته والتحقق منه"),
          localized("Skip review to save time", "تجاوز المراجعة لتوفير الوقت"),
        ],
        correctOptionIndex: 0,
      },
    ],
    duration: 30 + index * 15,
    category: "Quality",
    frequency: "annual",
    expiryMonths: 12,
    isActive: true,
    createdAt,
  }));
  trainingPrograms.forEach((training) =>
    add("trainingPrograms", training.id, training),
  );

  const project: Project = {
    id: projectId,
    organizationId,
    name: "[DEMO] Organization Accreditation Readiness",
    description:
      "Synthetic project connecting standards, controlled documents, audits, risks, and improvement actions. Contains no real facility or patient data.",
    programId,
    status: "In Progress",
    startDate: date(-45),
    endDate: date(90),
    progress: 62,
    teamMembers: [currentUser.id],
    checklist: standards.map((standard, index) => ({
      id: checklistIds[index],
      item: `[DEMO] ${standard.section} controls reviewed`,
      requirement: standard.description,
      standardId: standard.id ?? "",
      status: index === 0 ? "Compliant" : "Partially Compliant",
      assignedTo: currentUser.id,
      dueDate: date(14 + index * 7),
      actionPlan: "Review the synthetic evidence and complete the demonstration workflow.",
      notes: "Synthetic demonstration item. Not an actual accreditation assessment.",
      evidenceFiles: [],
      comments: [],
      departmentId: departmentIds[index],
    })),
    standardIds,
    departmentId: departmentIds[0],
    departmentIds,
    activityLog: [
      {
        id: idFor("project-activity-created"),
        timestamp: createdAt,
        user: currentUser.name,
        action: localized(
          "Created synthetic accreditation demonstration project",
          "تم إنشاء مشروع اعتماد تجريبي اصطناعي",
        ),
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };
  add("projects", project.id, project);

  const documents: AppDocument[] = [
    {
      id: documentIds[0],
      organizationId,
      name: localized("[DEMO] Document Control Policy", "[عرض] سياسة ضبط الوثائق"),
      type: "Policy",
      documentNumber: "DEMO-POL-001",
      isControlled: true,
      status: "Approved",
      content: localized(
        "Synthetic policy content for demonstrating review, approval, versioning, and expiry workflows. Not an operational policy.",
        "محتوى سياسة اصطناعي لعرض إجراءات المراجعة والاعتماد والإصدارات والانتهاء. ليست سياسة تشغيلية.",
      ),
      currentVersion: 2,
      uploadedAt: createdAt,
      projectId,
      createdAt,
      version: 2,
      tags: ["synthetic-demo", "document-control"],
      departmentIds: [departmentIds[0]],
      uploadedBy: currentUser.id,
      expiryDate: date(180),
    },
    {
      id: documentIds[1],
      organizationId,
      name: localized("[DEMO] Internal Audit Procedure", "[عرض] إجراء التدقيق الداخلي"),
      type: "Procedure",
      documentNumber: "DEMO-PROC-002",
      isControlled: true,
      status: "Under Review",
      content: localized(
        "Synthetic procedure for demonstrating document collaboration and approval.",
        "إجراء اصطناعي لعرض التعاون على الوثائق واعتمادها.",
      ),
      currentVersion: 1,
      uploadedAt: createdAt,
      projectId,
      createdAt,
      tags: ["synthetic-demo", "audit"],
      departmentIds: [departmentIds[0]],
      uploadedBy: currentUser.id,
      reviewers: [currentUser.id],
      approvalChain: [
        { step: 1, reviewerId: currentUser.id, status: "pending" },
      ],
    },
    {
      id: documentIds[2],
      organizationId,
      name: localized("[DEMO] Laboratory QC Procedure", "[عرض] إجراء ضبط جودة المختبر"),
      type: "Procedure",
      documentNumber: "DEMO-PROC-003",
      isControlled: true,
      status: "Draft",
      content: localized(
        "Synthetic QC procedure for demonstrating laboratory evidence and training links.",
        "إجراء اصطناعي لضبط الجودة لعرض أدلة المختبر وروابط التدريب.",
      ),
      currentVersion: 1,
      uploadedAt: createdAt,
      projectId,
      createdAt,
      tags: ["synthetic-demo", "laboratory"],
      departmentIds: [departmentIds[1]],
      uploadedBy: currentUser.id,
    },
  ];
  documents.forEach((document) =>
    add("documents", document.id, document),
  );

  const risks: Risk[] = [
    {
      id: idFor("risk-document-review"),
      organizationId,
      title: "[DEMO] Overdue controlled-document review",
      description: "Synthetic risk used to demonstrate risk scoring and mitigation tracking.",
      likelihood: 3,
      impact: 4,
      level: "High",
      ownerId: currentUser.id,
      status: "Open",
      mitigationPlan: "Demonstrate review assignment, evidence linking, and residual risk scoring.",
      createdAt,
      reviewDate: date(30),
      category: "Document Control",
      affectedStandardIds: [standardIds[0]],
      department: departments[0].name.en,
    },
    {
      id: idFor("risk-qc-trend"),
      organizationId,
      title: "[DEMO] Quality-control trend requires review",
      description: "Synthetic QC trend for demonstrating risk and CAPA links.",
      likelihood: 2,
      impact: 5,
      level: "High",
      ownerId: currentUser.id,
      status: "Mitigated",
      mitigationPlan: "Review control trend, confirm containment, and verify corrective action.",
      createdAt,
      reviewDate: date(14),
      category: "Laboratory Quality",
      affectedStandardIds: [standardIds[2]],
      department: departments[1].name.en,
    },
  ];
  risks.forEach((risk) => add("risks", risk.id, risk));

  const auditPlanId = idFor("audit-plan-quarterly");
  const auditId = idFor("audit-internal-q1");
  const auditFindingId = idFor("audit-finding-training");
  const auditPlan: AuditPlan = {
    id: auditPlanId,
    organizationId,
    name: "[DEMO] Quarterly Quality-System Audit",
    projectId,
    standardSection: "DEMO-AU-01",
    frequency: "monthly",
    itemCount: 3,
    assignedAuditorId: currentUser.id,
    scope: "Synthetic document-control and laboratory-quality sample.",
    objectives: "Demonstrate audit planning, execution, findings, and follow-up.",
    startDate: date(-14),
    endDate: date(14),
    status: "in-progress",
  };
  add("auditPlans", auditPlan.id, auditPlan);

  const auditFinding: AuditFinding = {
    id: auditFindingId,
    organizationId,
    auditId,
    standardId: standardIds[1],
    checklistItemId: checklistIds[1],
    severity: "minor",
    title: "[DEMO] Training evidence needs follow-up",
    description: "Synthetic finding; no actual staff competency is being assessed.",
    evidence: "Demonstration evidence reference only.",
    correctiveAction: "Complete the sample course and attach evidence.",
    assignedTo: currentUser.id,
    dueDate: date(21),
    status: "open",
    createdAt,
  };
  const audit: Audit = {
    id: auditId,
    organizationId,
    planId: auditPlanId,
    dateConducted: date(-2),
    auditorId: currentUser.id,
    results: project.checklist.map((item, index) => ({
      checklistItemId: item.id,
      isCompliant: index === 0,
      auditorNotes: "Synthetic demonstration observation.",
    })),
    status: "in-progress",
    findings: [auditFinding],
    recommendations: "Use the sample evidence to demonstrate follow-up and closure.",
    followUpDate: date(21),
    summary: "Synthetic internal audit record; not an actual facility audit.",
  };
  add("audits", audit.id, audit);
  add("auditFindings", auditFinding.id, auditFinding);

  const incidentId = idFor("incident-equipment");
  const incident: IncidentReport = {
    id: incidentId,
    organizationId,
    incidentDate: date(-3),
    location: "[DEMO] Chemistry section",
    type: "Equipment Malfunction",
    severity: "Moderate",
    description: "Synthetic equipment interruption scenario; no patient data is included.",
    status: "Under Investigation",
    reportedBy: currentUser.id,
    investigatorId: currentUser.id,
    correctiveActionIds: [idFor("capa-lab-qc")],
    department: departments[1].name.en,
    linkedRiskIds: [risks[1].id],
    contributingFactors: "Synthetic training scenario.",
    potentialConsequences: "Demonstration-only operational delay.",
    preventiveActionTaken: "Use the sample record to demonstrate review and action tracking.",
    updatedAt: createdAt,
  };
  add("incidentReports", incident.id, incident);

  const capaReports: CAPAReport[] = [
    {
      id: idFor("capa-document-review"),
      type: "CAPA",
      title: "[DEMO] Controlled-document review follow-up",
      description: "Synthetic CAPA linked to the sample accreditation project.",
      checklistItemId: checklistIds[0],
      sourceProjectId: projectId,
      sourceStandardId: standardIds[0],
      assignedTo: currentUser.id,
      dueDate: date(21),
      rootCause: "Synthetic workflow example: review cadence was not monitored.",
      correctiveAction: "Demonstrate controlled review and approval.",
      preventiveAction: "Demonstrate a recurring review reminder and effectiveness check.",
      linkedDocumentIds: [documentIds[0]],
      status: "In Progress",
      pdcaStage: "Do",
      createdAt,
      updatedAt: createdAt,
      projectName: project.name,
      effectivenessCheck: {
        required: true,
        completed: false,
        dueDate: date(45),
      },
    },
    {
      id: idFor("capa-lab-qc"),
      type: "CAPA",
      title: "[DEMO] QC trend investigation",
      description: "Synthetic CAPA for the laboratory QC demonstration.",
      checklistItemId: checklistIds[2],
      sourceProjectId: projectId,
      sourceStandardId: standardIds[2],
      assignedTo: currentUser.id,
      dueDate: date(14),
      rootCause: "Synthetic example: control drift following a reagent-lot change.",
      correctiveAction: "Review control results and document corrective action.",
      preventiveAction: "Demonstrate lot verification and competency follow-up.",
      status: "In Progress",
      pdcaStage: "Check",
      createdAt,
      updatedAt: createdAt,
      projectName: project.name,
    },
  ];
  capaReports.forEach((capa) => add("capaReports", capa.id, capa));

  const changeRequestId = idFor("change-qc-review");
  const changeRequest: ChangeRequest = {
    id: changeRequestId,
    title: "[DEMO] Update QC review cadence",
    description: "Synthetic change-control example for a controlled process update.",
    changeType: "process",
    priority: "medium",
    status: "under_review",
    requestedBy: currentUser.id,
    requestedByName: currentUser.name,
    dateRequested: now,
    businessJustification: "Demonstrate impact analysis, approvals, and implementation workflow.",
    expectedBenefits: "A synthetic scenario for reviewing change-control functionality.",
    detailedDescription: "Update a fictional QC review checklist and verify training evidence.",
    scope: "Synthetic laboratory QC workflow only.",
    impact: {
      id: idFor("change-impact-qc-review"),
      changeId: changeRequestId,
      affectedSystems: ["[DEMO] Laboratory Quality"],
      affectedProcesses: ["[DEMO] QC review"],
      affectedDocuments: [documentIds[2]],
      dependentChanges: [],
      riskAssessment: "Synthetic impact assessment; no live process is affected.",
      riskLevel: "moderate",
      mitigation: "Review the sample document and complete a mock verification.",
      backoutPlan: "Restore the prior synthetic procedure version.",
      estimatedImplementationHours: 2,
      estimatedTestingHours: 1,
      dateCreated: now,
      lastUpdated: now,
    },
    approvals: [],
    requiredApprovals: 1,
    plannedStartDate: new Date(now.getTime() + 7 * 86_400_000),
    plannedEndDate: new Date(now.getTime() + 14 * 86_400_000),
    supportingDocuments: [documentIds[2]],
    auditTrail: [
      {
        id: idFor("change-audit-created"),
        timestamp: now,
        action: "created",
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        details: { syntheticDemo: true },
      },
    ],
    tags: ["synthetic-demo", "quality"],
    createdAt: now,
    updatedAt: now,
    updatedBy: currentUser.id,
  };
  add("changeRequests", changeRequest.id, changeRequest);

  const supplierId = idFor("supplier-demo-diagnostics");
  const supplier: Supplier = {
    id: supplierId,
    name: "[DEMO] Example Diagnostics Supplier",
    contactPerson: "Demo Contact",
    email: "demo-supplier@example.invalid",
    phone: "+0000000000",
    address: "Synthetic address",
    city: "Demo City",
    state: "Demo Region",
    country: "Synthetic",
    postalCode: "00000",
    type: "Laboratory supplies",
    categories: ["[DEMO] Reagents", "[DEMO] Equipment"],
    status: "conditional",
    riskLevel: "medium",
    scorecard: {
      id: idFor("supplier-scorecard"),
      supplierId,
      overallScore: 78,
      qualityScore: 82,
      deliveryScore: 74,
      responsiveness: 80,
      complianceScore: 76,
      lastEvaluationDate: now,
      nextEvaluationDate: new Date(now.getTime() + 90 * 86_400_000),
      history: [],
    },
    certifications: [],
    contracts: [],
    auditHistory: [],
    nonConformances: [],
    correctionPlans: [],
    notes: "Synthetic supplier. Do not contact; the .invalid email is intentionally non-deliverable.",
    createdAt: now,
    updatedAt: now,
    createdBy: currentUser.id,
    updatedBy: currentUser.id,
  };
  add("suppliers", supplier.id, supplier);

  const supplierAudit: SupplierAudit = {
    id: idFor("supplier-audit-demo"),
    supplierId,
    type: "quality",
    status: "completed",
    scheduledDate: new Date(now.getTime() - 7 * 86_400_000),
    actualDate: new Date(now.getTime() - 7 * 86_400_000),
    completionDate: new Date(now.getTime() - 6 * 86_400_000),
    auditedBy: currentUser.id,
    findings: [
      {
        id: idFor("supplier-audit-finding-demo"),
        category: "minor",
        description: "Synthetic sample finding for supplier audit follow-up.",
        evidence: "Demonstration evidence only.",
        correctionRequired: true,
        correctionPlan: "Complete the sample corrective action.",
        dueDate: new Date(now.getTime() + 14 * 86_400_000),
        status: "open",
        assignedTo: currentUser.id,
      },
    ],
    overallRating: 3,
    comments: "Synthetic supplier audit; no real supplier was assessed.",
    attachments: [],
    createdAt: now,
    updatedAt: now,
  };
  add("supplierAudits", supplierAudit.id, supplierAudit);

  const nonConformanceId = idFor("supplier-nonconformance-demo");
  const correctionPlanId = idFor("supplier-correction-plan-demo");
  add("nonConformances", nonConformanceId, {
    id: nonConformanceId,
    supplierId,
    type: "quality",
    severity: "minor",
    description: "Synthetic sample non-conformance for supplier-quality workflow testing.",
    reportedDate: now,
    reportedBy: currentUser.id,
    status: "under-review",
    dueDate: new Date(now.getTime() + 14 * 86_400_000),
    attachments: [],
  });
  add("correctionPlans", correctionPlanId, {
    id: correctionPlanId,
    supplierId,
    nonConformanceId,
    title: "[DEMO] Supplier corrective-action plan",
    description: "Synthetic corrective-action plan for demonstrating assignment and verification.",
    rootCause: "Synthetic scenario: a sample shipment checklist was incomplete.",
    correctionActions: [
      {
        id: idFor("supplier-correction-action-demo"),
        action: "Complete the sample checklist and attach demonstration evidence.",
        owner: currentUser.id,
        dueDate: new Date(now.getTime() + 14 * 86_400_000),
        status: "pending",
      },
    ],
    preventiveActions: ["Demonstrate a recurring checklist review."],
    dueDate: new Date(now.getTime() + 14 * 86_400_000),
    owner: currentUser.id,
    status: "open",
    createdAt: now,
    updatedAt: now,
  });

  const roundingTemplateId = idFor("rounding-template-safety");
  const roundingTemplate: RoundingTemplate = {
    id: roundingTemplateId,
    name: "[DEMO] Safety and environment round",
    description: "Synthetic questions for demonstrating quality-round scheduling and findings.",
    department: departments[1].name.en,
    category: "Environment",
    items: [
      {
        id: idFor("rounding-item-storage"),
        category: "Storage",
        question: "[DEMO] Are sample storage areas labeled and monitored?",
        expectedEvidence: "Demonstration-only checklist evidence.",
        weight: 50,
        order: 1,
      },
      {
        id: idFor("rounding-item-safety"),
        category: "Safety",
        question: "[DEMO] Are safety checks recorded?",
        expectedEvidence: "Demonstration-only checklist evidence.",
        weight: 50,
        order: 2,
      },
    ],
    isActive: true,
    createdBy: currentUser.id,
    createdAt,
  };
  add("rounding_templates", roundingTemplate.id, roundingTemplate);

  const qualityRoundId = idFor("quality-round-laboratory");
  const roundingObservations: QualityRound["observations"] = [
    {
      itemId: roundingTemplate.items[0].id,
      question: roundingTemplate.items[0].question,
      result: "Compliant",
      notes: "Synthetic positive observation.",
    },
    {
      itemId: roundingTemplate.items[1].id,
      question: roundingTemplate.items[1].question,
      result: "Non-Compliant",
      notes: "Synthetic finding used to demonstrate follow-up.",
      findingSeverity: "Minor",
    },
  ];
  const roundingFinding: RoundingFinding = {
    id: idFor("rounding-finding-safety"),
    roundId: qualityRoundId,
    observation: roundingObservations[1],
    severity: "Minor",
    description: "Synthetic safety-round finding; no real hazard is reported.",
    assignedTo: currentUser.id,
    assignedToName: "[DEMO] Organization Admin",
    capaId: capaReports[0].id,
    status: "In Progress",
    dueDate: date(14),
    createdAt,
  };
  const qualityRound: QualityRound = {
    id: qualityRoundId,
    organizationId,
    templateId: roundingTemplateId,
    templateName: roundingTemplate.name,
    department: departments[1].name.en,
    area: "[DEMO] Laboratory",
    scheduledDate: date(-1),
    status: "Completed",
    frequency: "Monthly",
    rounderId: currentUser.id,
    rounderName: "[DEMO] Organization Admin",
    observations: roundingObservations,
    findings: [roundingFinding],
    overallScore: 50,
    complianceRate: 50,
    notes: "Synthetic quality round; not an actual inspection.",
    createdAt,
    updatedAt: createdAt,
  };
  add("quality_rounds", qualityRound.id, qualityRound);
  add("rounding_findings", roundingFinding.id, roundingFinding);

  const events: CustomCalendarEvent[] = [
    {
      id: idFor("event-mock-audit"),
      type: "Custom",
      title: localized("[DEMO] Mock audit follow-up", "[عرض] متابعة التدقيق التجريبي"),
      description: localized(
        "Synthetic calendar entry for demonstration.",
        "حدث تقويم اصطناعي للعرض.",
      ),
      date: date(7),
      color: "brand-primary",
    },
    {
      id: idFor("event-document-review"),
      type: "Custom",
      title: localized("[DEMO] Document review checkpoint", "[عرض] موعد مراجعة الوثيقة"),
      description: localized(
        "Synthetic reminder; no operational deadline is represented.",
        "تذكير اصطناعي؛ لا يمثل موعدًا تشغيليًا.",
      ),
      date: date(21),
      color: "brand-secondary",
    },
  ];
  events.forEach((event) => add("customEvents", event.id, event));

  const nowDate = now.toISOString();
  add("activity_logs", idFor("activity-demo-seed"), {
    id: idFor("activity-demo-seed"),
    organizationId,
    timestamp: nowDate,
    user: currentUser.id,
    action: "[DEMO] Synthetic marketing demonstration data created",
    details: `Seed version ${DEMO_SEED_VERSION}; no real patient data or staff accounts were created.`,
    type: "demo-data",
    resourceId: ID_PREFIX,
  });

  const reportTemplate = REPORT_TEMPLATES[0];
  add("reportDefinitions", idFor("report-compliance-overview"), {
    ...reportTemplate,
    id: idFor("report-compliance-overview"),
    name: "[DEMO] Compliance Status Report",
    description: "Synthetic report definition using demonstration-only records.",
    createdBy: currentUser.id,
    createdAt,
    updatedAt: createdAt,
    generationCount: 0,
    organizationId,
    syntheticDemo: true,
    demoSeedVersion: DEMO_SEED_VERSION,
  });

  WORKFLOW_TEMPLATES.slice(0, 2).forEach((template, index) => {
    const id = idFor(`workflow-${index + 1}`);
    add("workflowDefinitions", id, {
      ...template,
      id,
      name: `[DEMO] ${template.name}`,
      createdBy: currentUser.id,
      createdAt,
      updatedAt: createdAt,
      executionCount: 0,
      organizationId,
    });
  });

  const equipmentId = (id: string): string => idFor(`lab-${id}`);
  const analyteId = (id: string): string => idFor(`lab-${id}`);
  const eventId = (id: string): string => idFor(`lab-${id}`);
  const capaId = (id: string): string => idFor(`lab-${id}`);
  const riskId = (id: string): string => idFor(`lab-${id}`);

  const labOpsData: LabOpsPersistedData = {
    equipment: SEED_EQUIPMENT.map((item) => ({
      ...item,
      id: equipmentId(item.id),
      name: `[DEMO] ${item.name}`,
      assetTag: `DEMO-${item.assetTag ?? item.id}`,
      notes: "Synthetic equipment record. Not a real asset.",
      createdAt,
      updatedAt: createdAt,
    })),
    calibrations: SEED_CALIBRATION_RECORDS.map((item) => ({
      ...item,
      id: equipmentId(item.id),
      equipmentId: equipmentId(item.equipmentId),
      equipmentName: `[DEMO] ${item.equipmentName}`,
      calibratedBy: "[DEMO] Service engineer",
      vendor: "[DEMO] Example Service Co.",
      notes: "Synthetic calibration record.",
      createdAt,
    })),
    maintenanceLogs: SEED_MAINTENANCE_LOGS.map((item) => ({
      ...item,
      id: equipmentId(item.id),
      equipmentId: equipmentId(item.equipmentId),
      equipmentName: `[DEMO] ${item.equipmentName}`,
      performedBy: "[DEMO] Service engineer",
      vendorName: "[DEMO] Example Service Co.",
      createdAt,
      updatedAt: createdAt,
    })),
    reagents: SEED_REAGENTS.map((item) => ({
      ...item,
      id: equipmentId(item.id),
      name: `[DEMO] ${item.name}`,
      supplierId,
      supplierName: supplier.name,
      associatedEquipmentId: item.associatedEquipmentId
        ? equipmentId(item.associatedEquipmentId)
        : undefined,
      notes: "Synthetic reagent inventory record. Not for clinical use.",
      createdAt,
      updatedAt: createdAt,
    })),
    reagentUsageLogs: [],
    proficiencyTests: SEED_PROFICIENCY_TESTS.map((item) => ({
      ...item,
      id: equipmentId(item.id),
      program: `[DEMO] ${item.program}`,
      provider: "[DEMO] Synthetic proficiency testing provider",
      notes: "Synthetic proficiency-testing result. Not a real external submission.",
      createdAt,
      updatedAt: createdAt,
    })),
    qualityEvents: SEED_QUALITY_EVENTS.map((item) => ({
      ...item,
      id: eventId(item.id),
      title: `[DEMO] ${item.title}`,
      description: `Synthetic quality event. ${item.description}`,
      capaId: item.capaId ? capaId(item.capaId) : undefined,
      createdAt,
      updatedAt: createdAt,
    })),
    capaRecords: SEED_CAPA_RECORDS.map((item) => ({
      ...item,
      id: capaId(item.id),
      title: `[DEMO] ${item.title}`,
      sourceEventId: item.sourceEventId
        ? eventId(item.sourceEventId)
        : undefined,
      owner: "[DEMO] Laboratory Supervisor",
      createdAt,
      updatedAt: createdAt,
    })),
    qualityRisks: SEED_QUALITY_RISKS.map((item) => ({
      ...item,
      id: riskId(item.id),
      sourceEventId: item.sourceEventId
        ? eventId(item.sourceEventId)
        : undefined,
      relatedCapaId: item.relatedCapaId
        ? capaId(item.relatedCapaId)
        : undefined,
      title: `[DEMO] ${item.title}`,
      owner: "[DEMO] Laboratory Supervisor",
      createdAt,
      updatedAt: createdAt,
    })),
    competencyRecords: SEED_COMPETENCY_RECORDS.map((item, index) => ({
      ...item,
      id: equipmentId(item.id),
      staffId: idFor(`lab-demo-staff-${index + 1}`),
      staffName: `[DEMO] Technologist ${index + 1}`,
      assessor: "[DEMO] Laboratory Supervisor",
      notes: "Synthetic competency record; does not represent an actual employee.",
      createdAt,
      updatedAt: createdAt,
    })),
    iqcAnalytes: SEED_IQC_ANALYTES.map((item) => ({
      ...item,
      id: analyteId(item.id),
      equipmentId: equipmentId(item.equipmentId),
      equipmentName: `[DEMO] ${item.equipmentName}`,
      analyteName: `[DEMO] ${item.analyteName}`,
      createdAt,
      updatedAt: createdAt,
    })),
    iqcResults: SEED_IQC_RESULTS.map((item) => ({
      ...item,
      id: analyteId(item.id),
      analyteId: analyteId(item.analyteId),
      equipmentId: equipmentId(item.equipmentId),
      analyteName: `[DEMO] ${item.analyteName}`,
      measuredBy: "[DEMO] Technologist",
      measuredByStaffId: idFor("lab-demo-staff-1"),
      operatorAuthorizationStatus: "authorized",
      operatorCompetencyRecordId: equipmentId(
        SEED_COMPETENCY_RECORDS[0].id,
      ),
      linkedQualityEventId: item.linkedQualityEventId
        ? eventId(item.linkedQualityEventId)
        : undefined,
      linkedRiskRecordId: item.linkedRiskRecordId
        ? riskId(item.linkedRiskRecordId)
        : undefined,
      linkedCapaId: item.linkedCapaId ? capaId(item.linkedCapaId) : undefined,
      note: "Synthetic QC result; contains no patient information.",
      createdAt: item.measuredAt,
    })),
  };
  add("labOpsData", organizationId, {
    ...labOpsData,
    organizationId,
    updatedAt: createdAt,
    syntheticDemo: true,
    demoSeedVersion: DEMO_SEED_VERSION,
  });

  return records;
}

export function getDemoSeedCollectionCounts(
  records: DemoSeedRecord[],
): Record<string, number> {
  return records.reduce<Record<string, number>>((counts, record) => {
    counts[record.collectionName] = (counts[record.collectionName] ?? 0) + 1;
    return counts;
  }, {});
}

export function mergeLabOpsDemoData(
  currentData: DocumentData,
  seededData: DocumentData,
  organizationId: string,
  currentDocumentExists: boolean,
  updatedAt: string,
): { data: DocumentData; added: number } {
  if (currentDocumentExists && currentData.organizationId !== organizationId) {
    throw new Error(
      "The existing Lab Operations record is not owned by Accreditex; no data was changed.",
    );
  }

  const arrayFields = [
    "equipment",
    "calibrations",
    "maintenanceLogs",
    "reagents",
    "reagentUsageLogs",
    "proficiencyTests",
    "qualityEvents",
    "capaRecords",
    "qualityRisks",
    "competencyRecords",
    "iqcAnalytes",
    "iqcResults",
  ] as const;
  const data: DocumentData = { ...currentData };
  let added = 0;

  for (const field of arrayFields) {
    const existing = currentData[field];
    if (existing !== undefined && !Array.isArray(existing)) {
      throw new Error(
        `The existing Lab Operations field "${field}" is not an array; no data was changed.`,
      );
    }
    const currentItems = (existing ?? []) as Array<{ id?: string }>;
    const seededItems = (seededData[field] ?? []) as Array<{ id?: string }>;
    if (seededItems.some((item) => typeof item.id !== "string")) {
      throw new Error(
        `The synthetic Lab Operations field "${field}" contains a record without an ID.`,
      );
    }
    const existingIds = new Set(
      currentItems.flatMap((item) =>
        typeof item.id === "string" ? [item.id] : [],
      ),
    );
    const additions: Array<{ id?: string }> = [];
    for (const item of seededItems) {
      if (typeof item.id === "string" && !existingIds.has(item.id)) {
        existingIds.add(item.id);
        additions.push(item);
      }
    }
    added += additions.length;
    data[field] = [...currentItems, ...additions];
  }

  data.organizationId = organizationId;
  data.updatedAt = updatedAt;
  data.containsSyntheticDemoData = true;
  if (!currentDocumentExists) {
    data.syntheticDemo = true;
  }
  data.demoSeedVersion = DEMO_SEED_VERSION;
  return { data, added };
}

export async function downloadDemoSeedBackup(
  organizationId: string,
  currentUser: User,
): Promise<void> {
  if (
    organizationId !== DEMO_SEED_ORGANIZATION_ID ||
    currentUser.role !== "Admin" ||
    currentUser.organizationId !== organizationId
  ) {
    throw new Error("An Accreditex organization admin is required.");
  }

  const backup: Record<string, unknown> = {
    organizationId,
    exportedAt: new Date().toISOString(),
    purpose: "Pre-seed backup for synthetic Accreditex marketing data",
    collections: {},
  };
  const collectionData = backup.collections as Record<string, unknown>;

  for (const collectionName of DEMO_COLLECTIONS) {
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        where("organizationId", "==", organizationId),
      ),
    );
    collectionData[collectionName] = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `accreditex-pre-demo-seed-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function seedSyntheticDemoData(
  organizationId: string,
  currentUser: User,
): Promise<DemoSeedResult> {
  const records = buildSyntheticDemoSeed(organizationId, currentUser);
  const labOpsRecord = records.find(
    (record) => record.collectionName === "labOpsData",
  );
  const regularRecords = records.filter(
    (record) => record.collectionName !== "labOpsData",
  );

  const result = await runTransaction(db, async (transaction) => {
    const labOpsRef = doc(db, "labOpsData", organizationId);
    const labOpsRecordsRef = doc(db, "labOpsRecords", organizationId);
    const [labOpsSnapshot, labOpsRecordsSnapshot, ...recordSnapshots] =
      await Promise.all([
        transaction.get(labOpsRef),
        transaction.get(labOpsRecordsRef),
        ...regularRecords.map((record) =>
          transaction.get(doc(db, record.collectionName, record.id)),
        ),
      ]);

    if (labOpsRecordsSnapshot.exists()) {
      throw new Error(
        "Lab Operations record-level storage is enabled for this organization; demo seeding is paused to protect that data.",
      );
    }

    const writes: DemoSeedRecord[] = [];
    let skipped = 0;
    regularRecords.forEach((record, index) => {
      const snapshot = recordSnapshots[index];
      if (snapshot.exists()) {
        if (snapshot.data().demoSeedVersion !== DEMO_SEED_VERSION) {
          throw new Error(
            `Cannot seed because ${record.collectionName}/${record.id} already exists and is not this demo dataset.`,
          );
        }
        skipped += 1;
        return;
      }
      writes.push(record);
    });

    let labOpsRecordsAdded = 0;
    let labOpsData: DocumentData | undefined;
    let labOpsNeedsWrite = false;
    if (labOpsRecord) {
      const currentData = labOpsSnapshot.exists()
        ? labOpsSnapshot.data()
        : {};
      const merged = mergeLabOpsDemoData(
        currentData,
        labOpsRecord.data,
        organizationId,
        labOpsSnapshot.exists(),
        new Date().toISOString(),
      );
      labOpsData = merged.data;
      labOpsRecordsAdded = merged.added;
      labOpsNeedsWrite = !labOpsSnapshot.exists() || merged.added > 0;
    }

    for (const record of writes) {
      transaction.set(doc(db, record.collectionName, record.id), record.data);
    }
    if (labOpsRecord && labOpsData && labOpsNeedsWrite) {
      transaction.set(labOpsRef, labOpsData);
    }

    return {
      created: writes.length,
      skipped,
      labOpsRecordsAdded,
    };
  });

  return result;
}

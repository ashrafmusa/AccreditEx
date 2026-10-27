import {
  AppDocument,
  AuditPlan,
  ComplianceStatus,
  Department,
  NavigationState,
  Project,
  Risk,
  TrainingProgram,
} from "@/types";

export type ReadinessCheckStatus = "pass" | "warning" | "critical";

export interface AuditReadinessCheck {
  id:
    | "evidence_integrity"
    | "document_hygiene"
    | "capa_closure"
    | "risk_mitigation"
    | "internal_audits"
    | "workforce_departments";
  titleEn: string;
  titleAr: string;
  status: ReadinessCheckStatus;
  score: number;
  metricBadge: string;
  summaryEn: string;
  summaryAr: string;
  blindSpotEn?: string;
  blindSpotAr?: string;
  actionLabelEn: string;
  actionLabelAr: string;
  navigation: NavigationState;
}

export interface AuditReadinessReport {
  overallScore: number;
  tier: "survey_ready" | "attention_needed" | "high_risk";
  totalProjects: number;
  totalChecklistItems: number;
  unverifiedCompliantItems: number;
  expiredDocuments: number;
  openHighRisks: number;
  overdueCapas: number;
  checks: AuditReadinessCheck[];
  generatedAt: string;
}

export function evaluateAuditReadiness(params: {
  projects: Project[];
  documents: AppDocument[];
  risks: Risk[];
  auditPlans: AuditPlan[];
  departments: Department[];
  trainingPrograms: TrainingProgram[];
}): AuditReadinessReport {
  const {
    projects = [],
    documents = [],
    risks = [],
    auditPlans = [],
    departments = [],
    trainingPrograms = [],
  } = params;

  const activeProjects = projects.filter((p) => !p.archived);
  const allItems = activeProjects.flatMap((p) => p.checklist || []);
  const applicableItems = allItems.filter(
    (item) => item.status !== ComplianceStatus.NotApplicable,
  );

  // 1. Evidence Integrity & False-Compliance Check
  const compliantOrPartial = applicableItems.filter(
    (item) =>
      item.status === ComplianceStatus.Compliant ||
      item.status === ComplianceStatus.PartiallyCompliant,
  );
  const unverifiedCompliantItems = compliantOrPartial.filter(
    (item) => !item.evidenceFiles || item.evidenceFiles.length === 0,
  ).length;

  let evidenceScore = 0;
  if (applicableItems.length > 0) {
    const verifiedCompliant = compliantOrPartial.filter(
      (item) => item.evidenceFiles && item.evidenceFiles.length > 0,
    ).length;
    const rawComplianceRatio = compliantOrPartial.length / applicableItems.length;
    const verificationRatio =
      compliantOrPartial.length > 0
        ? verifiedCompliant / compliantOrPartial.length
        : 1;
    evidenceScore = Math.round(
      (rawComplianceRatio * 0.6 + verificationRatio * 0.4) * 100,
    );
  } else if (activeProjects.length > 0) {
    evidenceScore = 50;
  }

  const evidenceStatus: ReadinessCheckStatus =
    applicableItems.length === 0 || unverifiedCompliantItems > 5
      ? "critical"
      : unverifiedCompliantItems > 0 || evidenceScore < 75
        ? "warning"
        : "pass";

  // 2. Controlled Document Hygiene Check
  const now = new Date();
  const controlledDocs = documents.filter((d) => d.isControlled !== false);
  const approvedDocs = controlledDocs.filter((d) => d.status === "Approved");
  const expiredDocuments = controlledDocs.filter((d) => {
    const dateStr = d.reviewDate || d.expiryDate;
    if (!dateStr) return false;
    const parsed = new Date(dateStr);
    return !Number.isNaN(parsed.getTime()) && parsed < now;
  }).length;
  const pendingDocs = controlledDocs.filter(
    (d) =>
      d.status === "Draft" ||
      d.status === "Pending Review" ||
      d.status === "Under Review",
  ).length;

  let docScore = 100;
  if (controlledDocs.length === 0) {
    docScore = 25;
  } else {
    const approvalRatio = approvedDocs.length / controlledDocs.length;
    const expiryPenalty = Math.min(40, expiredDocuments * 10);
    docScore = Math.max(0, Math.round(approvalRatio * 100 - expiryPenalty));
  }

  const docStatus: ReadinessCheckStatus =
    controlledDocs.length === 0 || expiredDocuments > 2
      ? "critical"
      : expiredDocuments > 0 || pendingDocs > 3
        ? "warning"
        : "pass";

  // 3. CAPA & Corrective Action Closure Check
  const allCapas = activeProjects.flatMap((p) => p.capaReports || []);
  const openCapas = allCapas.filter(
    (c: any) =>
      c.status !== "Closed" &&
      c.status !== "Completed" &&
      c.status !== "Verified",
  );
  const overdueCapas = openCapas.filter((c: any) => {
    if (!c.dueDate) return false;
    const due = new Date(c.dueDate);
    return !Number.isNaN(due.getTime()) && due < now;
  }).length;
  const capasMissingRca = openCapas.filter(
    (c: any) => !c.rootCause || !c.correctiveAction,
  ).length;

  let capaScore = 100;
  if (overdueCapas > 0 || capasMissingRca > 0) {
    capaScore = Math.max(
      20,
      100 - overdueCapas * 20 - capasMissingRca * 10,
    );
  }
  const capaStatus: ReadinessCheckStatus =
    overdueCapas > 2
      ? "critical"
      : overdueCapas > 0 || capasMissingRca > 0
        ? "warning"
        : "pass";

  // 4. Risk Register & Patient Safety Check
  const openRisks = risks.filter((r) => r.status === "Open");
  const openHighRisks = openRisks.filter(
    (r) => (r.likelihood || 1) * (r.impact || 1) >= 12,
  ).length;
  const unmitigatedRisks = openRisks.filter(
    (r) => !r.mitigationPlan || r.mitigationPlan.trim().length < 5,
  ).length;

  let riskScore = 90;
  if (risks.length === 0) {
    riskScore = 60;
  } else {
    riskScore = Math.max(
      15,
      100 - openHighRisks * 15 - unmitigatedRisks * 10,
    );
  }
  const riskStatus: ReadinessCheckStatus =
    openHighRisks > 2
      ? "critical"
      : openHighRisks > 0 || unmitigatedRisks > 0 || risks.length === 0
        ? "warning"
        : "pass";

  // 5. Internal Audit & Mock Survey Readiness
  const mockSurveysCount = activeProjects.reduce(
    (sum, p) => sum + (p.mockSurveys?.length || 0),
    0,
  );
  const totalAuditsScheduled = auditPlans.length + mockSurveysCount;
  const auditScore =
    totalAuditsScheduled >= 2 ? 100 : totalAuditsScheduled === 1 ? 75 : 40;
  const auditStatus: ReadinessCheckStatus =
    totalAuditsScheduled === 0
      ? "warning"
      : "pass";

  // 6. Workforce & Departmental Structure Check
  const deptCount = departments.length;
  const trainingCount = trainingPrograms.length;
  const workforceScore =
    deptCount >= 3 && trainingCount >= 1
      ? 100
      : deptCount >= 1
        ? 75
        : 40;
  const workforceStatus: ReadinessCheckStatus =
    deptCount === 0 ? "warning" : "pass";

  const checks: AuditReadinessCheck[] = [
    {
      id: "evidence_integrity",
      titleEn: "Standards & Evidence Integrity",
      titleAr: "تكامل المعايير وأدلة الامتثال",
      status: evidenceStatus,
      score: evidenceScore,
      metricBadge: `${compliantOrPartial.length}/${applicableItems.length} items`,
      summaryEn:
        applicableItems.length === 0
          ? "No project checklist items loaded yet."
          : `${compliantOrPartial.length} of ${applicableItems.length} standards addressed across ${activeProjects.length} active project(s).`,
      summaryAr:
        applicableItems.length === 0
          ? "لا توجد عناصر فحص محملة في المشاريع حالياً."
          : `تمت معالجة ${compliantOrPartial.length} من أصل ${applicableItems.length} معياراً عبر ${activeProjects.length} مشروع نشط.`,
      blindSpotEn:
        unverifiedCompliantItems > 0
          ? `Blind Spot: ${unverifiedCompliantItems} item(s) marked Compliant/Partial have 0 attached evidence files.`
          : undefined,
      blindSpotAr:
        unverifiedCompliantItems > 0
          ? `فجوة تدقيق: ${unverifiedCompliantItems} معيار مسجل كمطابق بدون أي مستند دليل مرفق.`
          : undefined,
      actionLabelEn: "Verify Checklists",
      actionLabelAr: "مراجعة قوائم الفحص",
      navigation: { view: "projects" },
    },
    {
      id: "document_hygiene",
      titleEn: "Controlled Document & Policy Hygiene",
      titleAr: "ضبط الوثائق وصلاحية السياسات",
      status: docStatus,
      score: docScore,
      metricBadge: `${approvedDocs.length}/${controlledDocs.length} approved`,
      summaryEn: `${approvedDocs.length} approved policies/SOPs, ${pendingDocs} in draft/review.`,
      summaryAr: `${approvedDocs.length} سياسة وإجراء معتمد، و${pendingDocs} قيد المراجعة أو المسودة.`,
      blindSpotEn:
        expiredDocuments > 0
          ? `Blind Spot: ${expiredDocuments} controlled document(s) are past their review/expiry date.`
          : controlledDocs.length === 0
            ? "Blind Spot: No controlled policies or SOPs uploaded yet."
            : undefined,
      blindSpotAr:
        expiredDocuments > 0
          ? `فجوة تدقيق: ${expiredDocuments} وثيقة مضبوطة تجاوزت تاريخ المراجعة أو الانتهاء.`
          : controlledDocs.length === 0
            ? "فجوة تدقيق: لم يتم رفع أي سياسات أو إجراءات مضبوطة بعد."
            : undefined,
      actionLabelEn: "Open Document Control",
      actionLabelAr: "فتح ضبط الوثائق",
      navigation: { view: "documentControl" },
    },
    {
      id: "capa_closure",
      titleEn: "CAPA & Root Cause Closure",
      titleAr: "إغلاق الإجراءات التصحيحية وتحليل الجذور",
      status: capaStatus,
      score: capaScore,
      metricBadge: `${openCapas.length} open`,
      summaryEn:
        openCapas.length === 0
          ? "All logged CAPA reports are on track or closed."
          : `${openCapas.length} open CAPA report(s) being tracked.`,
      summaryAr:
        openCapas.length === 0
          ? "جميع تقارير الإجراءات التصحيحية مغلقة أو ضمن المسار."
          : `يوجد ${openCapas.length} تقرير إجراء تصحيحي مفتوح قيد المتابعة.`,
      blindSpotEn:
        overdueCapas > 0
          ? `Blind Spot: ${overdueCapas} CAPA report(s) are overdue for verification.`
          : capasMissingRca > 0
            ? `Blind Spot: ${capasMissingRca} open CAPA(s) lack documented Root Cause Analysis.`
            : undefined,
      blindSpotAr:
        overdueCapas > 0
          ? `فجوة تدقيق: ${overdueCapas} إجراء تصحيحي متأخر عن موعد الإغلاق.`
          : capasMissingRca > 0
            ? `فجوة تدقيق: ${capasMissingRca} إجراء تصحيحي يفتقر لتحليل السبب الجذري.`
            : undefined,
      actionLabelEn: "Review CAPAs",
      actionLabelAr: "مراجعة الإجراءات التصحيحية",
      navigation: { view: "projects" },
    },
    {
      id: "risk_mitigation",
      titleEn: "Clinical & Operational Risk Register",
      titleAr: "سجل المخاطر الإكلينيكية والتشغيلية",
      status: riskStatus,
      score: riskScore,
      metricBadge: `${openHighRisks} high-risk`,
      summaryEn: `${risks.length} total risk(s) logged (${openRisks.length} open).`,
      summaryAr: `إجمالي المخاطر المسجلة ${risks.length} (${openRisks.length} مفتوحة).`,
      blindSpotEn:
        openHighRisks > 0
          ? `Blind Spot: ${openHighRisks} high/critical risk(s) remain open.`
          : risks.length === 0
            ? "Tip: Surveyors require an active facility risk register with mitigation owners."
            : undefined,
      blindSpotAr:
        openHighRisks > 0
          ? `فجوة تدقيق: ${openHighRisks} مخاطر عالية/حرجة لا تزال مفتوحة.`
          : risks.length === 0
            ? "تنبيه: يتطلب المقيمون سجلاً نشطاً للمخاطر مع خطط تخفيف واضحة."
            : undefined,
      actionLabelEn: "Open Risk Hub",
      actionLabelAr: "فتح إدارة المخاطر",
      navigation: { view: "riskHub" },
    },
    {
      id: "internal_audits",
      titleEn: "Internal Audits & Mock Surveys",
      titleAr: "التدقيق الداخلي والمسح التجريبي",
      status: auditStatus,
      score: auditScore,
      metricBadge: `${totalAuditsScheduled} scheduled`,
      summaryEn: `${auditPlans.length} audit plan(s) and ${mockSurveysCount} mock survey(s) recorded.`,
      summaryAr: `تم تسجيل ${auditPlans.length} خطة تدقيق داخلي و${mockSurveysCount} مسح تجريبي.`,
      blindSpotEn:
        totalAuditsScheduled === 0
          ? "Blind Spot: No internal audit plan or mock survey conducted prior to external assessment."
          : undefined,
      blindSpotAr:
        totalAuditsScheduled === 0
          ? "فجوة تدقيق: لم يتم جدولة تدقيق داخلي أو مسح تجريبي قبل زيارة الاعتماد."
          : undefined,
      actionLabelEn: "Open Audit Hub",
      actionLabelAr: "فتح مركز التدقيق",
      navigation: { view: "auditHub" },
    },
    {
      id: "workforce_departments",
      titleEn: "Departments & Staff Competency",
      titleAr: "الأقسام وكفاءة الكادر الصحي",
      status: workforceStatus,
      score: workforceScore,
      metricBadge: `${deptCount} depts · ${trainingCount} trainings`,
      summaryEn: `${deptCount} department(s) and ${trainingCount} training module(s) configured.`,
      summaryAr: `تم إعداد ${deptCount} أقسام و${trainingCount} برامج تدريبية.`,
      blindSpotEn:
        deptCount === 0
          ? "Blind Spot: Configure facility departments to map standards and staff competencies."
          : undefined,
      blindSpotAr:
        deptCount === 0
          ? "فجوة تدقيق: يرجى إضافة أقسام المنشأة لربط المعايير وكفاءات الموظفين."
          : undefined,
      actionLabelEn: "Manage Departments",
      actionLabelAr: "إدارة الأقسام",
      navigation: { view: "departments" },
    },
  ];

  const overallScore = Math.round(
    checks.reduce((acc, c) => acc + c.score, 0) / checks.length,
  );

  const tier: AuditReadinessReport["tier"] =
    overallScore >= 85
      ? "survey_ready"
      : overallScore >= 60
        ? "attention_needed"
        : "high_risk";

  return {
    overallScore,
    tier,
    totalProjects: activeProjects.length,
    totalChecklistItems: applicableItems.length,
    unverifiedCompliantItems,
    expiredDocuments,
    openHighRisks,
    overdueCapas,
    checks,
    generatedAt: new Date().toISOString(),
  };
}

export function exportExecutiveReadinessReportCsv(
  report: AuditReadinessReport,
  organizationName: string = "Healthcare Facility",
): void {
  const headers = [
    "Facility",
    "Generated At",
    "Overall Readiness Score (%)",
    "Readiness Tier",
    "Check Dimension",
    "Status",
    "Dimension Score (%)",
    "Metric",
    "Summary",
    "Audit Blind Spot / Finding",
  ];

  const escapeCsv = (val: string | number | undefined) => {
    const str = String(val ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = report.checks.map((check) =>
    [
      escapeCsv(organizationName),
      escapeCsv(report.generatedAt),
      escapeCsv(report.overallScore),
      escapeCsv(report.tier.toUpperCase()),
      escapeCsv(check.titleEn),
      escapeCsv(check.status.toUpperCase()),
      escapeCsv(check.score),
      escapeCsv(check.metricBadge),
      escapeCsv(check.summaryEn),
      escapeCsv(check.blindSpotEn || "None — Audit Ready"),
    ].join(","),
  );

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  link.download = `accreditex-survey-readiness-${safeName || "facility"}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

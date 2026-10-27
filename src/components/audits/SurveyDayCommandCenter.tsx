import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { aiAgentService } from "@/services/aiAgentService";
import {
  buildAssessorReportPack,
  exportAssessorEvidenceMatrixCsv,
  exportAssessorReportPackPdf,
  recordAssessorPackExportAudit,
} from "@/services/assessorReportPackService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  AppDocument,
  ChecklistItem,
  ComplianceStatus,
  NavigationState,
  Project,
} from "@/types";
import React, { useMemo, useState } from "react";

interface SurveyDayCommandCenterProps {
  setNavigation?: (state: NavigationState) => void;
}

type EvidenceFilter =
  | "all"
  | "verified"
  | "blind_spot"
  | "non_compliant"
  | "has_capa";

const resolveLocalizedText = (
  val: string | { en?: string; ar?: string } | undefined,
  lang: string,
): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return (lang === "ar" ? val.ar : val.en) || val.en || val.ar || "";
};

const SurveyDayCommandCenter: React.FC<SurveyDayCommandCenterProps> = ({
  setNavigation,
}) => {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const toast = useToast();

  const { projects, createCAPA } = useProjectStore();
  const { documents = [], standards = [], risks = [], addRisk } = useAppStore();
  const { currentOrganization } = useTenantStore();
  const { currentUser } = useUserStore();

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archived),
    [projects],
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjects[0]?.id || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<EvidenceFilter>("all");
  const [reviewerName, setReviewerName] = useState("");
  const [signOffNote, setSignOffNote] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [escalatingItemId, setEscalatingItemId] = useState<string | null>(null);

  const selectedProject: Project | null = useMemo(() => {
    if (selectedProjectId === "all") return activeProjects[0] || null;
    return (
      activeProjects.find((p) => p.id === selectedProjectId) ||
      activeProjects[0] ||
      null
    );
  }, [activeProjects, selectedProjectId]);

  const enrichedRows = useMemo(() => {
    const targetProjects =
      selectedProjectId === "all"
        ? activeProjects
        : selectedProject
          ? [selectedProject]
          : [];

    return targetProjects.flatMap((proj) => {
      const checklist = proj.checklist || [];
      const capas = proj.capaReports || [];
      return checklist.map((item: ChecklistItem) => {
        const linkedDocs = (item.evidenceFiles || [])
          .map((docId) => documents.find((d) => d.id === docId))
          .filter((d): d is AppDocument => Boolean(d));

        const linkedCapas = capas.filter(
          (c) => c.checklistItemId === item.id || c.checklistItemId === item.standardId,
        );

        const isCompliantOrPartial =
          item.status === ComplianceStatus.Compliant ||
          item.status === ComplianceStatus.PartiallyCompliant;

        const isBlindSpot = isCompliantOrPartial && linkedDocs.length === 0;
        const isVerified = isCompliantOrPartial && linkedDocs.length > 0;
        const isNonCompliant = item.status === ComplianceStatus.NonCompliant;

        return {
          project: proj,
          item,
          linkedDocs,
          linkedCapas,
          isBlindSpot,
          isVerified,
          isNonCompliant,
        };
      });
    });
  }, [activeProjects, selectedProject, selectedProjectId, documents]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedRows.filter((row) => {
      if (filterMode === "verified" && !row.isVerified) return false;
      if (filterMode === "blind_spot" && !row.isBlindSpot) return false;
      if (filterMode === "non_compliant" && !row.isNonCompliant) return false;
      if (filterMode === "has_capa" && row.linkedCapas.length === 0)
        return false;

      if (!q) return true;
      const stdMatch = (row.item.standardId || "").toLowerCase().includes(q);
      const itemMatch = (row.item.item || "").toLowerCase().includes(q);
      const catMatch = (row.item.category || "").toLowerCase().includes(q);
      const docMatch = row.linkedDocs.some((d) =>
        resolveLocalizedText(d.name, lang).toLowerCase().includes(q),
      );
      return stdMatch || itemMatch || catMatch || docMatch;
    });
  }, [enrichedRows, filterMode, searchQuery, lang]);

  const stats = useMemo(() => {
    const total = enrichedRows.length;
    const verified = enrichedRows.filter((r) => r.isVerified).length;
    const blindSpots = enrichedRows.filter((r) => r.isBlindSpot).length;
    const nonCompliant = enrichedRows.filter((r) => r.isNonCompliant).length;
    const openCapas = enrichedRows.reduce(
      (sum, r) => sum + r.linkedCapas.length,
      0,
    );
    return { total, verified, blindSpots, nonCompliant, openCapas };
  }, [enrichedRows]);

  const handleExportPdfDossier = async () => {
    if (!selectedProject || !currentUser || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const pack = buildAssessorReportPack({
        project: selectedProject,
        standards,
        documents,
        risks,
        generatedBy: currentUser.name || currentUser.email,
      });

      try {
        await recordAssessorPackExportAudit(pack, currentUser.id, {
          reviewerName: reviewerName.trim() || undefined,
          note: signOffNote.trim() || undefined,
        });
      } catch (auditErr) {
        console.warn("Assessor export audit log warning:", auditErr);
      }

      await exportAssessorReportPackPdf(pack, {
        organizationName:
          currentOrganization?.name ||
          currentUser.profile?.organizationName ||
          "Healthcare Facility",
        reviewerName: reviewerName.trim() || undefined,
        signOffNote: signOffNote.trim() || undefined,
      });

      toast.success(
        isAr
          ? "تم تصدير ملف أدلة المقيم (PDF) بنجاح"
          : "Exported print-ready Surveyor Evidence Dossier (PDF)",
      );
    } catch (err) {
      console.error("Failed to export PDF dossier:", err);
      toast.error(
        isAr
          ? "تعذر تصدير ملف PDF"
          : "Failed to export Surveyor Evidence Dossier PDF",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsvMatrix = () => {
    if (!selectedProject || !currentUser) return;
    const pack = buildAssessorReportPack({
      project: selectedProject,
      standards,
      documents,
      risks,
      generatedBy: currentUser.name || currentUser.email,
    });
    exportAssessorEvidenceMatrixCsv(pack);
    toast.success(
      isAr
        ? "تم تصدير مصفوفة الأدلة (CSV)"
        : "Exported Standards-to-Evidence Matrix (CSV)",
    );
  };

  const handleEscalateToCapa = async (
    proj: Project,
    item: ChecklistItem,
    useAiDraft: boolean,
  ) => {
    if (!currentUser || escalatingItemId) return;
    setEscalatingItemId(item.id);
    try {
      let rootCause =
        item.notes ||
        "Identified during pre-survey evidence inspection (missing evidence or non-compliance).";
      let correctiveAction =
        item.actionPlan ||
        `Upload verified controlled evidence and complete departmental audit for ${item.standardId}.`;
      let preventiveAction =
        "Establish monthly departmental compliance rounding and document control review.";

      if (useAiDraft) {
        try {
          const prompt = `You are a healthcare accreditation quality specialist. Draft a concise 1-sentence Root Cause, 1-sentence Corrective Action, and 1-sentence Preventive Action for this accreditation finding:
Standard: ${item.standardId}
Requirement: ${item.item}
Current Status: ${item.status}
Respond in JSON format: {"rootCause": "...", "correctiveAction": "...", "preventiveAction": "..."}`;
          const aiRes = await aiAgentService.chat(prompt, false);
          const text = typeof aiRes === "string" ? aiRes : aiRes.response || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.rootCause) rootCause = parsed.rootCause;
            if (parsed.correctiveAction)
              correctiveAction = parsed.correctiveAction;
            if (parsed.preventiveAction)
              preventiveAction = parsed.preventiveAction;
          }
        } catch {
          // Fallback to deterministic template if AI is offline
        }
      }

      const dueDate = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString();

      await createCAPA(proj.id, {
        checklistItemId: item.id,
        description: `[${item.standardId}] ${item.item}`,
        rootCause,
        correctiveAction,
        preventiveAction,
        status: "Open" as any,
        assignedTo: item.assignedTo || currentUser.id,
        dueDate,
        pdcaStage: "Plan",
        pdcaHistory: [],
      } as any);

      await addRisk({
        title: `Survey Gap (${item.standardId}): ${item.item.slice(0, 70)}`,
        description: `Escalated from Survey-Day Command Center for project "${proj.name}". Root Cause: ${rootCause}`,
        likelihood: 4,
        impact: 4,
        ownerId: item.assignedTo || currentUser.id,
        status: "Open",
        mitigationPlan: correctiveAction,
        createdAt: new Date().toISOString(),
      });

      toast.success(
        isAr
          ? `تم إنشاء تقرير إجراء تصحيحي (CAPA) وسجل مخاطر للمعيار ${item.standardId}`
          : `Created CAPA & Risk entry for ${item.standardId}`,
      );
    } catch (err) {
      console.error("Failed to escalate finding to CAPA:", err);
      toast.error(
        isAr ? "تعذر إنشاء الإجراء التصحيحي" : "Failed to create CAPA report",
      );
    } finally {
      setEscalatingItemId(null);
    }
  };

  return (
    <div
      data-testid="survey-day-command-center"
      className="space-y-6 bg-brand-surface dark:bg-dark-brand-surface rounded-2xl border border-brand-border dark:border-dark-brand-border p-5 shadow-sm"
    >
      {/* Header & Dossier Export Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
              {isAr
                ? "مركز قيادة يوم المسح ومستكشف أدلة المقيمين"
                : "Survey-Day Command Center & Surveyor Evidence Explorer"}
            </h2>
            <p className="text-xs sm:text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {isAr
                ? "واجهة فورية للبحث عن المعايير، التحقق من الوثائق المضبوطة، تصدير ملف المقيم (PDF)، وتصعيد الفجوات إلى CAPA بضغطة واحدة."
                : "Distraction-free surveyor console to search standards, verify controlled evidence, export the print-ready PDF Dossier, and escalate findings to CAPA in 1 click."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label={isAr ? "اختر المشروع" : "Select Project"}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            <option value="all">
              {isAr ? "جميع المشاريع النشطة" : "All Active Projects"}
            </option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!selectedProject || isExportingPdf}
            onClick={handleExportPdfDossier}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {isExportingPdf
              ? isAr
                ? "جاري تجهيز ملف PDF..."
                : "Generating PDF..."
              : isAr
                ? "تصدير ملف المقيم (PDF Dossier)"
                : "Export PDF Surveyor Dossier"}
          </button>

          <button
            type="button"
            disabled={!selectedProject}
            onClick={handleExportCsvMatrix}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-brand-text-primary dark:text-dark-brand-text-primary px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4 text-brand-primary" />
            {isAr ? "مصفوفة الأدلة (CSV)" : "Evidence Matrix (CSV)"}
          </button>
        </div>
      </div>

      {/* Reviewer Sign-Off Metadata Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
            {isAr
              ? "اسم المراجع / مدير الجودة (لتوثيق التوقيع في ملف PDF)"
              : "Quality Director / Reviewer Sign-Off Name (embedded in PDF Dossier)"}
          </label>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder={
              isAr ? "مثال: د. سارة أحمد — مدير الجودة" : "e.g. Dr. Sarah Ahmed — Quality Director"
            }
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-brand-text-primary dark:text-dark-brand-text-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
            {isAr
              ? "ملاحظة الاعتماد والتدقيق (اختياري)"
              : "Attestation / Pre-Survey Review Note (Optional)"}
          </label>
          <input
            type="text"
            value={signOffNote}
            onChange={(e) => setSignOffNote(e.target.value)}
            placeholder={
              isAr
                ? "مثال: تم التحقق من جميع السياسات والأدلة قبل زيارة الاعتماد"
                : "e.g. Verified all controlled SOPs and evidence attachments for survey readiness"
            }
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-brand-text-primary dark:text-dark-brand-text-primary"
          />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900/40">
          <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {isAr ? "إجمالي المعايير" : "Total Standards"}
          </div>
          <div className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-0.5">
            {stats.total}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-3 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="text-xs text-emerald-800 dark:text-emerald-300">
            {isAr ? "موثقة بأدلة مضبوطة" : "Verified With Evidence"}
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
            {stats.verified}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 p-3 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="text-xs text-amber-800 dark:text-amber-300">
            {isAr ? "فجوات (مطابق بدون دليل)" : "Blind Spots (No Evidence)"}
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.blindSpots}
          </div>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 p-3 bg-rose-50/40 dark:bg-rose-950/20">
          <div className="text-xs text-rose-800 dark:text-rose-300">
            {isAr ? "غير مطابق" : "Non-Compliant"}
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.nonCompliant}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 p-3 bg-blue-50/40 dark:bg-blue-950/20">
          <div className="text-xs text-blue-800 dark:text-blue-300">
            {isAr ? "إجراءات تصحيحية مرتبطة" : "Linked CAPAs"}
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.openCapas}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? "ابحث برمز المعيار (مثل IPC.1 أو IPSG.1) أو نص المعيار أو اسم الوثيقة..."
                : "Search by Standard ID (e.g., IPC.1, IPSG.1, LAB.1), requirement, or document..."
            }
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", labelEn: "All Standards", labelAr: "الكل" },
              {
                id: "verified",
                labelEn: "Verified Evidence",
                labelAr: "موثق بدليل",
              },
              {
                id: "blind_spot",
                labelEn: "Blind Spots",
                labelAr: "فجوات بدون دليل",
              },
              {
                id: "non_compliant",
                labelEn: "Non-Compliant",
                labelAr: "غير مطابق",
              },
              {
                id: "has_capa",
                labelEn: "Has CAPA",
                labelAr: "مرتبط بـ CAPA",
              },
            ] as Array<{ id: EvidenceFilter; labelEn: string; labelAr: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterMode === tab.id
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Standards-to-Evidence Cross-Reference Table */}
      <div className="overflow-x-auto rounded-xl border border-brand-border dark:border-dark-brand-border">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800/80">
            <tr>
              <th className="px-3.5 py-2.5 text-left font-bold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {isAr ? "رمز المعيار" : "Standard"}
              </th>
              <th className="px-3.5 py-2.5 text-left font-bold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {isAr ? "متطلبات المعيار" : "Requirement"}
              </th>
              <th className="px-3.5 py-2.5 text-left font-bold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {isAr ? "الحالة" : "Status"}
              </th>
              <th className="px-3.5 py-2.5 text-left font-bold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {isAr ? "الأدلة والوثائق المضبوطة" : "Linked Controlled Evidence"}
              </th>
              <th className="px-3.5 py-2.5 text-right font-bold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {isAr ? "إجراءات سريعة للمقيم" : "Surveyor / CAPA Action"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 bg-white dark:bg-gray-900/30">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-brand-text-secondary dark:text-dark-brand-text-secondary"
                >
                  {isAr
                    ? "لا توجد معايير مطابقة لمعايير البحث الحالية."
                    : "No standards match the current search or filter."}
                </td>
              </tr>
            ) : (
              filteredRows.slice(0, 60).map((row) => (
                <tr
                  key={`${row.project.id}-${row.item.id}`}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                >
                  <td className="px-3.5 py-3 align-top whitespace-nowrap">
                    <span className="font-mono font-bold text-brand-primary">
                      {row.item.standardId}
                    </span>
                    {row.item.category && (
                      <div className="text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                        {row.item.category}
                      </div>
                    )}
                  </td>

                  <td className="px-3.5 py-3 align-top max-w-md">
                    <div className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                      {row.item.item}
                    </div>
                    <div className="text-[11px] text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
                      {row.project.name}
                    </div>
                  </td>

                  <td className="px-3.5 py-3 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        row.item.status === ComplianceStatus.Compliant
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : row.item.status ===
                              ComplianceStatus.PartiallyCompliant
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : row.item.status === ComplianceStatus.NonCompliant
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {row.item.status}
                    </span>
                    {row.isBlindSpot && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                        {isAr ? "بدون دليل مرفق" : "Missing Evidence"}
                      </div>
                    )}
                  </td>

                  <td className="px-3.5 py-3 align-top">
                    {row.linkedDocs.length > 0 ? (
                      <div className="space-y-1">
                        {row.linkedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                            <button
                              type="button"
                              onClick={() =>
                                setNavigation?.({ view: "documentControl" })
                              }
                              className="hover:underline text-left"
                            >
                              {resolveLocalizedText(doc.name, lang)} (
                              {doc.status})
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {isAr ? "لا توجد وثائق مرتبطة" : "0 linked documents"}
                      </span>
                    )}
                    {row.linkedCapas.length > 0 && (
                      <div className="mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        {row.linkedCapas.length} CAPA linked
                      </div>
                    )}
                  </td>

                  <td className="px-3.5 py-3 align-top text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {(row.isNonCompliant || row.isBlindSpot) && (
                        <>
                          <button
                            type="button"
                            disabled={escalatingItemId === row.item.id}
                            onClick={() =>
                              handleEscalateToCapa(row.project, row.item, true)
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors"
                            title={
                              isAr
                                ? "إنشاء إجراء تصحيحي وسجل مخاطر بالذكاء الاصطناعي"
                                : "Auto-generate AI CAPA & Risk entry"
                            }
                          >
                            <SparklesIcon className="w-3 h-3" />
                            {escalatingItemId === row.item.id
                              ? isAr
                                ? "جاري الإنشاء..."
                                : "Creating..."
                              : isAr
                                ? "تصعيد لـ CAPA ذكي"
                                : "1-Click AI CAPA"}
                          </button>
                        </>
                      )}
                      {setNavigation && (
                        <button
                          type="button"
                          onClick={() =>
                            setNavigation({
                              view: "projectDetail",
                              projectId: row.project.id,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-[11px] font-semibold text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ClipboardDocumentCheckIcon className="w-3 h-3 text-brand-primary" />
                          {isAr ? "فتح المعيار" : "Inspect"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SurveyDayCommandCenter;

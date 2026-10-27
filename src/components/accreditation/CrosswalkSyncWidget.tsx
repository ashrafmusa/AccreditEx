import {
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  analyzeCrossProjectCrosswalk,
  syncCrosswalkEvidenceAcrossProjects,
} from "@/utils/standardCrosswalk";
import React, { useMemo, useState } from "react";

const CrosswalkSyncWidget: React.FC = () => {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const toast = useToast();
  const { projects, updateProject } = useProjectStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const analyses = useMemo(
    () => analyzeCrossProjectCrosswalk(projects),
    [projects],
  );

  const totalSyncOpportunities = useMemo(
    () =>
      analyses.reduce((sum, a) => sum + a.itemsMissingSharedEvidence, 0),
    [analyses],
  );

  const totalSharedEvidenceDocs = useMemo(() => {
    const set = new Set<string>();
    analyses.forEach((a) =>
      a.sharedEvidenceDocIds.forEach((id) => set.add(id)),
    );
    return set.size;
  }, [analyses]);

  const handleSyncCrosswalk = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncCrosswalkEvidenceAcrossProjects(
        projects,
        updateProject,
      );
      if (res.itemsSynced > 0) {
        toast.success(
          isAr
            ? `تمت مزامنة الأدلة المشتركة عبر ${res.itemsSynced} معياراً في ${res.projectsUpdated} مشاريع اعتماد!`
            : `Synced shared evidence across ${res.itemsSynced} standard(s) in ${res.projectsUpdated} project(s)!`,
        );
      } else {
        toast.info(
          isAr
            ? "جميع المعايير المتكافئة عبر المشاريع متزامنة بالفعل."
            : "All equivalent standards across active projects are already in sync.",
        );
      }
    } catch (err) {
      console.error("Failed to sync crosswalk evidence:", err);
      toast.error(
        isAr
          ? "تعذر مزامنة الأدلة المشتركة"
          : "Failed to synchronize cross-program evidence",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section
      data-testid="crosswalk-sync-widget"
      className="rounded-2xl border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                {isAr
                  ? "محرك المواءمة المتعددة للمعايير (ارفع الدليل مرة واحدة، وامتثل في كل البرامج)"
                  : "Multi-Accreditation Crosswalk Engine (Upload Once, Comply Everywhere)"}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                CBAHI ↔ JCI ↔ CAP/ISO 15189 ↔ ISO 9001 ↔ MOH
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
              {isAr
                ? "يربط تلقائياً بين المعايير المتكافئة عبر برامج الاعتماد المختلفة بحيث يتم مشاركة السياسات والأدلة المرفقة تلقائياً دون تكرار العمل."
                : "Automatically maps equivalent quality, safety, and laboratory standards across programs so evidence attached once satisfies all matching accreditations."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncCrosswalk}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            {isSyncing ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
            {isSyncing
              ? isAr
                ? "جاري مزامنة الأدلة..."
                : "Syncing Crosswalk..."
              : totalSyncOpportunities > 0
                ? isAr
                  ? `مزامنة ${totalSyncOpportunities} معيار متكافئ الآن`
                  : `Sync ${totalSyncOpportunities} Cross-Program Standard(s)`
                : isAr
                  ? "فحص ومزامنة المعايير المتكافئة"
                  : "Verify & Sync Cross-Program Evidence"}
          </button>
        </div>
      </div>

      {/* Crosswalk Domains Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {analyses.map(({ domain, matchedItems, sharedEvidenceDocIds, itemsMissingSharedEvidence }) => (
          <div
            key={domain.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-3.5 flex flex-col justify-between space-y-2.5"
          >
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {isAr ? domain.titleAr : domain.titleEn}
                </h3>
                {sharedEvidenceDocIds.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">
                    <CheckCircleIcon className="w-3 h-3" />
                    {sharedEvidenceDocIds.length} doc(s)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-brand-text-secondary dark:text-dark-brand-text-secondary leading-snug">
                {isAr ? domain.descriptionAr : domain.descriptionEn}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                  CBAHI: {domain.equivalents.cbahi[0]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                  JCI: {domain.equivalents.jci[0]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
                  CAP/ISO: {domain.equivalents.cap_iso15189[0]}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                <span>
                  {matchedItems.length}{" "}
                  {isAr ? "معيار مرتبط في المشاريع" : "project item(s)"}
                </span>
                {itemsMissingSharedEvidence > 0 && (
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {itemsMissingSharedEvidence}{" "}
                    {isAr ? "جاهز للمزامنة" : "ready to sync"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary pt-1">
        <span>
          {isAr
            ? `إجمالي الأدلة المشتركة المتاحة عبر المنشأة: ${totalSharedEvidenceDocs} وثيقة مضبوطة`
            : `Total shared controlled evidence documents across programs: ${totalSharedEvidenceDocs}`}
        </span>
      </div>
    </section>
  );
};

export default CrosswalkSyncWidget;

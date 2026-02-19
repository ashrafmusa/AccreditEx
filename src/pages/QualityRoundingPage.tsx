import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import {
  QualityRound,
  RoundingTemplate,
  RoundingTemplateItem,
  RoundingObservation,
  RoundingFinding,
  RoundingStatus,
  RoundingFrequency,
  ObservationResult,
  RoundingFindingSeverity,
} from "@/types";
import {
  getRoundingTemplates,
  addRoundingTemplate,
  updateRoundingTemplate,
  deleteRoundingTemplate,
  getQualityRounds,
  addQualityRound,
  updateQualityRound,
  deleteQualityRound,
  calculateComplianceRate,
  calculateOverallScore,
} from "@/services/qualityRoundingService";
import {
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  ArrowLeftIcon,
} from "@/components/icons";

type RoundingTab = "templates" | "rounds" | "analytics";
type PageMode =
  | "list"
  | "createTemplate"
  | "editTemplate"
  | "scheduleRound"
  | "conductRound"
  | "viewRound";

const CATEGORIES = [
  "Infection Control",
  "Patient Safety",
  "Environment of Care",
  "Medication Safety",
  "Staff Compliance",
  "Documentation Compliance",
  "Equipment Safety",
  "Emergency Preparedness",
];

const FREQUENCIES: RoundingFrequency[] = [
  "Daily",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
];

const statusColors: Record<RoundingStatus, string> = {
  Scheduled: "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Overdue: "bg-red-100 text-red-800",
  Cancelled: "bg-gray-100 text-gray-600",
};

const resultColors: Record<ObservationResult, string> = {
  Compliant: "bg-green-500",
  "Non-Compliant": "bg-red-500",
  Partial: "bg-yellow-500",
  "N/A": "bg-gray-400",
};

const severityColors: Record<RoundingFindingSeverity, string> = {
  Critical: "bg-red-100 text-red-800",
  Major: "bg-orange-100 text-orange-800",
  Minor: "bg-yellow-100 text-yellow-800",
  Observation: "bg-blue-100 text-blue-800",
};

export default function QualityRoundingPage() {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const departments = useAppStore((s) => s.departments);

  const [activeTab, setActiveTab] = useState<RoundingTab>("templates");
  const [mode, setMode] = useState<PageMode>("list");
  const [loading, setLoading] = useState(true);

  // Data
  const [templates, setTemplates] = useState<RoundingTemplate[]>([]);
  const [rounds, setRounds] = useState<QualityRound[]>([]);

  // Template form
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState(CATEGORIES[0]);
  const [templateDepartment, setTemplateDepartment] = useState("");
  const [templateItems, setTemplateItems] = useState<RoundingTemplateItem[]>(
    [],
  );
  const [editingTemplate, setEditingTemplate] =
    useState<RoundingTemplate | null>(null);

  // Round form
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [roundDepartment, setRoundDepartment] = useState("");
  const [roundArea, setRoundArea] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [roundFrequency, setRoundFrequency] =
    useState<RoundingFrequency>("Monthly");

  // Conduct round
  const [activeRound, setActiveRound] = useState<QualityRound | null>(null);
  const [roundObservations, setRoundObservations] = useState<
    RoundingObservation[]
  >([]);

  // Round filter
  const [statusFilter, setStatusFilter] = useState<RoundingStatus | "all">(
    "all",
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        getRoundingTemplates(),
        getQualityRounds(),
      ]);
      setTemplates(t);
      setRounds(r);
    } catch (e) {
      console.error("Failed to fetch rounding data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Template CRUD ────────────────────────────────────

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateDescription("");
    setTemplateCategory(CATEGORIES[0]);
    setTemplateDepartment("");
    setTemplateItems([]);
    setEditingTemplate(null);
  };

  const addTemplateItem = () => {
    setTemplateItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: templateCategory,
        question: "",
        description: "",
        order: prev.length + 1,
      },
    ]);
  };

  const updateTemplateItem = (
    id: string,
    field: keyof RoundingTemplateItem,
    value: string | number,
  ) => {
    setTemplateItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeTemplateItem = (id: string) => {
    setTemplateItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, i) => ({ ...item, order: i + 1 })),
    );
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || templateItems.length === 0) return;
    try {
      if (editingTemplate) {
        const updated: RoundingTemplate = {
          ...editingTemplate,
          name: templateName,
          description: templateDescription,
          category: templateCategory,
          department: templateDepartment,
          items: templateItems,
        };
        await updateRoundingTemplate(updated);
      } else {
        await addRoundingTemplate({
          name: templateName,
          description: templateDescription,
          category: templateCategory,
          department: templateDepartment,
          items: templateItems,
          isActive: true,
          createdBy: currentUser?.id || "",
          createdAt: new Date().toISOString(),
        });
      }
      resetTemplateForm();
      setMode("list");
      fetchData();
    } catch (e) {
      console.error("Failed to save template:", e);
    }
  };

  const handleEditTemplate = (template: RoundingTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || "");
    setTemplateCategory(template.category);
    setTemplateDepartment(template.department || "");
    setTemplateItems(template.items);
    setMode("editTemplate");
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteRoundingTemplate(id);
      fetchData();
    } catch (e) {
      console.error("Failed to delete template:", e);
    }
  };

  // ─── Round CRUD ───────────────────────────────────────

  const handleScheduleRound = async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template || !roundDepartment || !roundDate) return;
    try {
      await addQualityRound({
        templateId: template.id,
        templateName: template.name,
        department: roundDepartment,
        area: roundArea,
        scheduledDate: roundDate,
        status: "Scheduled",
        frequency: roundFrequency,
        rounderId: currentUser?.id || "",
        rounderName: currentUser?.name || "",
        observations: [],
        findings: [],
        createdAt: new Date().toISOString(),
      });
      setSelectedTemplateId("");
      setRoundDepartment("");
      setRoundArea("");
      setRoundDate("");
      setMode("list");
      fetchData();
    } catch (e) {
      console.error("Failed to schedule round:", e);
    }
  };

  const handleStartRound = (round: QualityRound) => {
    const template = templates.find((t) => t.id === round.templateId);
    const observations: RoundingObservation[] =
      round.observations.length > 0
        ? round.observations
        : (template?.items || []).map((item) => ({
            itemId: item.id,
            question: item.question,
            result: "N/A" as ObservationResult,
            notes: "",
          }));
    setActiveRound({ ...round, status: "In Progress" });
    setRoundObservations(observations);
    setMode("conductRound");
  };

  const handleViewRound = (round: QualityRound) => {
    setActiveRound(round);
    setRoundObservations(round.observations);
    setMode("viewRound");
  };

  const updateObservation = (
    index: number,
    field: keyof RoundingObservation,
    value: string,
  ) => {
    setRoundObservations((prev) =>
      prev.map((obs, i) => (i === index ? { ...obs, [field]: value } : obs)),
    );
  };

  const handleSaveRound = async (complete: boolean) => {
    if (!activeRound) return;
    const compliance = calculateComplianceRate({
      ...activeRound,
      observations: roundObservations,
    });
    const score = calculateOverallScore({
      ...activeRound,
      observations: roundObservations,
    });

    const findings: RoundingFinding[] = roundObservations
      .filter((o) => o.result === "Non-Compliant" || o.result === "Partial")
      .map((o) => ({
        id: crypto.randomUUID(),
        roundId: activeRound.id,
        observation: o,
        severity: (o.findingSeverity || "Minor") as RoundingFindingSeverity,
        description: o.notes || `Non-compliance: ${o.question}`,
        status: "Open" as const,
        createdAt: new Date().toISOString(),
      }));

    const updated: QualityRound = {
      ...activeRound,
      status: complete ? "Completed" : "In Progress",
      observations: roundObservations,
      findings,
      overallScore: score,
      complianceRate: compliance,
      completedDate: complete ? new Date().toISOString() : undefined,
    };
    try {
      await updateQualityRound(updated);
      setMode("list");
      setActiveRound(null);
      fetchData();
    } catch (e) {
      console.error("Failed to save round:", e);
    }
  };

  const handleDeleteRound = async (id: string) => {
    try {
      await deleteQualityRound(id);
      fetchData();
    } catch (e) {
      console.error("Failed to delete round:", e);
    }
  };

  // ─── Analytics Computation ────────────────────────────

  const completedRounds = rounds.filter((r) => r.status === "Completed");
  const avgCompliance =
    completedRounds.length > 0
      ? Math.round(
          completedRounds.reduce((sum, r) => sum + (r.complianceRate || 0), 0) /
            completedRounds.length,
        )
      : 0;
  const allFindings = completedRounds.flatMap((r) => r.findings || []);
  const openFindingsCount = allFindings.filter(
    (f) => f.status === "Open" || f.status === "In Progress",
  ).length;
  const criticalFindingsCount = allFindings.filter(
    (f) => f.severity === ("Critical" as RoundingFindingSeverity),
  ).length;

  const now = new Date();
  const thisMonth = completedRounds.filter((r) => {
    const d = new Date(r.completedDate || r.scheduledDate);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  // Compliance by department
  const deptCompliance: Record<string, { total: number; sum: number }> = {};
  completedRounds.forEach((r) => {
    if (!deptCompliance[r.department])
      deptCompliance[r.department] = { total: 0, sum: 0 };
    deptCompliance[r.department].total += 1;
    deptCompliance[r.department].sum += r.complianceRate || 0;
  });

  // Top non-compliance categories
  const categoryCount: Record<string, number> = {};
  allFindings.forEach((f) => {
    const cat = f.observation?.question?.split(":")[0] || "Other";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const filteredRounds =
    statusFilter === "all"
      ? rounds
      : rounds.filter((r) => r.status === statusFilter);

  // Check for overdue rounds
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    rounds.forEach((r) => {
      if (r.status === "Scheduled" && r.scheduledDate < today) {
        updateQualityRound({ ...r, status: "Overdue" }).catch(() => {});
      }
    });
  }, [rounds]);

  // ─── Tabs ─────────────────────────────────────────────

  const tabs: {
    key: RoundingTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      key: "templates",
      label: t("templates"),
      icon: ClipboardDocumentListIcon,
    },
    { key: "rounds", label: t("rounds"), icon: CalendarDaysIcon },
    { key: "analytics", label: t("roundingAnalytics"), icon: ChartBarIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ─── Template Form ────────────────────────────────────

  const renderTemplateForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            resetTemplateForm();
            setMode("list");
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {editingTemplate ? t("editTemplate") : t("createTemplate")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("templateName")}
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("templateCategory")}
          </label>
          <select
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("templateDepartment")}
          </label>
          <select
            value={templateDepartment}
            onChange={(e) => setTemplateDepartment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("selectDepartment")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name.en || d.name.ar}>
                {d.name.en || d.name.ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("templateDescription")}
          </label>
          <input
            type="text"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Observation Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("observationItems")} ({templateItems.length})
          </h3>
          <button
            onClick={addTemplateItem}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> {t("addItem")}
          </button>
        </div>
        {templateItems.length === 0 && (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
            {t("addItem")} to start building your checklist
          </div>
        )}
        <div className="space-y-3">
          {templateItems.map((item, idx) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-bold text-gray-500 mt-2 shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder={t("itemQuestion")}
                    value={item.question}
                    onChange={(e) =>
                      updateTemplateItem(item.id, "question", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder={t("itemDescription")}
                    value={item.description || ""}
                    onChange={(e) =>
                      updateTemplateItem(item.id, "description", e.target.value)
                    }
                    className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => removeTemplateItem(item.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => {
            resetTemplateForm();
            setMode("list");
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleSaveTemplate}
          disabled={!templateName.trim() || templateItems.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );

  // ─── Schedule Round Form ──────────────────────────────

  const renderScheduleForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setMode("list")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {t("scheduleRound")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("selectTemplate")}
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("selectTemplate")}</option>
            {templates
              .filter((t) => t.isActive)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.category}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("selectDepartment")}
          </label>
          <select
            value={roundDepartment}
            onChange={(e) => setRoundDepartment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("selectDepartment")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name.en || d.name.ar}>
                {d.name.en || d.name.ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("area")}
          </label>
          <input
            type="text"
            value={roundArea}
            onChange={(e) => setRoundArea(e.target.value)}
            placeholder="e.g. ICU, Ward 3A"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("scheduledDate")}
          </label>
          <input
            type="date"
            value={roundDate}
            onChange={(e) => setRoundDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("frequency")}
          </label>
          <select
            value={roundFrequency}
            onChange={(e) =>
              setRoundFrequency(e.target.value as RoundingFrequency)
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {t(`frequency${f}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => setMode("list")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleScheduleRound}
          disabled={!selectedTemplateId || !roundDepartment || !roundDate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("scheduleRound")}
        </button>
      </div>
    </div>
  );

  // ─── Conduct / View Round ─────────────────────────────

  const renderConductRound = (readOnly: boolean) => {
    if (!activeRound) return null;
    const totalItems = roundObservations.length;
    const answeredItems = roundObservations.filter(
      (o) => o.result !== "N/A",
    ).length;
    const compliantItems = roundObservations.filter(
      (o) => o.result === "Compliant",
    ).length;
    const liveCompliance =
      answeredItems > 0
        ? Math.round((compliantItems / answeredItems) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setMode("list");
              setActiveRound(null);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {readOnly ? t("viewRound") : t("conductRound")}
            </h2>
            <p className="text-sm text-gray-500">
              {activeRound.templateName} — {activeRound.department}
              {activeRound.area ? ` / ${activeRound.area}` : ""}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t("observations")}: {answeredItems}/{totalItems}
            </span>
            <span
              className={`text-sm font-bold ${liveCompliance >= 80 ? "text-green-600" : liveCompliance >= 60 ? "text-yellow-600" : "text-red-600"}`}
            >
              {liveCompliance}% {t("complianceRate")}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${liveCompliance >= 80 ? "bg-green-500" : liveCompliance >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{
                width: `${answeredItems > 0 ? (answeredItems / totalItems) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Observation Checklist */}
        <div className="space-y-3">
          {roundObservations.map((obs, idx) => (
            <div
              key={idx}
              className={`border rounded-xl p-4 ${obs.result === "Compliant" ? "border-green-200 bg-green-50/30" : obs.result === "Non-Compliant" ? "border-red-200 bg-red-50/30" : obs.result === "Partial" ? "border-yellow-200 bg-yellow-50/30" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-gray-400 mt-1 shrink-0 w-6 text-right">
                  {idx + 1}.
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    {obs.question}
                  </p>

                  {/* Result Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(
                      [
                        "Compliant",
                        "Partial",
                        "Non-Compliant",
                        "N/A",
                      ] as ObservationResult[]
                    ).map((result) => (
                      <button
                        key={result}
                        onClick={() =>
                          !readOnly && updateObservation(idx, "result", result)
                        }
                        disabled={readOnly}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          obs.result === result
                            ? result === "Compliant"
                              ? "bg-green-600 text-white border-green-600"
                              : result === "Non-Compliant"
                                ? "bg-red-600 text-white border-red-600"
                                : result === "Partial"
                                  ? "bg-yellow-500 text-white border-yellow-500"
                                  : "bg-gray-500 text-white border-gray-500"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {result === "Compliant"
                          ? t("compliant")
                          : result === "Non-Compliant"
                            ? t("nonCompliant")
                            : result === "Partial"
                              ? t("partial")
                              : t("notApplicable")}
                      </button>
                    ))}
                  </div>

                  {/* Severity (for non-compliant/partial) */}
                  {(obs.result === "Non-Compliant" ||
                    obs.result === "Partial") &&
                    !readOnly && (
                      <div className="mb-2">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          {t("findingSeverity")}
                        </label>
                        <div className="flex gap-2">
                          {(
                            [
                              "Critical",
                              "Major",
                              "Minor",
                              "Observation",
                            ] as RoundingFindingSeverity[]
                          ).map((sev) => (
                            <button
                              key={sev}
                              onClick={() =>
                                updateObservation(idx, "findingSeverity", sev)
                              }
                              className={`px-2 py-1 text-xs rounded-md border ${
                                obs.findingSeverity === sev
                                  ? severityColors[sev] +
                                    " border-current font-bold"
                                  : "bg-white text-gray-500 border-gray-200"
                              }`}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Notes */}
                  {!readOnly ? (
                    <textarea
                      value={obs.notes || ""}
                      onChange={(e) =>
                        updateObservation(idx, "notes", e.target.value)
                      }
                      placeholder={t("observationNotes")}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 mt-1"
                    />
                  ) : obs.notes ? (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      {obs.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-4">
            <button
              onClick={() => handleSaveRound(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t("saveProgress")}
            </button>
            <button
              onClick={() => handleSaveRound(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4" /> {t("completeRound")}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ─── Templates List ───────────────────────────────────

  const renderTemplatesList = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("activeTemplates")} ({templates.filter((t) => t.isActive).length})
        </h3>
        <button
          onClick={() => setMode("createTemplate")}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" /> {t("createTemplate")}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">{t("noTemplates")}</p>
          <button
            onClick={() => setMode("createTemplate")}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            {t("createTemplate")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {template.category}
                    {template.department ? ` — ${template.department}` : ""}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${template.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {template.isActive ? t("active") : t("inactive")}
                </span>
              </div>
              {template.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {template.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {template.items.length} {t("observationItems").toLowerCase()}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                    title={t("edit")}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title={t("delete")}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Rounds List ──────────────────────────────────────

  const renderRoundsList = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(
            ["all", "Scheduled", "In Progress", "Completed", "Overdue"] as const
          ).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                statusFilter === status
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {status === "all"
                ? t("all")
                : t(`status${status.replace(/\s/g, "")}`)}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setActiveTab("rounds");
            setMode("scheduleRound");
          }}
          disabled={templates.length === 0}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4" /> {t("scheduleRound")}
        </button>
      </div>

      {filteredRounds.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">{t("noRounds")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 font-medium text-gray-500">
                  {t("templateName")}
                </th>
                <th className="pb-3 font-medium text-gray-500">
                  {t("department")}
                </th>
                <th className="pb-3 font-medium text-gray-500">
                  {t("scheduledDate")}
                </th>
                <th className="pb-3 font-medium text-gray-500">
                  {t("status")}
                </th>
                <th className="pb-3 font-medium text-gray-500">
                  {t("complianceRate")}
                </th>
                <th className="pb-3 font-medium text-gray-500">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRounds.map((round) => (
                <tr
                  key={round.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 font-medium text-gray-900">
                    {round.templateName}
                  </td>
                  <td className="py-3 text-gray-600">
                    {round.department}
                    {round.area ? ` / ${round.area}` : ""}
                  </td>
                  <td className="py-3 text-gray-600">
                    {new Date(round.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[round.status]}`}
                    >
                      {t(`status${round.status.replace(/\s/g, "")}`)}
                    </span>
                  </td>
                  <td className="py-3">
                    {round.complianceRate !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${round.complianceRate >= 80 ? "bg-green-500" : round.complianceRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${round.complianceRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {round.complianceRate}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {(round.status === "Scheduled" ||
                        round.status === "Overdue") && (
                        <button
                          onClick={() => handleStartRound(round)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title={t("startRound")}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      {round.status === "In Progress" && (
                        <button
                          onClick={() => handleStartRound(round)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                          title={t("conductRound")}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      {round.status === "Completed" && (
                        <button
                          onClick={() => handleViewRound(round)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title={t("viewRound")}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRound(round.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title={t("delete")}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ─── Analytics ────────────────────────────────────────

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {t("overallComplianceRate")}
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${avgCompliance >= 80 ? "text-green-600" : avgCompliance >= 60 ? "text-yellow-600" : "text-red-600"}`}
          >
            {avgCompliance}%
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {t("totalRoundsCompleted")}
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {completedRounds.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {thisMonth} {t("roundsThisMonth").toLowerCase()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {t("openFindings")}
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${openFindingsCount > 0 ? "text-orange-600" : "text-green-600"}`}
          >
            {openFindingsCount}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {t("criticalFindings")}
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${criticalFindingsCount > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {criticalFindingsCount}
          </p>
        </div>
      </div>

      {/* Compliance by Department */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("complianceByDepartment")}
        </h3>
        {Object.keys(deptCompliance).length === 0 ? (
          <p className="text-gray-400 text-center py-8">{t("noRounds")}</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(deptCompliance).map(([dept, data]) => {
              const avg = Math.round(data.sum / data.total);
              return (
                <div key={dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {dept}
                    </span>
                    <span
                      className={`text-sm font-bold ${avg >= 80 ? "text-green-600" : avg >= 60 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {avg}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${avg >= 80 ? "bg-green-500" : avg >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.total} {t("rounds").toLowerCase()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Non-Compliance Categories */}
      {topCategories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("topCategories")}
          </h3>
          <div className="space-y-2">
            {topCategories.map(([cat, count], idx) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">
                  {idx + 1}.
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">
                      {cat}
                    </span>
                    <span className="text-sm font-medium text-red-600">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 rounded-full bg-red-400"
                      style={{
                        width: `${(count / (topCategories[0]?.[1] || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Rounds */}
      {completedRounds.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("totalRoundsCompleted")}
          </h3>
          <div className="space-y-2">
            {completedRounds.slice(0, 10).map((round) => (
              <div
                key={round.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {round.templateName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {round.department} —{" "}
                    {new Date(
                      round.completedDate || round.scheduledDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${(round.complianceRate || 0) >= 80 ? "text-green-600" : (round.complianceRate || 0) >= 60 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {round.complianceRate || 0}%
                  </span>
                  <button
                    onClick={() => handleViewRound(round)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Main Render ──────────────────────────────────────

  if (mode === "createTemplate" || mode === "editTemplate")
    return <div className="p-6 max-w-4xl mx-auto">{renderTemplateForm()}</div>;
  if (mode === "scheduleRound")
    return <div className="p-6 max-w-4xl mx-auto">{renderScheduleForm()}</div>;
  if (mode === "conductRound")
    return (
      <div className="p-6 max-w-4xl mx-auto">{renderConductRound(false)}</div>
    );
  if (mode === "viewRound")
    return (
      <div className="p-6 max-w-4xl mx-auto">{renderConductRound(true)}</div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("qualityRounding")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("qualityRoundingDescription")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "templates" && renderTemplatesList()}
      {activeTab === "rounds" && renderRoundsList()}
      {activeTab === "analytics" && renderAnalytics()}
    </div>
  );
}

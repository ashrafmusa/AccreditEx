import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useUserStore } from "../stores/useUserStore";
import { useAppStore } from "../stores/useAppStore";
import {
  PerformanceEvaluation,
  EvaluationStatus,
  EvaluationPeriod,
  CompetencyRating,
  PerformanceGoal,
} from "../types";
import {
  getPerformanceEvaluations,
  addPerformanceEvaluation,
  updatePerformanceEvaluation,
  deletePerformanceEvaluation,
} from "../services/performanceEvaluationService";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarSquareIcon,
  EyeIcon,
} from "../components/icons";
import { Button, TableContainer } from "@/components/ui";

type ViewMode = "list" | "create" | "edit" | "view";

const statusColors: Record<EvaluationStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "In Progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Pending Review":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const ratingLabels = [
  "",
  "Unsatisfactory",
  "Needs Improvement",
  "Meets Expectations",
  "Exceeds Expectations",
  "Outstanding",
];

const PerformanceEvaluationPage: React.FC<{
  setNavigation: (state: any) => void;
}> = () => {
  const { t } = useTranslation();
  const { users, currentUser } = useUserStore();
  const { departments, competencies } = useAppStore();

  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEval, setSelectedEval] =
    useState<PerformanceEvaluation | null>(null);
  const [filterStatus, setFilterStatus] = useState<EvaluationStatus | "all">(
    "all",
  );

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    period: "annual" as EvaluationPeriod,
    periodLabel: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    strengths: "",
    areasForImprovement: "",
    developmentPlan: "",
    evaluatorComments: "",
  });
  const [formGoals, setFormGoals] = useState<PerformanceGoal[]>([]);
  const [formCompetencyRatings, setFormCompetencyRatings] = useState<
    CompetencyRating[]
  >([]);

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPerformanceEvaluations();
      setEvaluations(data);
    } catch (error) {
      console.error("Failed to fetch evaluations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const filteredEvaluations = useMemo(() => {
    if (filterStatus === "all") return evaluations;
    return evaluations.filter((e) => e.status === filterStatus);
  }, [evaluations, filterStatus]);

  const selectedEmployee = useMemo(
    () => users.find((u) => u.id === formData.employeeId),
    [users, formData.employeeId],
  );

  const resetForm = () => {
    setFormData({
      employeeId: "",
      period: "annual",
      periodLabel: `${new Date().getFullYear()} ${t("annualReview")}`,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      strengths: "",
      areasForImprovement: "",
      developmentPlan: "",
      evaluatorComments: "",
    });
    setFormGoals([]);
    setFormCompetencyRatings(
      competencies.map((c) => ({
        competencyId: c.id,
        competencyName: String(c.name?.en || c.name || ""),
        rating: 0,
        comments: "",
      })),
    );
  };

  const handleCreate = () => {
    resetForm();
    setSelectedEval(null);
    setViewMode("create");
  };

  const handleEdit = (evalItem: PerformanceEvaluation) => {
    setSelectedEval(evalItem);
    setFormData({
      employeeId: evalItem.employeeId,
      period: evalItem.period,
      periodLabel: evalItem.periodLabel,
      startDate: evalItem.startDate,
      endDate: evalItem.endDate,
      strengths: evalItem.strengths || "",
      areasForImprovement: evalItem.areasForImprovement || "",
      developmentPlan: evalItem.developmentPlan || "",
      evaluatorComments: evalItem.evaluatorComments || "",
    });
    setFormGoals(evalItem.goals || []);
    setFormCompetencyRatings(
      evalItem.competencyRatings?.length
        ? evalItem.competencyRatings
        : competencies.map((c) => ({
            competencyId: c.id,
            competencyName: String(c.name?.en || c.name || ""),
            rating: 0,
            comments: "",
          })),
    );
    setViewMode("edit");
  };

  const handleView = (evalItem: PerformanceEvaluation) => {
    setSelectedEval(evalItem);
    setViewMode("view");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("areYouSureDeleteEvaluation"))) {
      try {
        await deletePerformanceEvaluation(id);
        setEvaluations((prev) => prev.filter((e) => e.id !== id));
      } catch (error) {
        console.error("Failed to delete evaluation:", error);
      }
    }
  };

  const handleSave = async (status: EvaluationStatus = "Draft") => {
    if (!formData.employeeId || !currentUser) return;

    const employee = users.find((u) => u.id === formData.employeeId);
    const overallRating =
      formCompetencyRatings.length > 0
        ? Math.round(
            (formCompetencyRatings.reduce((sum, r) => sum + r.rating, 0) /
              formCompetencyRatings.filter((r) => r.rating > 0).length) *
              10,
          ) / 10 || 0
        : 0;

    const evalData: Omit<PerformanceEvaluation, "id"> = {
      employeeId: formData.employeeId,
      employeeName: employee?.name || "Unknown",
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
      department: employee?.departmentId || "",
      jobTitle: employee?.role || "",
      period: formData.period,
      periodLabel: formData.periodLabel,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status,
      overallRating,
      competencyRatings: formCompetencyRatings,
      goals: formGoals,
      strengths: formData.strengths,
      areasForImprovement: formData.areasForImprovement,
      developmentPlan: formData.developmentPlan,
      evaluatorComments: formData.evaluatorComments,
      createdAt: selectedEval?.createdAt || new Date().toISOString(),
    };

    try {
      if (selectedEval) {
        const updated = { ...evalData, id: selectedEval.id };
        await updatePerformanceEvaluation(updated);
        setEvaluations((prev) =>
          prev.map((e) => (e.id === selectedEval.id ? updated : e)),
        );
      } else {
        const created = await addPerformanceEvaluation(evalData);
        setEvaluations((prev) => [created, ...prev]);
      }
      setViewMode("list");
    } catch (error) {
      console.error("Failed to save evaluation:", error);
    }
  };

  const addGoal = () => {
    setFormGoals([
      ...formGoals,
      {
        id: `goal-${Date.now()}`,
        title: "",
        status: "Not Started",
        weight: 0,
      },
    ]);
  };

  const updateGoal = (
    index: number,
    field: keyof PerformanceGoal,
    value: any,
  ) => {
    setFormGoals((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)),
    );
  };

  const removeGoal = (index: number) => {
    setFormGoals((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClasses =
    "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  // ---- VIEW MODE: Detail View ----
  if (viewMode === "view" && selectedEval) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChartBarSquareIcon className="h-8 w-8 text-brand-primary" />
            <div>
              <h1 className="text-2xl font-bold dark:text-dark-brand-text-primary">
                {selectedEval.periodLabel}
              </h1>
              <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {selectedEval.employeeName} &mdash;{" "}
                {selectedEval.department || t("noDepartment")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => handleEdit(selectedEval)}
              size="sm"
            >
              {t("edit")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewMode("list")}
              size="sm"
            >
              {t("back")}
            </Button>
          </div>
        </div>

        {/* Status & Rating */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border dark:border-dark-brand-border">
            <p className="text-sm text-gray-500">{t("status")}</p>
            <span
              className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColors[selectedEval.status]}`}
            >
              {selectedEval.status}
            </span>
          </div>
          <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border dark:border-dark-brand-border">
            <p className="text-sm text-gray-500">{t("overallRating")}</p>
            <p className="text-2xl font-bold text-brand-primary mt-1">
              {selectedEval.overallRating?.toFixed(1) || "—"}{" "}
              <span className="text-sm font-normal text-gray-500">/ 5</span>
            </p>
          </div>
          <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border dark:border-dark-brand-border">
            <p className="text-sm text-gray-500">{t("evaluationPeriod")}</p>
            <p className="text-sm font-medium mt-1 dark:text-white">
              {new Date(selectedEval.startDate).toLocaleDateString()} —{" "}
              {new Date(selectedEval.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Competency Ratings */}
        {selectedEval.competencyRatings?.length > 0 && (
          <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {t("competencyRatings")}
            </h3>
            <div className="space-y-3">
              {selectedEval.competencyRatings.map((cr) => (
                <div key={cr.competencyId} className="flex items-center gap-4">
                  <span className="w-40 text-sm font-medium dark:text-gray-300">
                    {cr.competencyName}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          n <= cr.rating
                            ? "bg-brand-primary text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                        }`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {ratingLabels[cr.rating] || ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {selectedEval.goals?.length > 0 && (
          <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border dark:border-dark-brand-border">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {t("performanceGoals")}
            </h3>
            <div className="space-y-3">
              {selectedEval.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 border rounded-lg dark:border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium dark:text-white">{goal.title}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                      {goal.status}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedEval.strengths && (
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border dark:border-dark-brand-border">
              <p className="text-sm font-medium text-gray-500 mb-2">
                {t("strengths")}
              </p>
              <p className="text-sm dark:text-gray-300">
                {selectedEval.strengths}
              </p>
            </div>
          )}
          {selectedEval.areasForImprovement && (
            <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border dark:border-dark-brand-border">
              <p className="text-sm font-medium text-gray-500 mb-2">
                {t("areasForImprovement")}
              </p>
              <p className="text-sm dark:text-gray-300">
                {selectedEval.areasForImprovement}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- CREATE / EDIT MODE ----
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChartBarSquareIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-2xl font-bold dark:text-dark-brand-text-primary">
              {viewMode === "create" ? t("newEvaluation") : t("editEvaluation")}
            </h1>
          </div>
          <Button variant="ghost" onClick={() => setViewMode("list")} size="sm">
            {t("cancel")}
          </Button>
        </div>

        {/* Basic Info */}
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            {t("evaluationDetails")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{t("employee")}</label>
              <select
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value })
                }
                className={inputClasses}
                required
              >
                <option value="">{t("selectEmployee")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>{t("evaluationPeriod")}</label>
              <select
                value={formData.period}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    period: e.target.value as EvaluationPeriod,
                  })
                }
                className={inputClasses}
              >
                <option value="annual">{t("annual")}</option>
                <option value="semi-annual">{t("semiAnnual")}</option>
                <option value="quarterly">{t("quarterly")}</option>
                <option value="probation">{t("probation")}</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>{t("periodLabel")}</label>
              <input
                type="text"
                value={formData.periodLabel}
                onChange={(e) =>
                  setFormData({ ...formData, periodLabel: e.target.value })
                }
                className={inputClasses}
                placeholder={`${new Date().getFullYear()} Annual Review`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClasses}>{t("startDate")}</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t("endDate")}</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Competency Ratings */}
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            {t("competencyRatings")}
          </h3>
          {formCompetencyRatings.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noCompetencies")}</p>
          ) : (
            <div className="space-y-4">
              {formCompetencyRatings.map((cr, idx) => (
                <div
                  key={cr.competencyId}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg dark:border-gray-600"
                >
                  <span className="w-40 text-sm font-medium dark:text-gray-300 shrink-0">
                    {cr.competencyName}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          const updated = [...formCompetencyRatings];
                          updated[idx] = { ...updated[idx], rating: n };
                          setFormCompetencyRatings(updated);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          n <= cr.rating
                            ? "bg-brand-primary text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {ratingLabels[cr.rating] || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border dark:border-dark-brand-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {t("performanceGoals")}
            </h3>
            <Button variant="ghost" size="sm" onClick={addGoal}>
              <PlusIcon className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
              {t("addGoal")}
            </Button>
          </div>
          <div className="space-y-3">
            {formGoals.map((goal, idx) => (
              <div
                key={goal.id}
                className="p-3 border rounded-lg dark:border-gray-600"
              >
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={goal.title}
                      onChange={(e) => updateGoal(idx, "title", e.target.value)}
                      placeholder={t("goalTitle")}
                      className={inputClasses}
                    />
                    <div className="flex gap-2">
                      <select
                        value={goal.status}
                        onChange={(e) =>
                          updateGoal(idx, "status", e.target.value)
                        }
                        className={`${inputClasses} mt-0!`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Achieved">Achieved</option>
                        <option value="Partially Achieved">
                          Partially Achieved
                        </option>
                        <option value="Not Achieved">Not Achieved</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={goal.weight || ""}
                        onChange={(e) =>
                          updateGoal(
                            idx,
                            "weight",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder={t("weight") + " %"}
                        className={`${inputClasses} mt-0! w-24`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeGoal(idx)}
                    className="p-1 hover:text-red-600 mt-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {formGoals.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                {t("noGoalsAdded")}
              </p>
            )}
          </div>
        </div>

        {/* Qualitative Feedback */}
        <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-6 border dark:border-dark-brand-border">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            {t("qualitativeFeedback")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>{t("strengths")}</label>
              <textarea
                value={formData.strengths}
                onChange={(e) =>
                  setFormData({ ...formData, strengths: e.target.value })
                }
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t("areasForImprovement")}</label>
              <textarea
                value={formData.areasForImprovement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areasForImprovement: e.target.value,
                  })
                }
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t("developmentPlan")}</label>
              <textarea
                value={formData.developmentPlan}
                onChange={(e) =>
                  setFormData({ ...formData, developmentPlan: e.target.value })
                }
                rows={3}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t("evaluatorComments")}</label>
              <textarea
                value={formData.evaluatorComments}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    evaluatorComments: e.target.value,
                  })
                }
                rows={3}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        {/* Save Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setViewMode("list")}>
            {t("cancel")}
          </Button>
          <Button variant="ghost" onClick={() => handleSave("Draft")}>
            {t("saveAsDraft")}
          </Button>
          <Button onClick={() => handleSave("In Progress")}>
            {t("saveAndSubmit")}
          </Button>
        </div>
      </div>
    );
  }

  // ---- LIST MODE ----
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <ChartBarSquareIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("performanceEvaluations")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("performanceEvaluationsDescription")}
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="w-full md:w-auto">
          <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
          {t("newEvaluation")}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            "all",
            "Draft",
            "In Progress",
            "Pending Review",
            "Completed",
          ] as const
        ).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filterStatus === s
                ? "bg-brand-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? t("allStatuses") : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border overflow-hidden">
        <TableContainer>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                  {t("employee")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                  {t("evaluationPeriod")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                  {t("overallRating")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                      {t("loading")}...
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((evalItem) => (
                  <tr
                    key={evalItem.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium dark:text-white">
                        {evalItem.employeeName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {evalItem.department}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-300">
                      {evalItem.periodLabel}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-brand-primary">
                        {evalItem.overallRating?.toFixed(1) || "—"}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/ 5</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[evalItem.status]}`}
                      >
                        {evalItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleView(evalItem)}
                          className="p-1 hover:text-brand-primary"
                          title={t("view")}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(evalItem)}
                          className="p-1 hover:text-brand-primary"
                          title={t("edit")}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(evalItem.id)}
                          className="p-1 hover:text-red-600"
                          title={t("delete")}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableContainer>
        {!isLoading && filteredEvaluations.length === 0 && (
          <div className="text-center py-12">
            <ChartBarSquareIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              {t("noEvaluations")}
            </p>
            <Button onClick={handleCreate} className="mt-4" size="sm">
              {t("newEvaluation")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceEvaluationPage;

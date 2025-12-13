import React, { useState, useMemo } from "react";
import { Project, CAPAReport, PDCACycle, PDCAStage } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import { PlusIcon, FunnelIcon } from "../icons";
import PDCACycleCard from "./PDCACycleCard";
import PDCAStageTransitionForm from "./PDCAStageTransitionForm";
import PDCACycleDetailModal from "./PDCACycleDetailModal";

interface PDCACycleManagerProps {
  project: Project;
  onUpdate?: (project: Project) => void; // Optional now, store handles updates
}

const PDCACycleManager: React.FC<PDCACycleManagerProps> = ({ project }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser } = useUserStore();
  const { users } = useAppStore();
  const { updateCAPAPDCAStage, createPDCACycle, updatePDCACycle } =
    useProjectStore();
  const [selectedItem, setSelectedItem] = useState<{
    item: CAPAReport | PDCACycle;
    type: "capa" | "cycle";
  } | null>(null);
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [transitioningItem, setTransitioningItem] = useState<{
    item: CAPAReport | PDCACycle;
    type: "capa" | "cycle";
  } | null>(null);
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    owner?: string;
    dueDate?: string;
  }>({});

  // Combine Cycles and CAPAs
  type PDCAItem =
    | { item: CAPAReport; type: "capa" }
    | { item: PDCACycle; type: "cycle" };

  const allItems: PDCAItem[] = useMemo(() => {
    const capaItems: PDCAItem[] = (project.capaReports || []).map((capa) => ({
      item: capa,
      type: "capa" as const,
    }));
    const cycleItems: PDCAItem[] = (project.pdcaCycles || []).map((cycle) => ({
      item: cycle,
      type: "cycle" as const,
    }));
    return [...capaItems, ...cycleItems];
  }, [project.capaReports, project.pdcaCycles]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(({ item, type }) => {
      // Search filter
      if (searchQuery) {
        const title =
          type === "capa"
            ? (item as CAPAReport).description
            : (item as PDCACycle).title;
        if (!title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== "all") {
        if (type === "cycle") {
          if ((item as PDCACycle).category !== filterCategory) {
            return false;
          }
        } else if (filterCategory !== "CAPA") {
          return false;
        }
      }

      // Priority filter
      if (filterPriority !== "all") {
        if (type === "cycle") {
          if ((item as PDCACycle).priority !== filterPriority) {
            return false;
          }
        }
      }

      return true;
    });
  }, [allItems, searchQuery, filterCategory, filterPriority]);

  // Group by stage
  const itemsByStage = useMemo(() => {
    const stages: PDCAStage[] = ["Plan", "Do", "Check", "Act", "Completed"];
    const grouped: Record<PDCAStage, typeof filteredItems> = {
      Plan: [],
      Do: [],
      Check: [],
      Act: [],
      Completed: [],
    };

    filteredItems.forEach((pdcaItem) => {
      const stage =
        pdcaItem.type === "capa"
          ? (pdcaItem.item as CAPAReport).pdcaStage || "Plan"
          : (pdcaItem.item as PDCACycle).currentStage;
      grouped[stage].push(pdcaItem);
    });

    return grouped;
  }, [filteredItems]);

  // Handle stage advancement
  const handleAdvanceStage = (
    item: CAPAReport | PDCACycle,
    type: "capa" | "cycle"
  ) => {
    setTransitioningItem({ item, type });
    setShowTransitionForm(true);
  };

  const handleConfirmTransition = async (
    notes: string,
    attachments: string[]
  ) => {
    if (!transitioningItem) return;

    const { item, type } = transitioningItem;
    const currentStage =
      type === "capa"
        ? (item as CAPAReport).pdcaStage || "Plan"
        : (item as PDCACycle).currentStage;

    // Get next stage
    const stageOrder: PDCAStage[] = ["Plan", "Do", "Check", "Act", "Completed"];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = stageOrder[currentIndex + 1];

    if (!nextStage) return;

    try {
      // Use store actions
      if (type === "capa") {
        await updateCAPAPDCAStage(
          project.id,
          item.id,
          nextStage,
          notes,
          attachments
        );
      } else {
        // Update PDCA cycle
        const user = useProjectStore
          .getState()
          .projects.find((p) => p.id === project.id);
        const currentCycle = item as PDCACycle;

        const historyEntry = {
          stage: currentStage,
          enteredAt:
            currentCycle.stageHistory[currentCycle.stageHistory.length - 1]
              ?.completedAt || currentCycle.createdAt,
          completedAt: new Date().toISOString(),
          completedBy: user.id,
          notes,
          attachments,
        };

        const updatedCycle: PDCACycle = {
          ...currentCycle,
          currentStage: nextStage,
          stageHistory: [...currentCycle.stageHistory, historyEntry],
        };

        await updatePDCACycle(project.id, updatedCycle);
      }

      toast.success(t("pdcaStageAdvanced"));
      setShowTransitionForm(false);
      setTransitioningItem(null);
    } catch (error) {
      toast.error(t("pdcaStageFailed"));
    }
  };

  // Get stage color
  const getStageColor = (stage: PDCAStage) => {
    switch (stage) {
      case "Plan":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/10";
      case "Do":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      case "Check":
        return "border-purple-500 bg-purple-50 dark:bg-purple-900/10";
      case "Act":
        return "border-green-500 bg-green-50 dark:bg-green-900/10";
      case "Completed":
        return "border-gray-400 bg-gray-50 dark:bg-gray-800/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("pdcaCycles") || "PDCA Cycles"}
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("continuousImprovement") || "Continuous Improvement Management"}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
          onClick={() => setShowNewCycleModal(true)}
        >
          <PlusIcon className="h-5 w-5" />
          {t("newPDCACycle") || "New PDCA Cycle"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border border-brand-border dark:border-dark-brand-border">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
          <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("filters")}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder={t("searchCycles") || "Search cycles..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary"
          />

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            <option value="all">
              {t("allCategories") || "All Categories"}
            </option>
            <option value="CAPA">CAPA</option>
            <option value="Process">{t("process") || "Process"}</option>
            <option value="Quality">{t("quality") || "Quality"}</option>
            <option value="Safety">{t("safety") || "Safety"}</option>
            <option value="Efficiency">
              {t("efficiency") || "Efficiency"}
            </option>
            <option value="Other">{t("other") || "Other"}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            <option value="all">
              {t("allPriorities") || "All Priorities"}
            </option>
            <option value="High">{t("high") || "High"}</option>
            <option value="Medium">{t("medium") || "Medium"}</option>
            <option value="Low">{t("low") || "Low"}</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex overflow-x-auto gap-6 pb-6">
        {(["Plan", "Do", "Check", "Act", "Completed"] as PDCAStage[]).map(
          (stage) => {
            const stageKey =
              stage === "Plan"
                ? "planStage"
                : stage === "Do"
                ? "doStage"
                : stage === "Check"
                ? "checkStage"
                : stage === "Act"
                ? "actStage"
                : "completedStage";

            return (
              <div key={stage} className="flex-none w-80">
                <div
                  className={`flex items-center justify-between mb-4 px-2 py-1 border-b-2 ${
                    getStageColor(stage).split(" ")[0]
                  }`}
                >
                  <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                    {t(stageKey) || stage}
                  </h3>
                  <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {itemsByStage[stage].length}
                  </span>
                </div>

                <div
                  className={`min-h-[200px] rounded-lg p-2 space-y-3 ${getStageColor(
                    stage
                  )
                    .split(" ")
                    .slice(1)
                    .join(" ")}`}
                >
                  {itemsByStage[stage].map(({ item, type }) => (
                    <PDCACycleCard
                      key={item.id}
                      item={item}
                      type={type}
                      projectId={project.id}
                      onView={() => setSelectedItem({ item, type })}
                      onAdvanceStage={() => handleAdvanceStage(item, type)}
                    />
                  ))}
                  {itemsByStage[stage].length === 0 && (
                    <div className="text-center py-8 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary italic">
                      {t("noItemsInStage") || "No items in this stage"}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <PDCACycleDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          cycle={selectedItem.item}
          type={selectedItem.type}
          onUpdate={(updatedItem) => {
            // Item updated successfully
            setSelectedItem(null);
          }}
        />
      )}

      {/* Transition Form Modal*/}
      {showTransitionForm && transitioningItem && (
        <PDCAStageTransitionForm
          currentStage={
            transitioningItem.type === "capa"
              ? (transitioningItem.item as CAPAReport).pdcaStage || "Plan"
              : (transitioningItem.item as PDCACycle).currentStage
          }
          onConfirm={handleConfirmTransition}
          onCancel={() => {
            setShowTransitionForm(false);
            setTransitioningItem(null);
          }}
        />
      )}

      {/* New Cycle Modal */}
      {showNewCycleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-brand-surface rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
              {t("newPDCACycle") || "New PDCA Cycle"}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                // Validate form
                const errors: typeof formErrors = {};

                // Title validation
                const title = ((formData.get("title") as string) || "").trim();
                if (!title) {
                  errors.title = "Title is required";
                } else if (title.length < 3) {
                  errors.title = "Title must be at least 3 characters";
                }

                // Description validation
                const description = (
                  (formData.get("description") as string) || ""
                ).trim();
                if (!description) {
                  errors.description = "Description is required";
                } else if (description.length < 10) {
                  errors.description =
                    "Description must be at least 10 characters";
                }

                // Owner validation
                const owner = formData.get("owner") as string;
                if (!owner) {
                  errors.owner = "Please select an owner";
                }

                // Date validation
                const dueDate = formData.get("dueDate") as string;
                if (!dueDate) {
                  errors.dueDate = "Target completion date is required";
                } else {
                  const selectedDate = new Date(dueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  if (selectedDate <= today) {
                    errors.dueDate = "Target date must be in the future";
                  }
                }

                setFormErrors(errors);

                // Stop if validation fails
                if (Object.keys(errors).length > 0) {
                  return;
                }

                try {
                  await createPDCACycle(project.id, {
                    projectId: project.id,
                    title,
                    description,
                    category: formData.get("category") as
                      | "Process"
                      | "Quality"
                      | "Safety"
                      | "Efficiency"
                      | "Other",
                    priority: formData.get("priority") as
                      | "High"
                      | "Medium"
                      | "Low",
                    owner,
                    team: [],
                    currentStage: "Plan",
                    targetCompletionDate: dueDate,
                    improvementMetrics: {
                      baseline: [],
                      target: [],
                      actual: [],
                    },
                  });
                  toast.success(t("pdcaCycleCreated"));
                  setFormErrors({});
                  setShowNewCycleModal(false);
                } catch (error) {
                  toast.error(t("pdcaCycleCreateFailed"));
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.title
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-brand-primary"
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {formErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.description
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-brand-primary"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {formErrors.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="Process">Process</option>
                      <option value="Quality">Quality</option>
                      <option value="Safety">Safety</option>
                      <option value="Efficiency">Efficiency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Owner *
                    </label>
                    <select
                      name="owner"
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.owner
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-brand-primary"
                      }`}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select owner...
                      </option>
                      {(users || []).map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.owner && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {formErrors.owner}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Target Completion *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      min={
                        new Date(Date.now() + 86400000)
                          .toISOString()
                          .split("T")[0]
                      }
                      className={`w-full px-3 py-2 border rounded-lg ${
                        formErrors.dueDate
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-brand-primary"
                      }`}
                    />
                    {formErrors.dueDate && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {formErrors.dueDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCycleModal(false);
                    setFormErrors({});
                  }}
                  className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDCACycleManager;

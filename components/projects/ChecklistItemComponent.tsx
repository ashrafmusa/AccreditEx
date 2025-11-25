import React, { useState } from "react";
import {
  ChecklistItem,
  ComplianceStatus,
  User,
  Standard,
  Project,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronDownIcon, SparklesIcon, PlusIcon } from "@/components/icons";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useToast } from "@/hooks/useToast";
import { aiService } from "@/services/ai";

import ChecklistComments from "./ChecklistComments";
import ChecklistEvidence from "./ChecklistEvidence";
import LinkDataModal from "../common/LinkDataModal";

interface ChecklistItemProps {
  item: ChecklistItem;
  project: Project;
}

const ChecklistItemComponent: React.FC<ChecklistItemProps> = ({
  item,
  project,
}) => {
  const { t } = useTranslation();
  const { users, currentUser } = useUserStore();
  const { standards } = useAppStore();
  const { updateChecklistItem, addCapaReport, uploadEvidence, addComment } =
    useProjectStore();
  const toast = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLinkDataOpen, setIsLinkDataOpen] = useState(false);

  const standard = standards.find((s) => s.standardId === item.standardId);
  const isFinalized = project.status === "Finalized";

  const handleUpdate = (updates: Partial<ChecklistItem>) => {
    updateChecklistItem(project.id, item.id, updates);
  };

  const handleSuggestActionPlan = async () => {
    if (!standard) return;
    setIsAiLoading(true);
    try {
      const suggestion = await aiService.suggestActionPlan(
        standard.description
      );
      handleUpdate({ actionPlan: suggestion });
      toast.success("AI suggestion applied to Action Plan.");
    } catch (error) {
      toast.error(t("actionPlanError"));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddCapa = () => {
    addCapaReport(project.id, item.id);
    toast.info("CAPA report created and linked.");
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg border border-brand-border dark:border-dark-brand-border">
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        {/* Main Content */}
        <div className="flex-grow">
          <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {item.item}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            Standard: {item.standardId}
          </p>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={item.status}
            onChange={(e) =>
              handleUpdate({ status: e.target.value as ComplianceStatus })
            }
            className="w-full sm:w-36 text-sm p-2 border rounded-md bg-white dark:bg-gray-700"
            disabled={isFinalized}
          >
            {Object.values(ComplianceStatus).map((s) => (
              <option key={s} value={s}>
                {t(
                  (s.charAt(0).toLowerCase() +
                    s.slice(1).replace(/\s/g, "")) as any
                )}
              </option>
            ))}
          </select>
          <select
            value={item.assignedTo || ""}
            onChange={(e) =>
              handleUpdate({ assignedTo: e.target.value || null })
            }
            className="w-full sm:w-36 text-sm p-2 border rounded-md bg-white dark:bg-gray-700"
            disabled={isFinalized}
          >
            <option value="">{t("unassigned")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={item.dueDate || ""}
            onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
            className="w-full sm:w-36 text-sm p-2 border rounded-md bg-white dark:bg-gray-700"
            disabled={isFinalized}
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-brand-primary"
          >
            <ChevronDownIcon
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-brand-border dark:border-dark-brand-border p-4 space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("actionPlan")}
              </label>
              <textarea
                value={item.actionPlan}
                onChange={(e) => handleUpdate({ actionPlan: e.target.value })}
                rows={4}
                className="w-full text-sm p-2 border rounded-md"
                disabled={isFinalized}
              />
              {!isFinalized && (
                <button
                  onClick={handleSuggestActionPlan}
                  disabled={isAiLoading}
                  className="text-sm flex items-center gap-1 text-brand-primary mt-1 disabled:opacity-50"
                >
                  <SparklesIcon
                    className={`w-4 h-4 ${isAiLoading ? "animate-spin" : ""}`}
                  />
                  {isAiLoading ? t("generating") : t("suggestWithAi")}
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("notes")}
              </label>
              <textarea
                value={item.notes}
                onChange={(e) => handleUpdate({ notes: e.target.value })}
                rows={4}
                className="w-full text-sm p-2 border rounded-md"
                disabled={isFinalized}
              />
            </div>
          </div>

          <ChecklistEvidence
            item={item}
            project={project}
            isFinalized={isFinalized}
            onUpload={uploadEvidence}
            onLinkData={() => setIsLinkDataOpen(true)}
          />

          <ChecklistComments
            item={item}
            currentUser={currentUser!}
            onAddComment={(text) => addComment(project.id, item.id, text)}
          />

          {!isFinalized && item.status === ComplianceStatus.NonCompliant && (
            <div className="pt-4 border-t">
              <button
                onClick={handleAddCapa}
                className="flex items-center gap-1 text-sm font-semibold bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-md hover:bg-yellow-200"
              >
                <PlusIcon className="w-4 h-4" />
                {t("createCapa")}
              </button>
            </div>
          )}
        </div>
      )}
      {isLinkDataOpen && (
        <LinkDataModal
          isOpen={isLinkDataOpen}
          onClose={() => setIsLinkDataOpen(false)}
          onLink={(resource) => {
            handleUpdate({
              linkedFhirResources: [
                ...(item.linkedFhirResources || []),
                resource,
              ],
            });
            setIsLinkDataOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ChecklistItemComponent;

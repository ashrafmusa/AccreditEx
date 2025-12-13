import React, { useState, useMemo } from "react";
import { Project, ComplianceStatus, ChecklistItem } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import ChecklistItemComponent from "./ChecklistItemComponent";
import { SearchIcon } from "../icons";
import { useProjectStore } from "@/stores/useProjectStore";

interface ProjectChecklistProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const ProjectChecklist: React.FC<ProjectChecklistProps> = ({ project }) => {
  const { t } = useTranslation();
  const { updateChecklistItem } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "all">(
    "all"
  );

  const handleChecklistItemUpdate = async (
    itemId: string,
    updates: Partial<ChecklistItem>
  ) => {
    await updateChecklistItem(project.id, itemId, updates);
  };

  const filteredChecklist = useMemo(() => {
    return project.checklist.filter((item) => {
      const matchesSearch =
        (item.item?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.standardId?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [project.checklist, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchChecklist")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full sm:w-48 p-2 border rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="all">{t("allStatuses")}</option>
          {Object.values(ComplianceStatus).map((s) => (
            <option key={s} value={s}>
              {t(
                (s.charAt(0).toLowerCase() +
                  s.slice(1).replace(/\s/g, "")) as any
              )}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filteredChecklist.map((item) => (
          <ChecklistItemComponent
            key={item.id}
            item={item}
            project={project}
            onUpdate={(updates) => handleChecklistItemUpdate(item.id, updates)}
          />
        ))}
        {filteredChecklist.length === 0 && (
          <div className="text-center py-10">
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("noChecklistItemsFound")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectChecklist;

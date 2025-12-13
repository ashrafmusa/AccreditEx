import React, { useState, useMemo, useEffect } from "react";
import { NavigationState, User, ProjectStatus } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import ProjectCard from "@/components/projects/ProjectCard";
import BulkActionsToolbar from "@/components/projects/BulkActionsToolbar";
import ProjectAnalytics from "@/components/projects/ProjectAnalytics";
import {
  FolderIcon,
  PlusIcon,
  SearchIcon,
  FunnelIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  CheckIcon,
  ChartBarSquareIcon,
} from "@/components/icons";
import EmptyState from "@/components/common/EmptyState";
import { Button, Input, LoadingSpinner } from "@/components/ui";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";

interface ProjectListPageProps {
  setNavigation: (state: NavigationState) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const {
    projects,
    deleteProject,
    loading,
    subscribeToProjects,
    unsubscribeFromProjects,
    bulkArchiveProjects,
    bulkRestoreProjects,
    bulkDeleteProjects,
    bulkUpdateStatus,
  } = useProjectStore();
  const { currentUser, users } = useUserStore();
  const { accreditationPrograms } = useAppStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all"
  );
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showOnlyMyProjects, setShowOnlyMyProjects] = useState(
    !currentUser || currentUser.role !== "Admin"
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    n: () => setNavigation({ view: "create-project" }),
    f: () => setShowFilters((prev) => !prev),
    a: () => setShowAnalytics((prev) => !prev),
    "/": (e) => {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    },
  });

  const programMap = useMemo(
    () => new Map(accreditationPrograms.map((p) => [p.id, p.name])),
    [accreditationPrograms]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Role-based access: Filter by team assignment
      if (showOnlyMyProjects && currentUser) {
        const isProjectLead = p.projectLead?.id === currentUser.id;
        const isTeamMember = p.teamMembers?.includes(currentUser.id);
        if (!isProjectLead && !isTeamMember) return false;
      }

      // Archive filter
      const matchesArchived = showArchived
        ? p.archived === true
        : p.archived !== true;
      if (!matchesArchived) return false;

      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      const matchesProgram =
        programFilter === "all" || p.programId === programFilter;

      const matchesAssignee =
        assigneeFilter === "all" ||
        p.projectLead?.id === assigneeFilter ||
        p.checklist.some((item) => item.assignedTo === assigneeFilter);

      const matchesDate =
        (!dateFilter.start ||
          new Date(p.startDate) >= new Date(dateFilter.start)) &&
        (!dateFilter.end ||
          (p.endDate && new Date(p.endDate) <= new Date(dateFilter.end)));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProgram &&
        matchesAssignee &&
        matchesDate
      );
    });
  }, [
    projects,
    searchTerm,
    statusFilter,
    programFilter,
    assigneeFilter,
    dateFilter,
    showArchived,
    showOnlyMyProjects,
    currentUser,
  ]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((p) => p.id));
    }
  };

  const handleBulkArchive = async () => {
    if (
      !window.confirm(
        `${t("areYouSureArchive")} ${selectedProjects.length} ${t(
          "project" + (selectedProjects.length > 1 ? "s" : "")
        )}?`
      )
    ) {
      return;
    }
    try {
      await bulkArchiveProjects(selectedProjects);
      setSelectedProjects([]);
      toast.success(t("projectsArchivedSuccessfully"));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("failedToArchiveProjects");
      toast.error(errorMsg);
      console.error("Bulk archive failed:", error);
    }
  };

  const handleBulkRestore = async () => {
    if (
      !window.confirm(
        `${t("areYouSureRestore")} ${selectedProjects.length} ${t(
          "project" + (selectedProjects.length > 1 ? "s" : "")
        )}?`
      )
    ) {
      return;
    }
    try {
      await bulkRestoreProjects(selectedProjects);
      setSelectedProjects([]);
      toast.success(t("projectsRestoredSuccessfully"));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("failedToRestoreProjects");
      toast.error(errorMsg);
      console.error("Bulk restore failed:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `${t("areYouSurePermanentlyDelete")} ${selectedProjects.length} ${t(
          "project" + (selectedProjects.length > 1 ? "s" : "")
        )}? ${t("thisActionCannotBeUndone")}`
      )
    ) {
      return;
    }
    try {
      await bulkDeleteProjects(selectedProjects);
      setSelectedProjects([]);
      toast.success(t("projectsDeletedSuccessfully"));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("failedToDeleteProjects");
      toast.error(errorMsg);
      console.error("Bulk delete failed:", error);
    }
  };

  const handleBulkUpdateStatus = async (status: ProjectStatus) => {
    if (
      !window.confirm(
        `${t("updateStatusTo")} ${
          t(status.replace(/\s/g, "").toLowerCase() as any) || status
        } ${t("forProjects")} ${selectedProjects.length}?`
      )
    ) {
      return;
    }
    try {
      await bulkUpdateStatus(selectedProjects, status);
      setSelectedProjects([]);
      toast.success(t("projectsUpdatedSuccessfully"));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("failedToUpdateProjects");
      toast.error(errorMsg);
      console.error("Bulk status update failed:", error);
    }
  };

  const handleDelete = (projectId: string) => {
    if (window.confirm(t("areYouSureDeleteProject"))) {
      try {
        deleteProject(projectId);
        toast.success(t("projectDeletedSuccessfully"));
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : t("failedToDeleteProject");
        toast.error(errorMsg);
        console.error("Delete failed:", error);
      }
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setProgramFilter("all");
    setAssigneeFilter("all");
    setDateFilter({ start: "", end: "" });
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {selectedProjects.length > 0 && (
        <div className="sticky top-4 z-40 animate-fadeIn">
          <BulkActionsToolbar
            selectedCount={selectedProjects.length}
            onArchive={handleBulkArchive}
            onRestore={handleBulkRestore}
            onDelete={handleBulkDelete}
            onUpdateStatus={handleBulkUpdateStatus}
            onClearSelection={() => setSelectedProjects([])}
            showRestore={showArchived}
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <FolderIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("accreditationProjects")}
            </h1>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          {currentUser?.role === "Admin" && (
            <Button
              onClick={() => setShowOnlyMyProjects(!showOnlyMyProjects)}
              variant={showOnlyMyProjects ? "secondary" : "primary"}
              className="w-full sm:w-auto"
            >
              <CheckIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {showOnlyMyProjects ? t("showAllProjects") : t("showMyProjects")}
            </Button>
          )}
          <Button
            onClick={() => setShowAnalytics(!showAnalytics)}
            variant={showAnalytics ? "primary" : "secondary"}
            className="w-full sm:w-auto"
          >
            <ChartBarSquareIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {showAnalytics ? t("hideAnalytics") : t("showAnalytics")}
          </Button>
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant={showArchived ? "primary" : "secondary"}
            className="w-full sm:w-auto"
          >
            <ArchiveBoxIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {showArchived ? t("hideArchived") : t("showArchived")}
          </Button>
          <Button
            onClick={() => setNavigation({ view: "createProject" })}
            className="w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("createNewProject")}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t("searchProjects")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon className="w-5 h-5" />}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "secondary"}
          >
            <FunnelIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("filterByStatus")}
          </Button>
          {(statusFilter !== "all" ||
            programFilter !== "all" ||
            assigneeFilter !== "all" ||
            dateFilter.start ||
            dateFilter.end) && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("program")}
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="all">{t("allPrograms")}</option>
                {accreditationPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("filterByStatus")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ProjectStatus | "all")
                }
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="all">{t("allStatuses")}</option>
                {Object.values(ProjectStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(status.replace(/\s/g, "").toLowerCase() as any) ||
                      status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("filterByAssignee")}
              </label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="all">{t("allAssignees")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("dateRange")}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                  placeholder={t("startDate")}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="animate-fadeIn">
          <ProjectAnalytics projects={filteredProjects} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const assignedUserIds = new Set(
              p.checklist.map((item) => item.assignedTo).filter(Boolean)
            );
            if (p.projectLead?.id) {
              assignedUserIds.add(p.projectLead.id);
            }
            const teamMembers = Array.from(assignedUserIds)
              .map((id) => users.find((u) => u.id === id))
              .filter((u): u is User => !!u);

            return (
              <ProjectCard
                key={p.id}
                project={{
                  ...p,
                  programName: programMap.get(p.programId) || "?",
                  teamMembers,
                }}
                currentUser={currentUser!}
                onSelect={() =>
                  setNavigation({ view: "projectDetail", projectId: p.id })
                }
                onEdit={() =>
                  setNavigation({ view: "editProject", projectId: p.id })
                }
                onDelete={() => handleDelete(p.id)}
                selected={selectedProjects.includes(p.id)}
                onToggleSelect={() => handleSelectProject(p.id)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderIcon}
          title={
            searchTerm ||
            statusFilter !== "all" ||
            programFilter !== "all" ||
            assigneeFilter !== "all"
              ? t("noProjectsFound")
              : t("noProjects")
          }
          message={
            searchTerm ||
            statusFilter !== "all" ||
            programFilter !== "all" ||
            assigneeFilter !== "all"
              ? t("tryAdjustingSearch")
              : t("createFirstProject")
          }
        />
      )}
    </div>
  );
};

export default ProjectListPage;

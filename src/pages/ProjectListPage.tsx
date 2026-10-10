import EmptyState from "@/components/common/EmptyState";
import {
  ArchiveBoxIcon,
  ChartBarSquareIcon,
  CheckIcon,
  FolderIcon,
  FunnelIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import BulkActionsToolbar from "@/components/projects/BulkActionsToolbar";
import ProjectAnalytics from "@/components/projects/ProjectAnalytics";
import ProjectCard from "@/components/projects/ProjectCard";
import { Button, Input } from "@/components/ui";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";
import { Action, Resource, usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { NavigationState, ProjectStatus, User } from "@/types";
import React, { useMemo, useState } from "react";
import {
  PROJECT_STATUS_KEYS,
  projectCalendarDate,
  projectWorkSummary,
} from "@/utils/projectJourney";

interface ProjectListPageProps {
  setNavigation: (state: NavigationState) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ setNavigation }) => {
  const { t, lang } = useTranslation();
  const {
    projects,
    deleteProject,
    loading,
    error,
    fetchAllProjects,
    bulkArchiveProjects,
    bulkRestoreProjects,
    bulkDeleteProjects,
    bulkUpdateStatus,
  } = useProjectStore();
  const { currentUser, users } = useUserStore();
  const { accreditationPrograms, departments } = useAppStore();
  const toast = useToast();
  const { can, isAdmin } = usePermission();
  const canCreateProject = can(Action.Create, Resource.Project);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortOrder, setSortOrder] = useState<
    "default" | "name" | "deadline" | "remaining"
  >("default");
  const [showOnlyMyProjects, setShowOnlyMyProjects] = useState(
    !currentUser || currentUser.role !== "Admin",
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    n: () => {
      if (canCreateProject) setNavigation({ view: "createProject" });
    },
    f: () => setShowFilters((prev) => !prev),
    a: () => setShowAnalytics((prev) => !prev),
    "/": () => {
      document.getElementById("project-search")?.focus();
    },
  });

  const programMap = useMemo(
    () => new Map(accreditationPrograms.map((p) => [p.id, p.name])),
    [accreditationPrograms],
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Role-based access: Filter by team assignment
      if (
        currentUser?.organizationId &&
        p.organizationId !== currentUser.organizationId
      )
        return false;
      if (showOnlyMyProjects && currentUser) {
        const isProjectLead = p.projectLead?.id === currentUser.id;
        const isTeamMember = p.teamMembers?.includes(currentUser.id);
        const hasAssignedTasks = p.checklist?.some(
          (item) => item.assignedTo === currentUser.id,
        );
        if (!isProjectLead && !isTeamMember && !hasAssignedTasks) return false;
      }

      // Archive filter
      const matchesArchived = showArchived
        ? p.archived === true
        : p.archived !== true;
      if (!matchesArchived) return false;

      const projectDepartmentIds = [p.departmentId, ...(p.departmentIds || [])];
      const searchText = [
        p.name,
        p.description,
        programMap.get(p.programId),
        p.projectLead?.name,
        ...departments
          .filter((d) => projectDepartmentIds.includes(d.id))
          .map((d) => d.name?.[lang] || d.name?.en || d.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchText.includes(
        searchTerm.trim().toLowerCase(),
      );

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      const matchesProgram =
        programFilter === "all" || p.programId === programFilter;

      const matchesDepartment =
        departmentFilter === "all" ||
        p.departmentId === departmentFilter ||
        (p.departmentIds || []).includes(departmentFilter);

      const matchesAssignee =
        assigneeFilter === "all" ||
        p.projectLead?.id === assigneeFilter ||
        p.teamMembers?.includes(assigneeFilter) ||
        p.checklist?.some((item) => item.assignedTo === assigneeFilter);

      const start = projectCalendarDate(p.startDate);
      const end = projectCalendarDate(p.endDate);
      const from = projectCalendarDate(dateFilter.start);
      const to = projectCalendarDate(dateFilter.end);
      const matchesDate =
        (!from || (!!start && start >= from)) && (!to || (!!end && end <= to));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProgram &&
        matchesDepartment &&
        matchesAssignee &&
        matchesDate
      );
    });
  }, [
    projects,
    searchTerm,
    statusFilter,
    programFilter,
    departmentFilter,
    assigneeFilter,
    dateFilter,
    showArchived,
    showOnlyMyProjects,
    currentUser,
    departments,
    programMap,
    lang,
  ]);

  const visibleProjects = useMemo(
    () =>
      [...filteredProjects].sort((a, b) => {
        if (sortOrder === "name") return a.name.localeCompare(b.name, lang);
        if (sortOrder === "deadline")
          return (
            (projectCalendarDate(a.endDate)?.getTime() ?? Infinity) -
            (projectCalendarDate(b.endDate)?.getTime() ?? Infinity)
          );
        if (sortOrder === "remaining")
          return (
            projectWorkSummary(b).remaining - projectWorkSummary(a).remaining
          );
        return 0;
      }),
    [filteredProjects, sortOrder, lang],
  );
  const visibleSelection = selectedProjects.filter((id) =>
    filteredProjects.some((p) => p.id === id),
  );
  const hasFilters =
    !!searchTerm ||
    statusFilter !== "all" ||
    programFilter !== "all" ||
    departmentFilter !== "all" ||
    assigneeFilter !== "all" ||
    !!dateFilter.start ||
    !!dateFilter.end;

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [
          ...prev.filter((id) => filteredProjects.some((p) => p.id === id)),
          projectId,
        ];
      }
    });
  };

  const handleSelectAll = () => {
    if (visibleSelection.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((p) => p.id));
    }
  };

  const handleBulkArchive = async () => {
    if (
      !(await useConfirmStore
        .getState()
        .confirm(
          `${t("areYouSureArchive")} ${visibleSelection.length} ${t(
            "project" + (visibleSelection.length > 1 ? "s" : ""),
          )}?`,
          t("archiveProjects") || "Archive Projects",
          t("archive") || "Archive",
        ))
    ) {
      return;
    }
    try {
      await bulkArchiveProjects(visibleSelection);
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
      !(await useConfirmStore
        .getState()
        .confirm(
          `${t("areYouSureRestore")} ${visibleSelection.length} ${t(
            "project" + (visibleSelection.length > 1 ? "s" : ""),
          )}?`,
          t("restoreProjects") || "Restore Projects",
          t("restore") || "Restore",
        ))
    ) {
      return;
    }
    try {
      await bulkRestoreProjects(visibleSelection);
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
      !(await useConfirmStore
        .getState()
        .confirm(
          `${t("areYouSurePermanentlyDelete")} ${visibleSelection.length} ${t(
            "project" + (visibleSelection.length > 1 ? "s" : ""),
          )}? ${t("thisActionCannotBeUndone")}`,
          t("deleteProjects") || "Delete Projects",
          t("delete") || "Delete",
        ))
    ) {
      return;
    }
    try {
      await bulkDeleteProjects(visibleSelection);
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
      !(await useConfirmStore
        .getState()
        .confirm(
          `${t("updateStatusTo")} ${t(
            PROJECT_STATUS_KEYS[status],
          )} ${t("forProjects")} ${visibleSelection.length}?`,
          t("updateStatus") || "Update Status",
          t("update") || "Update",
        ))
    ) {
      return;
    }
    try {
      await bulkUpdateStatus(visibleSelection, status);
      setSelectedProjects([]);
      toast.success(t("projectsUpdatedSuccessfully"));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("failedToUpdateProjects");
      toast.error(errorMsg);
      console.error("Bulk status update failed:", error);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (
      await useConfirmStore
        .getState()
        .confirm(
          t("areYouSureDeleteProject"),
          t("deleteProject") || "Delete Project",
          t("delete") || "Delete",
        )
    ) {
      try {
        await deleteProject(projectId);
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
    setDepartmentFilter("all");
    setAssigneeFilter("all");
    setDateFilter({ start: "", end: "" });
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {visibleSelection.length > 0 && isAdmin && !error && !loading && (
        <div className="sticky top-4 z-40 animate-fadeIn">
          <BulkActionsToolbar
            selectedCount={visibleSelection.length}
            onArchive={
              can(Action.Update, Resource.Project)
                ? handleBulkArchive
                : undefined
            }
            onRestore={
              can(Action.Update, Resource.Project)
                ? handleBulkRestore
                : undefined
            }
            onDelete={
              can(Action.Delete, Resource.Project)
                ? handleBulkDelete
                : undefined
            }
            onUpdateStatus={
              can(Action.Update, Resource.Project)
                ? handleBulkUpdateStatus
                : undefined
            }
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
            <p className="mt-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("projectListHelp")}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          {currentUser?.role === "Admin" && (
            <Button
              onClick={() => setShowOnlyMyProjects(!showOnlyMyProjects)}
              aria-pressed={showOnlyMyProjects}
              variant={showOnlyMyProjects ? "secondary" : "primary"}
              className="w-full sm:w-auto"
            >
              <CheckIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {showOnlyMyProjects ? t("showAllProjects") : t("showMyProjects")}
            </Button>
          )}
          <Button
            onClick={() => setShowAnalytics(!showAnalytics)}
            aria-expanded={showAnalytics}
            variant={showAnalytics ? "primary" : "secondary"}
            className="w-full sm:w-auto"
          >
            <ChartBarSquareIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {showAnalytics ? t("hideAnalytics") : t("showAnalytics")}
          </Button>
          <Button
            onClick={() => setShowArchived(!showArchived)}
            aria-pressed={showArchived}
            variant={showArchived ? "primary" : "secondary"}
            className="w-full sm:w-auto"
          >
            <ArchiveBoxIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {showArchived ? t("hideArchived") : t("showArchived")}
          </Button>
          {canCreateProject && (
            <Button
              onClick={() => setNavigation({ view: "createProject" })}
              className="w-full sm:w-auto"
            >
              <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {t("createNewProject")}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              id="project-search"
              aria-label={t("searchProjects")}
              placeholder={t("searchProjects")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon className="w-5 h-5" />}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="project-filters"
            variant={showFilters ? "primary" : "secondary"}
          >
            <FunnelIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("projectFilters")}
          </Button>
          {hasFilters && (
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
          <div
            id="project-filters"
            className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("program")}
              </label>
              <select
                aria-label={t("program")}
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
                aria-label={t("filterByStatus")}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ProjectStatus | "all")
                }
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="all">{t("allStatuses")}</option>
                {Object.values(ProjectStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(PROJECT_STATUS_KEYS[status])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("department") || "Department"}
              </label>
              <select
                aria-label={t("department")}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
              >
                <option value="all">
                  {t("allDepartments") || "All Departments"}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name?.[lang] || d.name?.en || d.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("filterByAssignee")}
              </label>
              <select
                aria-label={t("filterByAssignee")}
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
                {t("projectStartFrom")}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  aria-label={t("projectStartFrom")}
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("projectEndBy")}
                </label>
                <input
                  type="date"
                  aria-label={t("projectEndBy")}
                  value={dateFilter.end}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {showAnalytics && !error && !loading && (
        <div className="animate-fadeIn">
          <ProjectAnalytics projects={filteredProjects} />
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <p
            role="status"
            className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary"
          >
            {t(
              showArchived ? "projectArchivedResults" : "projectActiveResults",
              { count: filteredProjects.length },
            )}{" "}
            {showOnlyMyProjects && t("projectMyScope")}
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            {isAdmin && filteredProjects.length > 0 && (
              <Button variant="secondary" onClick={handleSelectAll}>
                {t(
                  visibleSelection.length === filteredProjects.length
                    ? "projectDeselectVisible"
                    : "projectSelectVisible",
                )}
              </Button>
            )}
            <select
              aria-label={t("projectSort")}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="min-h-11 rounded-lg border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface px-3 text-sm"
            >
              <option value="default">{t("projectSortDefault")}</option>
              <option value="name">{t("projectSortName")}</option>
              <option value="deadline">{t("projectSortDeadline")}</option>
              <option value="remaining">{t("projectSortRemaining")}</option>
            </select>
          </div>
        </div>
      )}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-300 p-5">
          <p>{t("projectLoadError")}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedProjects([]);
              void fetchAllProjects();
            }}
          >
            {t("projectRetry")}
          </Button>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleProjects.map((p) => {
            const assignedUserIds = new Set([
              ...(p.teamMembers || []),
              ...(p.checklist || [])
                .map((item) => item.assignedTo)
                .filter(Boolean),
            ]);
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
                  programName:
                    programMap.get(p.programId) || t("projectUnknownProgram"),
                }}
                teamUsers={teamMembers}
                currentUser={currentUser}
                onSelect={() =>
                  setNavigation({ view: "projectDetail", projectId: p.id })
                }
                onEdit={() =>
                  setNavigation({ view: "editProject", projectId: p.id })
                }
                onDelete={() => handleDelete(p.id)}
                selected={visibleSelection.includes(p.id)}
                onToggleSelect={
                  isAdmin ? () => handleSelectProject(p.id) : undefined
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderIcon}
          title={hasFilters ? t("noProjectsFound") : t("noProjects")}
          message={
            hasFilters
              ? t("tryAdjustingSearch")
              : t(
                  showArchived
                    ? "projectNoArchived"
                    : showOnlyMyProjects
                      ? "projectNoAssigned"
                      : canCreateProject
                        ? "createFirstProject"
                        : "projectNoVisible",
                )
          }
          action={
            hasFilters
              ? { label: t("clearFilters"), onClick: clearFilters }
              : !showArchived && !showOnlyMyProjects && canCreateProject
                ? {
                    label: t("createNewProject"),
                    onClick: () => setNavigation({ view: "createProject" }),
                  }
                : undefined
          }
        />
      )}
    </div>
  );
};

export default ProjectListPage;

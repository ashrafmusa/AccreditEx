import React from "react";
import { ProjectDetailView, Project } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermission, Action, Resource } from "@/hooks/usePermission";
import { useModuleStore } from "@/stores/useModuleStore";
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from "@/components/icons";

interface ProjectDetailSidebarProps {
  project: Project;
  activeView: ProjectDetailView;
  setActiveView: (view: ProjectDetailView) => void;
}

const ProjectDetailSidebar: React.FC<ProjectDetailSidebarProps> = ({
  project,
  activeView,
  setActiveView,
}) => {
  const { t } = useTranslation();
  const { can } = usePermission();
  const isNavKeyEnabled = useModuleStore((state) => state.isNavKeyEnabled);

  // Count active PDCA cycles (not completed)
  const activePDCACycles = (project.pdcaCycles || []).filter(
    (cycle) => cycle.currentStage !== "Completed",
  ).length;

  const navItems: {
    id: ProjectDetailView;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: "overview", label: t("projects.overview"), icon: ChartBarIcon },
    {
      id: "checklist",
      label: t("projects.checklist"),
      icon: ClipboardDocumentCheckIcon,
    },
    {
      id: "documents",
      label: t("projects.documents") || "Documents",
      icon: DocumentTextIcon,
    },
    {
      id: "design_controls",
      label: t("projects.designControls"),
      icon: CubeIcon,
    },
    {
      id: "mock_surveys",
      label: t("projects.mockSurveys"),
      icon: ClipboardDocumentListIcon,
    },
    {
      id: "pdca_cycles",
      label: t("projects.pdcaCycles"),
      icon: ArrowPathIcon,
      badge: activePDCACycles,
    },
    { id: "audit_log", label: t("projects.auditLog"), icon: ClockIcon },
  ];

  return (
    <aside className="w-full lg:w-1/4 xl:w-1/5 bg-white dark:bg-dark-brand-surface rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border overflow-hidden">
      <nav
        aria-label={t("projectWorkspaceSections")}
        className="flex overflow-x-auto lg:flex-col p-2 gap-1"
      >
        {navItems
          .filter((item) =>
            item.id === "documents"
              ? can(Action.Read, Resource.Document) &&
                isNavKeyEnabled("documentControl")
              : item.id === "audit_log" || item.id === "mock_surveys"
                ? can(Action.Read, Resource.Audit)
                : true,
          )
          .map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id)}
              className={`flex shrink-0 min-h-11 items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary ${
                activeView === item.id
                  ? "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light"
                  : "text-brand-text-secondary hover:bg-slate-100 dark:text-dark-brand-text-secondary dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-start whitespace-nowrap">
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-brand-primary rounded-full min-w-5">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
      </nav>
    </aside>
  );
};

export default ProjectDetailSidebar;

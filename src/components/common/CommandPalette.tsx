import React, { useState, useEffect, useMemo, FC } from "react";
// Force HMR update
import {
  Project,
  User,
  AppDocument,
  Standard,
  AccreditationProgram,
  NavigationState,
  CAPAReport,
} from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
} from "@/components/icons";

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setNavigation: (state: NavigationState) => void;
  projects: Project[];
  users: User[];
  documents: AppDocument[];
  standards: Standard[];
  programs: AccreditationProgram[];
}

type FilterType =
  | "all"
  | "projects"
  | "documents"
  | "standards"
  | "capa"
  | "users";

const CommandPalette: FC<CommandPaletteProps> = ({
  isOpen,
  setIsOpen,
  setNavigation,
  projects,
  users,
  documents,
  standards,
  programs,
}) => {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("accreditex_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter((s) => s !== term)].slice(
      0,
      5,
    );
    setRecentSearches(newRecent);
    localStorage.setItem(
      "accreditex_recent_searches",
      JSON.stringify(newRecent),
    );
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];

    const lowerSearch = searchTerm.toLowerCase();
    let results: {
      type: FilterType;
      name: string;
      subtitle?: string;
      link: () => void;
      icon: any;
    }[] = [];

    // Projects
    if (activeFilter === "all" || activeFilter === "projects") {
      results.push(
        ...projects
          .filter((p) => p.name.toLowerCase().includes(lowerSearch))
          .map((p) => ({
            type: "projects" as FilterType,
            name: p.name,
            subtitle: `${p.progress.toFixed(0)}% • ${p.status}`,
            link: () =>
              setNavigation({ view: "projectDetail", projectId: p.id }),
            icon: FolderIcon,
          })),
      );
    }

    // Documents
    if (activeFilter === "all" || activeFilter === "documents") {
      results.push(
        ...documents
          .filter((d) =>
            (d.name[lang] || d.name.en).toLowerCase().includes(lowerSearch),
          )
          .map((d) => ({
            type: "documents" as FilterType,
            name: d.name[lang] || d.name.en,
            subtitle: d.status,
            link: () => setNavigation({ view: "documentControl" }), // Ideally open specific doc
            icon: DocumentTextIcon,
          })),
      );
    }

    // Standards
    if (activeFilter === "all" || activeFilter === "standards") {
      results.push(
        ...standards
          .filter(
            (s) =>
              s.standardId.toLowerCase().includes(lowerSearch) ||
              s.description.toLowerCase().includes(lowerSearch),
          )
          .map((s) => ({
            type: "standards" as FilterType,
            name: s.standardId,
            subtitle: s.description.substring(0, 60) + "...",
            link: () =>
              setNavigation({ view: "standards", programId: s.programId }),
            icon: CheckCircleIcon,
          })),
      );
    }

    // CAPA
    if (activeFilter === "all" || activeFilter === "capa") {
      const allCapas = projects.flatMap((p) =>
        (p.capaReports || []).map((c) => ({
          ...c,
          projectName: p.name,
          projectId: p.id,
        })),
      );
      results.push(
        ...allCapas
          .filter(
            (c) =>
              (c.description || "").toLowerCase().includes(lowerSearch) ||
              c.id.toLowerCase().includes(lowerSearch),
          )
          .map((c) => ({
            type: "capa" as FilterType,
            name: `CAPA: ${c.id}`,
            subtitle: (c.description || "").substring(0, 50) + "...",
            link: () =>
              setNavigation({ view: "projectDetail", projectId: c.projectId }),
            icon: ExclamationTriangleIcon,
          })),
      );
    }

    // Users
    if (activeFilter === "all" || activeFilter === "users") {
      results.push(
        ...users
          .filter((u) => u.name.toLowerCase().includes(lowerSearch))
          .map((u) => ({
            type: "users" as FilterType,
            name: u.name,
            subtitle: u.role,
            link: () => setNavigation({ view: "settings", section: "users" }),
            icon: UsersIcon,
          })),
      );
    }

    return results;
  }, [
    searchTerm,
    activeFilter,
    projects,
    users,
    documents,
    standards,
    lang,
    setNavigation,
  ]);

  const handleItemClick = (link: () => void) => {
    saveRecentSearch(searchTerm);
    link();
    setSearchTerm("");
    setIsOpen(false);
  };

  const clearRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter((s) => s !== term);
    setRecentSearches(newRecent);
    localStorage.setItem(
      "accreditex_recent_searches",
      JSON.stringify(newRecent),
    );
  };

  if (!isOpen) return null;

  const filters: { id: FilterType; labelKey: string }[] = [
    { id: "all", labelKey: "all" },
    { id: "projects", labelKey: "projects" },
    { id: "documents", labelKey: "documents" },
    { id: "standards", labelKey: "standardsLibrary" },
    { id: "capa", labelKey: "capa" },
    { id: "users", labelKey: "users" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-20 backdrop-blur-sm transition-all"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-brand-border dark:border-dark-brand-border flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-brand-border dark:border-dark-brand-border p-4">
          <MagnifyingGlassIcon className="absolute top-1/2 -translate-y-1/2 left-6 h-5 w-5 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-background dark:bg-dark-brand-background pl-10 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-primary-400 text-brand-text-primary dark:text-dark-brand-text-primary placeholder-brand-text-secondary dark:placeholder-dark-brand-text-secondary"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-3 border-b border-brand-border dark:border-dark-brand-border overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t(filter.labelKey as any)}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {!searchTerm ? (
            // Recent Searches
            <div className="p-2">
              <h3 className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase mb-2 px-2">
                {t("recentSearches")}
              </h3>
              {recentSearches.length > 0 ? (
                <ul>
                  {recentSearches.map((term, index) => (
                    <li key={index}>
                      <button
                        onClick={() => setSearchTerm(term)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
                      >
                        <div className="flex items-center gap-3">
                          <ClockIcon className="w-4 h-4 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
                          <span className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                            {term}
                          </span>
                        </div>
                        <div
                          onClick={(e) => clearRecentSearch(term, e)}
                          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-3 h-3 text-brand-text-secondary" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary px-2 italic">
                  {t("noRecentSearches")}
                </p>
              )}
            </div>
          ) : (
            // Search Results
            <div>
              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index}>
                        <button
                          onClick={() => handleItemClick(item.link)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left group"
                        >
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-brand-text-secondary dark:text-dark-brand-text-secondary group-hover:bg-white dark:group-hover:bg-gray-600 group-hover:text-brand-primary dark:group-hover:text-brand-primary-400 transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                              {item.name}
                            </h4>
                            {item.subtitle && (
                              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary truncate">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {t(
                              item.type === "standards"
                                ? "standard"
                                : item.type,
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-brand-text-primary dark:text-dark-brand-text-primary font-medium">
                    {t("noResultsFound")}
                  </p>
                  <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                    {t("tryAdjustingSearch")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-brand-border dark:border-dark-brand-border bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-sans">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-sans">
                ↓
              </kbd>
              <span>{t("toNavigate")}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-sans">
                ↵
              </kbd>
              <span>{t("toSelect")}</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-sans">
              Esc
            </kbd>
            <span>{t("toClose")}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

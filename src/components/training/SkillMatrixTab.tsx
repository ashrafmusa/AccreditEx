import React, { useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { User, Competency } from "@/types";
import { EmptyState } from "@/components/ui";
import { AcademicCapIcon } from "@/components/icons";

type CellStatus = "active" | "expiring" | "expired" | "missing" | "gap";

interface MatrixCell {
  status: CellStatus;
  issueDate?: string;
  expiryDate?: string;
  hasEvidence: boolean;
}

function getCompetencyStatus(
  user: User,
  competencyId: string,
  requiredIds: Set<string>,
): MatrixCell {
  const uc = user.competencies?.find((c) => c.competencyId === competencyId);
  if (!uc) {
    return {
      status: requiredIds.has(competencyId) ? "gap" : "missing",
      hasEvidence: false,
    };
  }
  const now = new Date();
  const expiry = uc.expiryDate ? new Date(uc.expiryDate) : null;
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let status: CellStatus = "active";
  if (expiry && expiry < now) status = "expired";
  else if (expiry && expiry < thirtyDays) status = "expiring";

  return {
    status,
    issueDate: uc.issueDate,
    expiryDate: uc.expiryDate,
    hasEvidence: (uc.evidenceDocumentIds?.length ?? 0) > 0,
  };
}

const STATUS_COLORS: Record<CellStatus, string> = {
  active: "bg-green-500 dark:bg-green-600",
  expiring: "bg-yellow-400 dark:bg-yellow-500",
  expired: "bg-red-500 dark:bg-red-600",
  missing: "bg-gray-200 dark:bg-gray-700",
  gap: "bg-gray-200 dark:bg-gray-700 ring-2 ring-blue-500 ring-inset",
};

const STATUS_LABELS: Record<CellStatus, string> = {
  active: "Active",
  expiring: "Expiring Soon",
  expired: "Expired",
  missing: "Not Assigned",
  gap: "Required Gap",
};

const SkillMatrixTab: React.FC = () => {
  const { t, lang } = useTranslation();
  const { competencies, departments } = useAppStore();
  const { users } = useUserStore();
  const [deptFilter, setDeptFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [hoveredCell, setHoveredCell] = useState<{
    userId: string;
    compId: string;
  } | null>(null);

  const activeUsers = useMemo(() => {
    let filtered = users.filter((u) => u.isActive !== false);
    if (deptFilter !== "all") {
      filtered = filtered.filter(
        (u) => u.departmentId === deptFilter || u.department === deptFilter,
      );
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, deptFilter]);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          competencies.map((c) => c.category).filter(Boolean) as string[],
        ),
      ].sort(),
    [competencies],
  );

  const visibleCompetencies = useMemo(() => {
    let filtered = competencies.filter((c) => c.isActive !== false);
    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }
    return filtered;
  }, [competencies, categoryFilter]);

  // Build required competency set for user departments
  const requiredCompetencyIds = useMemo(() => {
    const ids = new Set<string>();
    departments.forEach((d) =>
      d.requiredCompetencyIds?.forEach((id) => ids.add(id)),
    );
    return ids;
  }, [departments]);

  // Summary stats
  const stats = useMemo(() => {
    let active = 0,
      expiring = 0,
      expired = 0,
      gaps = 0,
      total = 0;
    activeUsers.forEach((user) => {
      visibleCompetencies.forEach((comp) => {
        total++;
        const cell = getCompetencyStatus(user, comp.id, requiredCompetencyIds);
        if (cell.status === "active") active++;
        else if (cell.status === "expiring") expiring++;
        else if (cell.status === "expired") expired++;
        else if (cell.status === "gap") gaps++;
      });
    });
    return { active, expiring, expired, gaps, total };
  }, [activeUsers, visibleCompetencies, requiredCompetencyIds]);

  if (competencies.length === 0 || users.length === 0) {
    return (
      <EmptyState
        icon={<AcademicCapIcon className="h-12 w-12" />}
        title={t("noDataAvailable")}
        description="Add competencies and users to view the skill matrix."
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          Skill Matrix
        </h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary"
          >
            <option value="all">{t("allDepartments")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name[lang]}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          {
            label: "Active",
            value: stats.active,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Expiring",
            value: stats.expiring,
            color: "text-yellow-600 dark:text-yellow-400",
            bg: "bg-yellow-50 dark:bg-yellow-900/20",
          },
          {
            label: "Expired",
            value: stats.expired,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-900/20",
          },
          {
            label: "Gaps",
            value: stats.gaps,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Coverage",
            value:
              stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}%`
                : "0%",
            color: "text-brand-text-primary dark:text-dark-brand-text-primary",
            bg: "bg-brand-surface-alt dark:bg-dark-brand-surface-alt",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
        {Object.entries(STATUS_COLORS).map(([key, colorClass]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-3.5 w-3.5 rounded-sm ${colorClass}`}
            />
            {STATUS_LABELS[key as CellStatus]}
          </div>
        ))}
      </div>

      {/* Matrix Grid */}
      <div className="overflow-auto rounded-lg border border-brand-border dark:border-dark-brand-border max-h-[calc(100vh-380px)]">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left font-semibold text-brand-text-primary dark:text-dark-brand-text-primary min-w-[160px] border-b border-brand-border dark:border-dark-brand-border">
                Staff Member
              </th>
              {visibleCompetencies.map((comp) => (
                <th
                  key={comp.id}
                  className="px-1 py-2 text-center font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary border-b border-brand-border dark:border-dark-brand-border min-w-[40px]"
                  title={`${comp.name[lang]}${comp.category ? ` (${comp.category})` : ""}${comp.level ? ` — ${comp.level}` : ""}`}
                >
                  <div
                    className="writing-mode-vertical max-h-[120px] overflow-hidden whitespace-nowrap text-ellipsis"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {comp.name[lang]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              >
                <td className="sticky left-0 z-10 bg-brand-surface dark:bg-dark-brand-surface px-3 py-1.5 whitespace-nowrap font-medium text-brand-text-primary dark:text-dark-brand-text-primary border-b border-brand-border/50 dark:border-dark-brand-border/50">
                  <div>{user.name}</div>
                  {user.department && (
                    <div className="text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {user.department}
                    </div>
                  )}
                </td>
                {visibleCompetencies.map((comp) => {
                  const cell = getCompetencyStatus(
                    user,
                    comp.id,
                    requiredCompetencyIds,
                  );
                  const isHovered =
                    hoveredCell?.userId === user.id &&
                    hoveredCell?.compId === comp.id;
                  return (
                    <td
                      key={comp.id}
                      className="px-0.5 py-1 text-center border-b border-brand-border/30 dark:border-dark-brand-border/30 relative"
                      onMouseEnter={() =>
                        setHoveredCell({ userId: user.id, compId: comp.id })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`mx-auto h-6 w-6 rounded-sm ${STATUS_COLORS[cell.status]} ${cell.hasEvidence ? "border-2 border-white dark:border-gray-900" : ""} cursor-default transition-transform ${isHovered ? "scale-125" : ""}`}
                        title={`${user.name} — ${comp.name[lang]}\nStatus: ${STATUS_LABELS[cell.status]}${cell.expiryDate ? `\nExpiry: ${cell.expiryDate}` : ""}${cell.hasEvidence ? "\n📎 Has evidence" : ""}`}
                      />
                      {/* Tooltip */}
                      {isHovered && cell.status !== "missing" && (
                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg">
                          <div className="font-medium">
                            {STATUS_LABELS[cell.status]}
                          </div>
                          {cell.issueDate && (
                            <div>Issued: {cell.issueDate}</div>
                          )}
                          {cell.expiryDate && (
                            <div>Expires: {cell.expiryDate}</div>
                          )}
                          {cell.hasEvidence && <div>📎 Evidence attached</div>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeUsers.length === 0 && (
        <div className="text-center py-8 text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm">
          No staff members found for selected filters.
        </div>
      )}
    </div>
  );
};

export default SkillMatrixTab;

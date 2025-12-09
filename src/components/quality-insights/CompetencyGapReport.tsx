import React, { useState, useMemo } from "react";
import { Department, User, Competency } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { EmptyState, TableContainer } from "@/components/ui";
import { ChartBarIcon } from "../icons";

interface CompetencyGapReportProps {
  departments: Department[];
  users: User[];
  competencies: Competency[];
}

const CompetencyGapReport: React.FC<CompetencyGapReportProps> = ({
  departments,
  users,
  competencies,
}) => {
  const { t, lang } = useTranslation();
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const competencyGapData = useMemo(() => {
    const deptsToAnalyze =
      departmentFilter === "all"
        ? departments
        : departments.filter((d) => d.id === departmentFilter);

    return deptsToAnalyze
      .filter((d) => d.requiredCompetencyIds?.length)
      .flatMap((dept) => {
        const usersInDept = users.filter((u) => u.departmentId === dept.id);
        if (usersInDept.length === 0) return [];

        return dept
          .requiredCompetencyIds!.map((reqCompId) => {
            const competency = competencies.find((c) => c.id === reqCompId);
            if (!competency) return null;

            const usersWithCompetency = usersInDept.filter((u) =>
              u.competencies?.some(
                (c) =>
                  c.competencyId === reqCompId &&
                  (!c.expiryDate || new Date(c.expiryDate) > new Date())
              )
            ).length;

            return {
              id: `${dept.id}-${reqCompId}`,
              department: dept.name[lang],
              competency: competency.name[lang],
              compliantUsers: usersWithCompetency,
              totalUsers: usersInDept.length,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      });
  }, [departments, users, competencies, lang, departmentFilter]);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-xl shadow-md border border-brand-border dark:border-dark-brand-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
          {t("competencyGapAnalysis")}
        </h3>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full sm:w-auto border border-brand-border dark:border-dark-brand-border rounded-lg py-2 px-3 focus:ring-brand-primary-500 focus:border-brand-primary-500 bg-brand-surface dark:bg-dark-brand-surface text-sm dark:text-dark-brand-text-primary"
        >
          <option value="all">{t("allDepartments")}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name[lang]}
            </option>
          ))}
        </select>
      </div>
      <TableContainer>
        <table className="min-w-full">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t("department")}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t("requiredCompetencies")}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-2/5">
                {t("staffWithCompetency")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-brand-border">
            {competencyGapData.map((item) => {
              const compliancePercent =
                item.totalUsers > 0
                  ? (item.compliantUsers / item.totalUsers) * 100
                  : 0;
              const gap = item.totalUsers - item.compliantUsers;
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-sm">
                    {item.department}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.competency}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            gap > 0 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${compliancePercent}%` }}
                        ></div>
                      </div>
                      <span
                        className={`font-semibold text-sm w-24 text-right ${
                          gap > 0 ? "text-yellow-600" : "text-green-600"
                        }`}
                      >
                        {item.compliantUsers} / {item.totalUsers}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {competencyGapData.length === 0 && (
          <EmptyState
            icon={ChartBarIcon}
            title={t("noDataAvailable")}
            message=""
          />
        )}
      </TableContainer>
    </div>
  );
};

export default CompetencyGapReport;

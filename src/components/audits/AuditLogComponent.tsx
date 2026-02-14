import React, { useState, useMemo } from "react";
import { Project } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { SearchIcon, ClipboardDocumentListIcon } from "@/components/icons";
import { TableContainer, EmptyState } from "@/components/ui";

interface AuditLogComponentProps {
  project: Project;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: { [lang: string]: string };
}

const AuditLogComponent: React.FC<AuditLogComponentProps> = ({ project }) => {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  // Empty activity log for now - can be extended to show project-specific audit trail
  const activityLogData: ActivityLogEntry[] = [];

  const filteredLog = useMemo(() => {
    return activityLogData.filter((log: ActivityLogEntry) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.user.toLowerCase().includes(searchLower) ||
        (log.action[lang] || "").toLowerCase().includes(searchLower)
      );
    });
  }, [activityLogData, searchTerm, lang]);

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
      <div className="p-4 sm:p-6 border-b dark:border-dark-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("auditLog")}
          </h2>
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-xs">
          <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchActivity")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>
      <TableContainer>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-brand-border">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right"
              >
                {t("timestamp")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right"
              >
                {t("user")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rtl:text-right"
              >
                {t("action")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-brand-surface divide-y divide-gray-200 dark:divide-dark-brand-border">
            {filteredLog.map((log: ActivityLogEntry) => (
              <tr
                key={log.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString(
                    lang === "ar" ? "ar-OM" : "en-US",
                    { dateStyle: "medium", timeStyle: "short" },
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                  {log.user}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                    {log.action[lang]}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      {filteredLog.length === 0 && (
        <EmptyState
          icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
          title={searchTerm ? t("noResults") : t("noActivity")}
          message=""
        />
      )}
    </div>
  );
};

export default AuditLogComponent;

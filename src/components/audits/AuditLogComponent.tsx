import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Project, ActivityLogItem } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { SearchIcon, ClipboardDocumentListIcon } from "@/components/icons";
import { TableContainer, EmptyState, Button } from "@/components/ui";
import { getProjectActivityLogs } from "@/services/activityLogService";

interface AuditLogComponentProps {
  project: Project;
}

const AuditLogComponent: React.FC<AuditLogComponentProps> = ({ project }) => {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activityLogData, setActivityLogData] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestId = useRef(0);

  const fetchLogs = useCallback(async () => {
    const request = ++requestId.current;
    setIsLoading(true);
    setActivityLogData([]);
    setLoadError(false);
    try {
      const logs = await getProjectActivityLogs(project.id);
      if (request !== requestId.current) return;
      const merged = new Map(
        [...(project.activityLog || []), ...logs].map((log) => [log.id, log]),
      );
      setActivityLogData(
        [...merged.values()]
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, 100),
      );
    } catch (error) {
      if (request !== requestId.current) return;
      console.error("Failed to fetch activity logs:", error);
      setActivityLogData([]);
      setLoadError(true);
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  }, [project.id, project.activityLog]);

  useEffect(() => {
    fetchLogs();
    return () => {
      requestId.current++;
    };
  }, [fetchLogs]);

  const filteredLog = useMemo(() => {
    return activityLogData.filter((log: ActivityLogItem) => {
      const searchLower = searchTerm.toLowerCase();
      const actionText =
        typeof log.action === "string" ? log.action : log.action?.[lang] || "";
      return (
        log.user.toLowerCase().includes(searchLower) ||
        actionText.toLowerCase().includes(searchLower)
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
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("projectAuditScope")}
          </p>
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-xs">
          <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            aria-label={t("searchActivity")}
            placeholder={t("searchActivity")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-primary focus:border-brand-primary text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>
      {loadError && (
        <div
          role="alert"
          className="p-4 text-sm text-red-700 dark:text-red-300"
        >
          <p>{t("auditLogLoadFailed")}</p>
          <Button variant="secondary" onClick={fetchLogs} className="mt-3">
            {t("auditLogRetry")}
          </Button>
        </div>
      )}
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
            {isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                    {t("loading")}...
                  </div>
                </td>
              </tr>
            ) : (
              filteredLog.map((log: ActivityLogItem) => {
                const actionText =
                  typeof log.action === "string"
                    ? log.action
                    : log.action?.[lang] || "";
                return (
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
                        {actionText}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableContainer>
      {!isLoading && !loadError && filteredLog.length === 0 && (
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

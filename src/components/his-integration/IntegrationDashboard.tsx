/**
 * HIS Integration Dashboard
 * Main dashboard for managing and monitoring HIS integrations
 */

import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useHISIntegrationStore } from "@/stores/useHISIntegrationStore";
import HISConfigurationManager from "./HISConfigurationManager";
import SyncStatusWidget from "./SyncStatusWidget";
import { ServerStackIcon, ChartBarIcon, ClockIcon } from "@/components/icons";
import { TableContainer } from "@/components/ui";

type TabType = "configurations" | "status" | "logs";

interface DashboardStats {
  totalConfigurations: number;
  activeConfigurations: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: Date | null;
}

export const IntegrationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const store = useHISIntegrationStore();
  const [activeTab, setActiveTab] = useState<TabType>("configurations");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  // Calculate statistics
  const stats: DashboardStats = {
    totalConfigurations: store.configurations.length,
    activeConfigurations: store.configurations.filter((c) => c.enabled).length,
    totalSyncs: store.integrationLogs.length,
    successfulSyncs: store.integrationLogs.filter((l) => l.status === "success")
      .length,
    failedSyncs: store.integrationLogs.filter((l) => l.status === "error")
      .length,
    lastSyncTime:
      store.integrationLogs.length > 0
        ? store.integrationLogs[0].timestamp
        : null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <ServerStackIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            HIS Integration Dashboard
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            Manage connections to healthcare information systems
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Configurations */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
            Configurations
          </p>
          <p className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
            {stats.totalConfigurations}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            {stats.activeConfigurations} active
          </p>
        </div>

        {/* Total Syncs */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
            Total Syncs
          </p>
          <p className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
            {stats.totalSyncs}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            All time
          </p>
        </div>

        {/* Successful Syncs */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
            Successful
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {stats.successfulSyncs}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {stats.totalSyncs > 0
              ? `${Math.round(
                  (stats.successfulSyncs / stats.totalSyncs) * 100,
                )}% success rate`
              : "N/A"}
          </p>
        </div>

        {/* Failed Syncs */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
            Failed
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {stats.failedSyncs}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            Requires attention
          </p>
        </div>

        {/* Last Sync */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
            Last Sync
          </p>
          <p className="text-sm font-bold text-brand-text-primary dark:text-dark-brand-text-primary mt-2">
            {stats.lastSyncTime
              ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                  Math.ceil((stats.lastSyncTime.getTime() - Date.now()) / 1000),
                  "second",
                )
              : "Never"}
          </p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-2">
            {stats.lastSyncTime
              ? stats.lastSyncTime.toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-border">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("configurations")}
            className={`py-3 px-1 border-b-2 font-medium transition ${
              activeTab === "configurations"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary"
            }`}
          >
            <div className="flex items-center space-x-2">
              <ServerStackIcon className="h-5 w-5" />
              <span>Configurations</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("status")}
            className={`py-3 px-1 border-b-2 font-medium transition ${
              activeTab === "status"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary"
            }`}
          >
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5" />
              <span>Status & Health</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-1 border-b-2 font-medium transition ${
              activeTab === "logs"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-secondary hover:text-brand-text-primary dark:text-dark-brand-text-secondary dark:hover:text-dark-brand-text-primary"
            }`}
          >
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5" />
              <span>Activity Log</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "configurations" && <HISConfigurationManager />}

        {activeTab === "status" && (
          <div className="space-y-6">
            <SyncStatusWidget />
          </div>
        )}

        {activeTab === "logs" && <ActivityLog />}
      </div>
    </div>
  );
};

/**
 * Activity Log Tab Component
 */
const ActivityLog: React.FC = () => {
  const store = useHISIntegrationStore();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  const logs = store.integrationLogs.filter((log) => {
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    if (filterAction !== "all" && log.action !== filterAction) return false;
    return true;
  });

  const actions = Array.from(
    new Set(store.integrationLogs.map((l) => l.action)),
  );
  const statuses = ["success", "error", "warning", "info"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary text-sm"
        >
          <option value="all">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg dark:bg-dark-bg-tertiary dark:text-dark-brand-text-primary text-sm"
        >
          <option value="all">All Actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              No activity logs found
            </p>
          </div>
        ) : (
          <TableContainer>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
                    HIS Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition"
                  >
                    <td className="px-6 py-3 text-sm text-brand-text-primary dark:text-dark-brand-text-primary font-medium">
                      {log.hisName}
                    </td>
                    <td className="px-6 py-3 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          log.status,
                        )}`}
                      >
                        {log.status.charAt(0).toUpperCase() +
                          log.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {log.message}
                    </td>
                    <td className="px-6 py-3 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </div>

      {/* Pagination info */}
      <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
        Showing {logs.length} of {store.integrationLogs.length} logs
      </p>
    </div>
  );
};

export default IntegrationDashboard;

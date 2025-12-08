import React, { useState, useMemo } from "react";
import { useTranslation } from "../hooks/useTranslation";
import {
  ClipboardDocumentSearchIcon,
  PlusIcon,
  SearchIcon,
} from "../components/icons";
import { useAppStore } from "../stores/useAppStore";
import { useUserStore } from "../stores/useUserStore";
import { useProjectStore } from "../stores/useProjectStore";
import { AuditPlan, ActivityLogItem } from "../types";
import AuditPlanModal from "../components/audits/AuditPlanModal";

interface AuditHubPageProps {
  setNavigation: (state: any) => void;
}

type AuditHubTab = "plans" | "log";

const AuditHubPage: React.FC<AuditHubPageProps> = () => {
  const { t, lang } = useTranslation();
  const {
    auditPlans,
    addAuditPlan,
    updateAuditPlan,
    deleteAuditPlan,
    runAudit,
    activityLog,
  } = useAppStore();
  const { users } = useUserStore();
  const { projects } = useProjectStore();

  const [activeTab, setActiveTab] = useState<AuditHubTab>("plans");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AuditPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSavePlan = (plan: AuditPlan | Omit<AuditPlan, "id">) => {
    if ("id" in plan) {
      updateAuditPlan(plan);
    } else {
      addAuditPlan(plan);
    }
    setIsModalOpen(false);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm(t("areYouSureDeleteAuditPlan"))) {
      deleteAuditPlan(planId);
    }
  };

  const formatAuditsText = (itemCount: number, frequency: string) => {
    const frequencyText = frequency === 'weekly' ? t('weekly') : t('monthly');
    return `${t('auditLog')} ${itemCount} ${t('itemsToAudit')} ${frequencyText}`;
  };

  const filteredLog = useMemo(() => {
    return (activityLog || []).filter((log) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.user.toLowerCase().includes(searchLower) ||
        log.action[lang].toLowerCase().includes(searchLower) ||
        (log.details?.[lang] || "").toLowerCase().includes(searchLower)
      );
    });
  }, [activityLog, searchTerm, lang]);

  const tabButtonClasses = (tabName: AuditHubTab) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
      activeTab === tabName
        ? "border-brand-primary text-brand-primary"
        : "border-transparent text-brand-text-secondary dark:text-dark-brand-text-secondary hover:border-gray-300 dark:hover:border-gray-600"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <ClipboardDocumentSearchIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {t("auditHub")}
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              {t("auditHubDescription")}
            </p>
          </div>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={() => {
              setEditingPlan(null);
              setIsModalOpen(true);
            }}
            className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto"
          >
            <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
            {t("newAuditPlan")}
          </button>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-dark-brand-border">
        <nav
          className="-mb-px flex space-x-4 rtl:space-x-reverse"
          aria-label="Tabs"
        >
          <button
            onClick={() => {
              setActiveTab("plans");
              setSearchTerm("");
            }}
            className={tabButtonClasses("plans")}
          >
            {t("auditPlans")}
          </button>
          <button
            onClick={() => {
              setActiveTab("log");
              setSearchTerm("");
            }}
            className={tabButtonClasses("log")}
          >
            {t("auditLog")}
          </button>
        </nav>
      </div>

      {activeTab === "plans" && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
          <h2 className="text-xl font-semibold mb-4">{t("auditPlans")}</h2>
          <div className="space-y-4">
            {auditPlans.map((plan) => {
              const project = projects.find((p) => p.id === plan.projectId);
              const auditor = users.find(
                (u) => u.id === plan.assignedAuditorId
              );
              return (
                <div
                  key={plan.id}
                  className="p-4 border rounded-lg dark:border-dark-brand-border flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-gray-500">{project?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatAuditsText(plan.itemCount, plan.frequency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{t('auditor')}: {auditor?.name}</span>
                    <button
                      onClick={() => runAudit(plan.id)}
                      className="text-sm font-semibold text-brand-primary hover:underline"
                    >
                      {t("runAudit")}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsModalOpen(true);
                      }}
                      className="p-1"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              );
            })}
            {auditPlans.length === 0 && (
              <p className="text-center py-8 text-gray-500">
                {t("noAuditPlans")}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "log" && (
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
          <div className="overflow-x-auto">
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
                {filteredLog.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString(
                        lang === "ar" ? "ar-OM" : "en-US",
                        { dateStyle: "medium", timeStyle: "short" }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                      {log.user}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                        {log.action[lang]}
                      </p>
                      {log.details?.[lang] && (
                        <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                          {log.details[lang]}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLog.length === 0 && (
              <p className="text-center py-8 text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {searchTerm ? t("noProjectsFound") : t("noActivity")}
              </p>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <AuditPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePlan}
          existingPlan={editingPlan}
          projects={projects}
          users={users}
        />
      )}
    </div>
  );
};

export default AuditHubPage;

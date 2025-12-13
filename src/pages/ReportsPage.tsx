import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { useTranslation } from "@/hooks/useTranslation";
import { AppDocument } from "@/types";
import { Button } from "@/components/ui";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@/components/icons";

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { documents } = useAppStore();
  const { currentUser } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "compliance" | "incident"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  // Filter documents to show only reports
  const reports = documents.filter((doc) => doc.type === "Report");

  // Apply filters and search
  const filteredReports = reports.filter((doc) => {
    const matchesSearch = doc.name.en
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (filterType === "compliance") {
      return matchesSearch && doc.name.en.toLowerCase().includes("compliance");
    }
    if (filterType === "incident") {
      return matchesSearch && doc.name.en.toLowerCase().includes("incident");
    }
    return matchesSearch;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    }
    return a.name.en.localeCompare(b.name.en);
  });

  const handleDownload = (report: AppDocument) => {
    if (report.fileUrl) {
      const link = document.createElement("a");
      link.href = report.fileUrl;
      link.download = `${report.name.en}.pdf`;
      link.target = "_blank";
      link.click();
    }
  };

  const handlePreview = (report: AppDocument) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("reports") || "Reports"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("reportsDescription") ||
                "View and download generated compliance and incident reports"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {sortedReports.length} {t("reports") || "reports"}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchReports") || "Search reports..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">{t("allReports") || "All Reports"}</option>
              <option value="compliance">
                {t("complianceReports") || "Compliance Reports"}
              </option>
              <option value="incident">
                {t("incidentReports") || "Incident Reports"}
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
            >
              <option value="date">{t("sortByDate") || "Sort by Date"}</option>
              <option value="name">{t("sortByName") || "Sort by Name"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-auto p-6">
        {sortedReports.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("noReports") || "No reports found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? t("noReportsMatch") || "No reports match your search criteria"
                : t("generateFirstReport") ||
                  "Generate your first report from a project"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
              >
                {/* Report Icon and Type */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {report.name.en.toLowerCase().includes("compliance")
                          ? "Compliance"
                          : "Report"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {report.status || "Approved"}
                  </span>
                </div>

                {/* Report Name */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {report.name.en}
                </h3>

                {/* Metadata */}
                <div className="space-y-1 mb-4">
                  {report.createdAt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generated:{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  {report.version && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Version: {report.version}
                    </p>
                  )}
                </div>

                {/* Summary Preview */}
                {report.content?.en && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                    {report.content.en.substring(0, 150)}...
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePreview(report)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Preview
                  </Button>
                  <Button
                    onClick={() => handleDownload(report)}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

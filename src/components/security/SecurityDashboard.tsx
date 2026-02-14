import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { securityService } from "@/services/securityService";
import { useToast } from "@/hooks/useToast";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@/components/icons";

const SecurityDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { appSettings } = useAppStore();
  const { users } = useUserStore();
  const toast = useToast();
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [securityScan, setSecurityScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [compliance, scan] = await Promise.all([
        securityService.checkCompliance(),
        securityService.runSecurityScan(),
      ]);

      setComplianceResult(compliance);
      setSecurityScan(scan);
    } catch (error) {
      console.error("Failed to load security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getScanStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "fail":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading security data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor system security and compliance
          </p>
        </div>
        <button
          onClick={loadSecurityData}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compliance Status
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {complianceResult.compliant ? "Compliant" : "Non-Compliant"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Security Issues
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {complianceResult.issues.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Users
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last Scan
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compliance Status
        </h3>
        <div className="space-y-4">
          {complianceResult.issues.map((issue: any, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                issue.severity === "critical"
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : issue.severity === "high"
                    ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                    : issue.severity === "medium"
                      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    issue.severity === "critical"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : issue.severity === "high"
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        : issue.severity === "medium"
                          ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {issue.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                        issue.severity,
                      )}`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {issue.description}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Recommendation: {issue.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Scan Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Security Scan Results
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-lg font-medium ${getScanStatusColor(
                securityScan.status,
              )}`}
            >
              {securityScan.status === "pass"
                ? "Passed"
                : securityScan.status === "fail"
                  ? "Failed"
                  : "Warning"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {securityScan.vulnerabilities.length} vulnerabilities detected
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Scanned: {securityScan.scanDate.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Security Settings Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Security Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Policy
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Min Length:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.passwordPolicy?.minLength || 8} characters
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Require Uppercase:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.passwordPolicy?.requireUppercase ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Require Number:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.passwordPolicy?.requireNumber ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Require Symbol:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.passwordPolicy?.requireSymbol ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Management
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Session Timeout:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.users?.sessionTimeoutMinutes || 60} minutes
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Max Login Attempts:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.users?.maxLoginAttempts || 5}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Lockout Duration:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.users?.lockoutDurationMinutes || 15} minutes
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Inactivity Threshold:
                </span>
                <span className="ml-2 font-medium">
                  {appSettings?.users?.inactivityThresholdDays || 90} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;

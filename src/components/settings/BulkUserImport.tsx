import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import {
  exportUsersToExcel,
  importUsersFromExcel,
  getUserImportTemplate,
  createBulkOperation,
} from "@/services/bulkUserService";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";

const BulkUserImport: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { users, currentUser } = useUserStore();
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const isAdmin = currentUser?.role === "Admin";

  const handleExportUsers = async () => {
    try {
      const blob = await exportUsersToExcel(users);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Users exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export users");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = getUserImportTemplate();
      const blob = await exportUsersToExcel(templateData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user-import-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (error) {
      console.error("Template download failed:", error);
      toast.error("Failed to download template");
    }
  };

  const handleImportUsers = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!isAdmin) {
      toast.error("Only administrators can import users");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      // Create bulk operation record
      const operationId = await createBulkOperation("import", currentUser!.id);

      // Import users
      const result = await importUsersFromExcel(file);

      setImportResults({
        success: result.successCount,
        failed: result.errors.length,
        errors: result.errors,
      });

      if (result.successCount > 0) {
        toast.success(`Successfully imported ${result.successCount} users`);
      }
      if (result.errors.length > 0) {
        toast.error(`Failed to import ${result.errors.length} users`);
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import users");
    } finally {
      setImporting(false);
      event.target.value = ""; // Reset file input
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bulk User Management
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Import and export users in bulk using Excel files
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4">
            <ArrowDownTrayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Export Users
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download all users ({users.length}) to an Excel file
          </p>
          <button
            onClick={handleExportUsers}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Export to Excel
          </button>
        </div>

        {/* Download Template */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Get Template
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a sample Excel file with example data
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Download Template
          </button>
        </div>

        {/* Import Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-rose-100 dark:bg-pink-900/30 rounded-lg mb-4">
            <ArrowUpTrayIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Import Users
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload an Excel file to import users
          </p>
          <label
            className={`w-full px-4 py-2 ${
              isAdmin
                ? "bg-rose-500 hover:bg-rose-600 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
          >
            {importing ? (
              <>
                <ArrowUpTrayIcon className="w-5 h-5 animate-bounce" />
                Importing...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5" />
                Select Excel File
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportUsers}
              disabled={!isAdmin || importing}
              className="hidden"
            />
          </label>
          {!isAdmin && (
            <p className="text-xs text-red-500 mt-2">Admin access required</p>
          )}
        </div>
      </div>

      {/* Import Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Import Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>Download the template Excel file using the button above</li>
          <li>
            Fill in the user data following the example format:
            <ul className="list-disc list-inside ml-6 mt-1 text-xs text-gray-600 dark:text-gray-400">
              <li>
                <strong>Name:</strong> Full name of the user
              </li>
              <li>
                <strong>Email:</strong> Valid email address (unique)
              </li>
              <li>
                <strong>Role:</strong> Admin, ProjectLead, TeamMember, or
                Auditor
              </li>
              <li>
                <strong>Job Title:</strong> User's job title
              </li>
              <li>
                <strong>Hire Date:</strong> Date in format YYYY-MM-DD
              </li>
              <li>
                <strong>Department ID:</strong> Department identifier
              </li>
            </ul>
          </li>
          <li>Save the Excel file</li>
          <li>Click "Select Excel File" and choose your saved file</li>
          <li>Wait for the import to complete and review the results</li>
        </ol>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Import Results
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-400">
                  Successful
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                {importResults.success}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-400">
                  Failed
                </span>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                {importResults.failed}
              </p>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Error Details
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importResults.errors.map((error, index) => (
                  <div
                    key={index}
                    className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800"
                  >
                    <p className="text-sm text-red-900 dark:text-red-300">
                      <strong>Row {error.row}:</strong> {error.error}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Users Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Users Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Users
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.filter((u) => u.role === "Admin").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Project Leads
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.filter((u) => u.role === "ProjectLead").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Team Members
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.filter((u) => u.role === "TeamMember").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUserImport;

import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import {
  BoltIcon,
  UserPlusIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@/components/icons";
import { useNavigate } from "@/hooks/useNavigation";

interface QuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const { appSettings } = useAppStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = currentUser?.role === "Admin";

  const quickActions = [
    {
      id: "create-user",
      title: "Create New User",
      description: "Add a new user to the system",
      icon: UserPlusIcon,
      color: "bg-blue-500",
      adminOnly: true,
      action: () => {
        navigate({ view: "settings", section: "users" });
        onClose();
      },
    },
    {
      id: "export-data",
      title: "Export Data",
      description: "Export all system data",
      icon: DocumentDuplicateIcon,
      color: "bg-green-500",
      adminOnly: true,
      action: () => {
        navigate({ view: "settings", section: "data" });
        onClose();
      },
    },
    {
      id: "view-activity",
      title: "View Activity Log",
      description: "Check recent user activities",
      icon: ClockIcon,
      color: "bg-rose-500",
      adminOnly: false,
      action: () => {
        navigate({ view: "settings", section: "usageMonitor" });
        onClose();
      },
    },
    {
      id: "system-stats",
      title: "System Statistics",
      description: "View system performance",
      icon: ChartBarIcon,
      color: "bg-orange-500",
      adminOnly: false,
      action: () => {
        navigate({ view: "analytics" });
        onClose();
      },
    },
    {
      id: "refresh-cache",
      title: "Refresh Data",
      description: "Reload all data from server",
      icon: ArrowPathIcon,
      color: "bg-sky-500",
      adminOnly: false,
      action: () => {
        window.location.reload();
      },
    },
    {
      id: "manage-settings",
      title: "Quick Settings",
      description: "Access common settings",
      icon: Cog6ToothIcon,
      color: "bg-gray-500",
      adminOnly: false,
      action: () => {
        navigate({ view: "settings", section: "visual" });
        onClose();
      },
    },
  ];

  const filteredActions = quickActions.filter((action) => {
    if (action.adminOnly && !isAdmin) return false;
    if (searchQuery) {
      return (
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-rose-500 to-cyan-600 rounded-lg">
                <BoltIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Quick Actions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Common tasks and shortcuts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Actions Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:scale-105 active:scale-95 group"
                >
                  <div
                    className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>

            {filteredActions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No actions found
                </p>
              </div>
            )}
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Press{" "}
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white font-mono">
                Ctrl+K
              </kbd>{" "}
              to toggle this panel
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickActionsPanel;

import {
  ClockIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DeviceSession,
  deviceSessionService,
} from "@/services/deviceSessionService";
import { User } from "@/types";
import React, { useEffect, useState } from "react";

interface AdminUserSessionsModalProps {
  user: User;
  onClose: () => void;
}

const AdminUserSessionsModal: React.FC<AdminUserSessionsModalProps> = ({
  user,
  onClose,
}) => {
  const { t, lang } = useTranslation();
  const { success, error } = useToast();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingSession, setRemovingSession] = useState<string | null>(null);
  const [forcingAll, setForcingAll] = useState(false);
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const [confirmSignOutId, setConfirmSignOutId] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const userSessions = await deviceSessionService.getUserSessions(user.id);
      setSessions(userSessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      error(t("failedToLoadSessions") || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user.id]);

  const handleSignOutDevice = async (sessionId: string) => {
    try {
      setRemovingSession(sessionId);
      setConfirmSignOutId(null);
      await deviceSessionService.signOutDevice(user.id, sessionId);
      success(t("deviceSignedOut") || "Device signed out");
      await loadSessions();
    } catch (err) {
      console.error("Failed to sign out device:", err);
      error(t("failedToSignOutDevice") || "Failed to sign out device");
    } finally {
      setRemovingSession(null);
    }
  };

  const handleForceSignOutAll = async () => {
    try {
      setForcingAll(true);
      setConfirmSignOutAll(false);
      await deviceSessionService.signOutAllDevices(user.id);
      success(
        t("allSessionsTerminated") ||
          `All sessions for ${user.name} have been terminated`,
      );
      await loadSessions();
    } catch (err) {
      console.error("Failed to force sign out all:", err);
      error(t("failedToSignOutDevices") || "Failed to terminate sessions");
    } finally {
      setForcingAll(false);
    }
  };

  const getDeviceIcon = (session: DeviceSession) => {
    const isMobile = session.os === "Android" || session.os === "iOS";
    return isMobile ? DevicePhoneMobileIcon : ComputerDesktopIcon;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow") || "Just now";
    if (diffMins < 60) return `${diffMins} ${t("minutesAgo") || "min ago"}`;
    if (diffHours < 24) return `${diffHours} ${t("hoursAgo") || "hours ago"}`;
    if (diffDays < 7) return `${diffDays} ${t("daysAgo") || "days ago"}`;
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-brand-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <ShieldCheckIcon className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("manageSessions") || "Manage Sessions"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.name} &middot; {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                <ComputerDesktopIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {t("noActiveSessions") || "No active sessions"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-brand-border">
                {sessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session);
                  return (
                    <div
                      key={session.id}
                      className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">
                        <DeviceIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.deviceName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {session.location && (
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {session.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatLastActive(session.lastActive)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {t("signedInOn") || "Signed in"}:{" "}
                          {new Date(session.loginTime).toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => setConfirmSignOutId(session.id)}
                        disabled={removingSession === session.id}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        title={t("signOutDevice") || "Sign out this device"}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && sessions.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-dark-brand-border shrink-0 flex justify-between items-center gap-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {sessions.length}{" "}
                {sessions.length === 1
                  ? t("activeSession") || "active session"
                  : t("activeSessions") || "active sessions"}
              </p>
              <button
                onClick={() => setConfirmSignOutAll(true)}
                disabled={forcingAll}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {forcingAll
                  ? t("terminating") || "Terminating…"
                  : t("forceSignOutAll") || "Force Sign Out All"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm sign-out single device */}
      {confirmSignOutId && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmSignOutId(null)}
        >
          <div
            className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t("signOutDevice") || "Sign Out Device"}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t("confirmAdminSignOutDevice") ||
                "This will immediately end that device's session. The user will need to log in again on that device."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmSignOutId(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={() => handleSignOutDevice(confirmSignOutId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t("signOut") || "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm force-sign-out all */}
      {confirmSignOutAll && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmSignOutAll(false)}
        >
          <div
            className="bg-white dark:bg-dark-brand-surface rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t("forceSignOutAll") || "Force Sign Out All"}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t("confirmForceSignOutAll") ||
                `This will immediately end all ${sessions.length} active session(s) for ${user.name}. They will be logged out on every device.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmSignOutAll(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleForceSignOutAll}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t("forceSignOut") || "Force Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUserSessionsModal;

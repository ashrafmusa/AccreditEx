import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import { DeviceSession, deviceSessionService } from '@/services/deviceSessionService';
import { 
  ComputerDesktopIcon, 
  DevicePhoneMobileIcon, 
  TrashIcon,
  ClockIcon,
  MapPinIcon
} from '@/components/icons';

interface ActiveSessionsProps {
  userId: string;
}

const ActiveSessions: React.FC<ActiveSessionsProps> = ({ userId }) => {
  const { t, lang } = useTranslation();
  const { success, error } = useToast();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingSession, setRemovingSession] = useState<string | null>(null);
  const currentDeviceId = deviceSessionService.getCurrentDeviceId();

  const loadSessions = async () => {
    try {
      setLoading(true);
      const userSessions = await deviceSessionService.getUserSessions(userId);
      setSessions(userSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      error(t('failedToLoadSessions') || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const handleSignOutDevice = async (sessionId: string) => {
    if (!window.confirm(t('confirmSignOutDevice') || 'Sign out this device?')) {
      return;
    }

    try {
      setRemovingSession(sessionId);
      await deviceSessionService.signOutDevice(userId, sessionId);
      
      success(t('deviceSignedOut') || 'Device signed out successfully');
      
      // Reload sessions
      await loadSessions();
    } catch (err) {
      console.error('Failed to sign out device:', err);
      error(t('failedToSignOutDevice') || 'Failed to sign out device');
    } finally {
      setRemovingSession(null);
    }
  };

  const handleSignOutAllOther = async () => {
    if (!window.confirm(t('confirmSignOutAllOther') || 'Sign out all other devices? You will remain logged in on this device.')) {
      return;
    }

    try {
      setLoading(true);
      const count = await deviceSessionService.signOutAllOtherDevices(userId);
      
      success(
        t('signedOutDevices')?.replace('{0}', String(count)) || `Signed out ${count} device(s)`
      );
      
      await loadSessions();
    } catch (err) {
      console.error('Failed to sign out other devices:', err);
      error(t('failedToSignOutDevices') || 'Failed to sign out devices');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (session: DeviceSession) => {
    const isMobile = session.os === 'Android' || session.os === 'iOS';
    return isMobile ? DevicePhoneMobileIcon : ComputerDesktopIcon;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutesAgo') || 'min ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('hoursAgo') || 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${t('daysAgo') || 'days ago'}`;
    
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
      <div className="p-6 border-b border-gray-200 dark:border-dark-brand-border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('activeSessions') || 'Active Sessions'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('activeSessionsDescription') || 'Manage devices where you\'re currently signed in'}
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleSignOutAllOther}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              {t('signOutAllOther') || 'Sign Out All Other'}
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-dark-brand-border">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('noActiveSessions') || 'No active sessions'}
          </div>
        ) : (
          sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session);
            const isCurrentDevice = session.id === currentDeviceId;

            return (
              <div
                key={session.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  isCurrentDevice ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isCurrentDevice 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <DeviceIcon className={`w-6 h-6 ${
                      isCurrentDevice 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.deviceName}
                      </h4>
                      {isCurrentDevice && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          {t('thisDevice') || 'This device'}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {session.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          <span>{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatLastActive(session.lastActive)}</span>
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {t('signedInOn') || 'Signed in'}: {new Date(session.loginTime).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {!isCurrentDevice && (
                    <button
                      onClick={() => handleSignOutDevice(session.id)}
                      disabled={removingSession === session.id}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                      title={t('signOut') || 'Sign out'}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {sessions.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-dark-brand-border">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('sessionsNote') || 'Sessions expire after 30 days of inactivity. You can sign out devices you no longer use.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;

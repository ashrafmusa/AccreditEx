import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  ClockIcon, 
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Types for monitoring data
interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  source: 'console' | 'api' | 'network';
  url?: string;
  statusCode?: number;
}

interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type: 'page-load' | 'api-response' | 'e2e-test' | 'build';
  value: number;
  url?: string;
  testName?: string;
  buildVersion?: string;
  status: 'success' | 'warning' | 'error';
}

interface SystemHealth {
  api: 'online' | 'degraded' | 'offline';
  database: 'online' | 'degraded' | 'offline';
  storage: 'online' | 'degraded' | 'offline';
  ai: 'online' | 'degraded' | 'offline';
}

interface MonitoringStats {
  totalErrors: number;
  criticalErrors: number;
  avgPageLoadTime: number;
  avgApiResponseTime: number;
  successfulBuilds: number;
  failedBuilds: number;
  lastUpdateTime: Date;
}

export default function MonitoringDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'performance' | 'system'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Monitoring data state
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api: 'online',
    database: 'online',
    storage: 'online',
    ai: 'degraded' // Example: AI service might be having issues
  });
  const [stats, setStats] = useState<MonitoringStats>({
    totalErrors: 0,
    criticalErrors: 0,
    avgPageLoadTime: 0,
    avgApiResponseTime: 0,
    successfulBuilds: 0,
    failedBuilds: 0,
    lastUpdateTime: new Date()
  });

  // Error monitoring setup
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorLog: ErrorLog = {
        id: `error-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        level: 'error',
        message: event.message,
        stack: event.error?.stack,
        source: 'console',
        url: event.filename
      };
      
      setErrors(prev => [errorLog, ...prev.slice(0, 99)]); // Keep last 100 errors
      updateStats();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorLog: ErrorLog = {
        id: `rejection-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        source: 'console'
      };
      
      setErrors(prev => [errorLog, ...prev.slice(0, 99)]);
      updateStats();
    };

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorLog: ErrorLog = {
        id: `console-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        level: 'error',
        message: args.join(' '),
        source: 'console'
      };
      
      setErrors(prev => [errorLog, ...prev.slice(0, 99)]);
      updateStats();
      originalConsoleError(...args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  // Network monitoring
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Log API performance
        const metric: PerformanceMetric = {
          id: `api-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: 'api-response',
          value: responseTime,
          url,
          status: response.ok ? 'success' : 'error'
        };

        setMetrics(prev => [metric, ...prev.slice(0, 99)]);

        // Log API errors
        if (!response.ok) {
          const errorLog: ErrorLog = {
            id: `api-error-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level: 'error',
            message: `API Error: ${response.status} ${response.statusText}`,
            source: 'api',
            url,
            statusCode: response.status
          };
          
          setErrors(prev => [errorLog, ...prev.slice(0, 99)]);
        }

        updateStats();
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Log network failure
        const errorLog: ErrorLog = {
          id: `network-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          level: 'error',
          message: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source: 'network',
          url
        };
        
        setErrors(prev => [errorLog, ...prev.slice(0, 99)]);

        const metric: PerformanceMetric = {
          id: `api-failed-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: 'api-response',
          value: responseTime,
          url,
          status: 'error'
        };

        setMetrics(prev => [metric, ...prev.slice(0, 99)]);
        updateStats();
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Page load monitoring
  useEffect(() => {
    // Monitor page load performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          
          const metric: PerformanceMetric = {
            id: `page-load-${Date.now()}`,
            timestamp: new Date(),
            type: 'page-load',
            value: navigationEntry.loadEventEnd - navigationEntry.navigationStart,
            url: window.location.href,
            status: navigationEntry.loadEventEnd < 2000 ? 'success' : navigationEntry.loadEventEnd < 4000 ? 'warning' : 'error'
          };

          setMetrics(prev => [metric, ...prev.slice(0, 99)]);
          updateStats();
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updateStats();
      checkSystemHealth();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const updateStats = () => {
    setStats(prev => {
      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      const recentErrors = errors.filter(e => e.timestamp.getTime() > last24Hours);
      const recentMetrics = metrics.filter(m => m.timestamp.getTime() > last24Hours);
      
      const apiMetrics = recentMetrics.filter(m => m.type === 'api-response');
      const pageLoadMetrics = recentMetrics.filter(m => m.type === 'page-load');
      
      return {
        ...prev,
        totalErrors: recentErrors.length,
        criticalErrors: recentErrors.filter(e => e.level === 'error').length,
        avgApiResponseTime: apiMetrics.length > 0 ? 
          apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length : 0,
        avgPageLoadTime: pageLoadMetrics.length > 0 ? 
          pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length : 0,
        lastUpdateTime: new Date()
      };
    });
  };

  const checkSystemHealth = async () => {
    // Simulate system health checks
    // In a real implementation, these would be actual API calls to health endpoints
    setSystemHealth({
      api: Math.random() > 0.1 ? 'online' : 'degraded',
      database: Math.random() > 0.05 ? 'online' : 'degraded', 
      storage: Math.random() > 0.02 ? 'online' : 'degraded',
      ai: Math.random() > 0.3 ? 'online' : 'degraded' // AI service more likely to have issues
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkSystemHealth();
    updateStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'offline':
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'offline':
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t('monitoringDashboard') || 'Development Monitoring'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('lastUpdated') || 'Last updated'}: {formatTimestamp(stats.lastUpdateTime)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('autoRefresh') || 'Auto-refresh'}
                </span>
              </label>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{t('refresh') || 'Refresh'}</span>
              </button>
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{t('refresh') || 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="px-6 flex space-x-8">
            {(['overview', 'errors', 'performance', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t(tab) || tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('criticalErrors') || 'Critical Errors'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.criticalErrors}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('avgPageLoad') || 'Avg Page Load'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatTime(stats.avgPageLoadTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('avgApiResponse') || 'Avg API Response'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatTime(stats.avgApiResponseTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-rose-100 dark:bg-pink-900/20 rounded-lg">
                    <ServerIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('totalErrors24h') || 'Total Errors (24h)'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalErrors}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('systemHealth') || 'System Health'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(systemHealth).map(([service, status]) => (
                  <div
                    key={service}
                    className={`flex items-center justify-between p-4 rounded-lg ${getStatusColor(status)}`}
                  >
                    <div className="flex items-center">
                      {getStatusIcon(status)}
                      <span className="ml-3 font-medium capitalize">
                        {t(service) || service}
                      </span>
                    </div>
                    <span className="text-sm font-semibold capitalize">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Errors */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('recentErrors') || 'Recent Errors'}
                </h3>
                <button
                  onClick={() => setActiveTab('errors')}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-500 text-sm font-medium"
                >
                  {t('viewAll') || 'View All'}
                </button>
              </div>
              <div className="space-y-3">
                {errors.slice(0, 5).map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    {getStatusIcon('error')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {error.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(error.timestamp)} • {error.source}
                        {error.url && ` • ${error.url}`}
                      </p>
                    </div>
                  </div>
                ))}
                {errors.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t('noRecentErrors') || 'No recent errors'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('errorLogs') || 'Error Logs'}
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(error.level)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {error.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTimestamp(error.timestamp)} • {error.source}
                            {error.url && ` • ${error.url}`}
                            {error.statusCode && ` • ${error.statusCode}`}
                          </p>
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                                {t('stackTrace') || 'Stack trace'}
                              </summary>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                                {error.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {errors.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {t('noErrors') || 'No errors recorded'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('performanceMetrics') || 'Performance Metrics'}
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(metric.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {metric.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(metric.timestamp)}
                          {metric.url && ` • ${metric.url}`}
                          {metric.testName && ` • ${metric.testName}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatTime(metric.value)}
                      </p>
                    </div>
                  </div>
                ))}
                {metrics.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {t('noMetrics') || 'No performance metrics recorded'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('systemHealthDetail') || 'System Health Details'}
              </h3>
              <div className="space-y-4">
                {Object.entries(systemHealth).map(([service, status]) => (
                  <div
                    key={service}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(status)}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {t(service) || service} Service
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t(`${service}Description`) || `${service.charAt(0).toUpperCase() + service.slice(1)} service monitoring`}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
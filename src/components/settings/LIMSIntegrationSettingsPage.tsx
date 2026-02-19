/**
 * LIMS Integration Settings Page
 * Admin-only settings panel for managing LIMS connections, running syncs,
 * and viewing sync history/logs
 */

import React, { useState, useMemo } from "react";
import {
  LIMSType,
  LIMS_TYPE_LABELS,
  LIMSConfig,
  LIMSSyncResult,
  LIMSIntegrationLog,
  AuthType,
  SyncStatus,
} from "@/services/limsIntegration";
import { limsDataSyncService } from "@/services/limsIntegration";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayCircleIcon,
} from "@/components/icons";

// ── Types ────────────────────────────────────────────────

type SettingsView = "list" | "add" | "detail";

// ── Component ────────────────────────────────────────────

const LIMSIntegrationSettingsPage: React.FC = () => {
  const [view, setView] = useState<SettingsView>("list");
  const [configs, setConfigs] = useState<LIMSConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<LIMSConfig | null>(null);
  const [syncResults, setSyncResults] = useState<LIMSSyncResult[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<LIMSConfig>>({
    type: LIMSType.GENERIC_REST,
    authType: AuthType.API_KEY,
    enabled: true,
    syncInterval: 60,
    qcSyncEnabled: true,
    specimenSyncEnabled: true,
    orderSyncEnabled: true,
  });

  const logs = useMemo(
    () => limsDataSyncService.getLogs(50),
    [syncResults], // re-derive after syncs
  );

  // ── Handlers ─────────────────────────────────────────

  const handleAddConfig = () => {
    if (!form.name || !form.baseUrl) return;
    const config: LIMSConfig = {
      id: `lims-${Date.now()}`,
      name: form.name,
      type: form.type as LIMSType,
      baseUrl: form.baseUrl,
      authType: form.authType as AuthType,
      apiKey: form.apiKey,
      clientId: form.clientId,
      clientSecret: form.clientSecret,
      username: form.username,
      password: form.password,
      enabled: form.enabled ?? true,
      syncInterval: form.syncInterval ?? 60,
      qcSyncEnabled: form.qcSyncEnabled ?? true,
      specimenSyncEnabled: form.specimenSyncEnabled ?? true,
      orderSyncEnabled: form.orderSyncEnabled ?? true,
      description: form.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConfigs((prev) => [...prev, config]);
    setForm({
      type: LIMSType.GENERIC_REST,
      authType: AuthType.API_KEY,
      enabled: true,
      syncInterval: 60,
      qcSyncEnabled: true,
      specimenSyncEnabled: true,
      orderSyncEnabled: true,
    });
    setView("list");
  };

  const handleTestConnection = async (config: LIMSConfig) => {
    setTesting(config.id);
    setTestResult(null);
    try {
      const result = await limsDataSyncService.testConnection(config);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: String(err),
      });
    } finally {
      setTesting(null);
    }
  };

  const handleSync = async (config: LIMSConfig) => {
    setSyncing(config.id);
    try {
      const result = await limsDataSyncService.syncAll(config);
      setSyncResults((prev) => [...prev, result]);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    if (selectedConfig?.id === id) {
      setSelectedConfig(null);
      setView("list");
    }
  };

  // ── Renders ──────────────────────────────────────────

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            LIMS Connections
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Connect to external Laboratory Information Management Systems to
            import results, specimens, orders, and QC data for accreditation
            evidence.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setView("add")}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card className="p-8 text-center">
          <BeakerIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No LIMS connections configured
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add a connection to start importing lab data
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((cfg) => (
            <Card key={cfg.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BeakerIcon className="h-6 w-6 text-brand-primary" />
                  <div>
                    <h3 className="font-semibold dark:text-dark-brand-text-primary">
                      {cfg.name}
                    </h3>
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                      {LIMS_TYPE_LABELS[cfg.type]} &middot; {cfg.baseUrl}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}
                  >
                    {cfg.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection(cfg)}
                    disabled={testing === cfg.id}
                  >
                    {testing === cfg.id ? "Testing…" : "Test"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(cfg)}
                    disabled={syncing === cfg.id}
                    className="flex items-center gap-1"
                  >
                    <PlayCircleIcon className="h-4 w-4" />
                    {syncing === cfg.id ? "Syncing…" : "Sync Now"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedConfig(cfg);
                      setView("detail");
                    }}
                  >
                    Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleDelete(cfg.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {/* Last sync info */}
              {syncResults.filter((r) => r.limsId === cfg.id).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary flex gap-4">
                  {(() => {
                    const last = syncResults
                      .filter((r) => r.limsId === cfg.id)
                      .pop()!;
                    return (
                      <>
                        <span className="flex items-center gap-1">
                          {last.status === SyncStatus.SUCCESS ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircleIcon className="h-3 w-3 text-red-500" />
                          )}
                          {last.status === SyncStatus.SUCCESS
                            ? "Success"
                            : "Errors"}
                        </span>
                        <span>
                          {last.resultsImported} results &middot;{" "}
                          {last.specimensImported} specimens &middot;{" "}
                          {last.ordersImported} orders &middot;{" "}
                          {last.qcDataImported} QC
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {(
                            (last.endTime.getTime() -
                              last.startTime.getTime()) /
                            1000
                          ).toFixed(1)}
                          s
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Test result banner */}
      {testResult && (
        <Card
          className={`p-3 ${testResult.success ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${testResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
            >
              {testResult.message}
            </span>
          </div>
        </Card>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold dark:text-dark-brand-text-primary mb-2">
            Recent Activity
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs
              .slice()
              .reverse()
              .slice(0, 20)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 text-xs py-1.5 px-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-500" : log.status === "error" ? "bg-red-500" : log.status === "warning" ? "bg-yellow-500" : "bg-blue-500"}`}
                  />
                  <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    {log.limsName}
                  </span>
                  <span className="dark:text-dark-brand-text-primary flex-1">
                    {log.message}
                  </span>
                  <span className="text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAddForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setView("list")}>
          ← Back
        </Button>
        <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
          Add LIMS Connection
        </h2>
      </div>

      <Card className="p-6 space-y-4">
        {/* Name & Description */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
              Connection Name *
            </label>
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Main Lab SoftLab"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
              Description
            </label>
            <input
              type="text"
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional description"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* LIMS Type & Base URL */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
              LIMS Type *
            </label>
            <select
              value={form.type || LIMSType.GENERIC_REST}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as LIMSType })
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              {Object.entries(LIMS_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
              Base URL *
            </label>
            <input
              type="url"
              value={form.baseUrl || ""}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://lims.yourhospital.org"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Auth */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
              Auth Type
            </label>
            <select
              value={form.authType || AuthType.API_KEY}
              onChange={(e) =>
                setForm({ ...form, authType: e.target.value as AuthType })
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="api_key">API Key</option>
              <option value="bearer_token">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="oauth2">OAuth 2.0</option>
              <option value="custom">Custom Headers</option>
            </select>
          </div>
          {(form.authType === "api_key" ||
            form.authType === "bearer_token") && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
                API Key / Token
              </label>
              <input
                type="password"
                value={form.apiKey || ""}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="Enter API key or token"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          )}
          {form.authType === "basic" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username || ""}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </>
          )}
          {form.authType === "oauth2" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
                  Client ID
                </label>
                <input
                  type="text"
                  value={form.clientId || ""}
                  onChange={(e) =>
                    setForm({ ...form, clientId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={form.clientSecret || ""}
                  onChange={(e) =>
                    setForm({ ...form, clientSecret: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </>
          )}
        </div>

        {/* Sync options */}
        <div>
          <h3 className="font-medium dark:text-dark-brand-text-primary mb-2">
            Sync Options
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-dark-brand-text-primary">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                min={5}
                value={form.syncInterval ?? 60}
                onChange={(e) =>
                  setForm({ ...form, syncInterval: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-2 pt-5">
              {(
                [
                  ["qcSyncEnabled", "QC Data"],
                  ["specimenSyncEnabled", "Specimens"],
                  ["orderSyncEnabled", "Orders"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(form[field] as boolean) ?? true}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="dark:text-dark-brand-text-primary">
                    Import {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setView("list")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddConfig}
            disabled={!form.name || !form.baseUrl}
          >
            Add Connection
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderDetail = () => {
    if (!selectedConfig) return null;
    const configSyncs = syncResults.filter(
      (r) => r.limsId === selectedConfig.id,
    );
    const configLogs = logs.filter((l) => l.limsId === selectedConfig.id);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            ← Back
          </Button>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            {selectedConfig.name}
          </h2>
          <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {LIMS_TYPE_LABELS[selectedConfig.type]}
          </span>
        </div>

        {/* Config summary */}
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Base URL
              </span>
              <p className="font-medium dark:text-dark-brand-text-primary">
                {selectedConfig.baseUrl}
              </p>
            </div>
            <div>
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Auth
              </span>
              <p className="font-medium dark:text-dark-brand-text-primary">
                {selectedConfig.authType}
              </p>
            </div>
            <div>
              <span className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Sync Interval
              </span>
              <p className="font-medium dark:text-dark-brand-text-primary">
                Every {selectedConfig.syncInterval ?? 60} min
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTestConnection(selectedConfig)}
              disabled={testing === selectedConfig.id}
            >
              {testing === selectedConfig.id ? "Testing…" : "Test Connection"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSync(selectedConfig)}
              disabled={syncing === selectedConfig.id}
              className="flex items-center gap-1"
            >
              <PlayCircleIcon className="h-4 w-4" />
              {syncing === selectedConfig.id ? "Syncing…" : "Sync Now"}
            </Button>
          </div>
        </Card>

        {/* Sync history */}
        {configSyncs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold dark:text-dark-brand-text-primary mb-2">
              Sync History
            </h3>
            <div className="space-y-2">
              {configSyncs
                .slice()
                .reverse()
                .map((s, i) => (
                  <Card key={i} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {s.status === SyncStatus.SUCCESS ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className="dark:text-dark-brand-text-primary">
                          {s.resultsImported} results, {s.specimensImported}{" "}
                          specimens, {s.ordersImported} orders,{" "}
                          {s.qcDataImported} QC
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(s.startTime).toLocaleString()} &middot;{" "}
                        {(
                          (s.endTime.getTime() - s.startTime.getTime()) /
                          1000
                        ).toFixed(1)}
                        s
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Logs */}
        {configLogs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold dark:text-dark-brand-text-primary mb-2">
              Logs
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {configLogs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-2 text-xs py-1.5 px-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${log.status === "success" ? "bg-green-500" : log.status === "error" ? "bg-red-500" : log.status === "warning" ? "bg-yellow-500" : "bg-blue-500"}`}
                    />
                    <span className="dark:text-dark-brand-text-primary flex-1">
                      {log.message}
                    </span>
                    <span className="text-gray-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BeakerIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-2xl font-bold dark:text-dark-brand-text-primary">
            LIMS Integration
          </h1>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Connect to lab information systems to import results, specimens,
            orders, and QC data
          </p>
        </div>
      </div>

      {view === "list" && renderList()}
      {view === "add" && renderAddForm()}
      {view === "detail" && renderDetail()}
    </div>
  );
};

export default LIMSIntegrationSettingsPage;

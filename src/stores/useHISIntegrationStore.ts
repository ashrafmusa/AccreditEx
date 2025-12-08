/**
 * HIS Integration Store
 * Zustand store for managing HIS configurations and integration logs
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HISConfig,
  HISType,
  AuthType,
  IntegrationLog,
  SyncStatus,
} from '@/services/hisIntegration/types';

interface HISIntegrationState {
  // Configuration Management
  configurations: HISConfig[];
  selectedConfigId: string | null;

  // Logs
  integrationLogs: IntegrationLog[];
  maxLogsPerHIS: number;

  // Active Syncs
  activeSyncs: Map<string, boolean>;

  // Configuration Methods
  addConfiguration(config: Omit<HISConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateConfiguration(id: string, updates: Partial<HISConfig>): Promise<void>;
  deleteConfiguration(id: string): Promise<void>;
  getConfiguration(id: string): HISConfig | undefined;
  getAllConfigurations(): HISConfig[];
  getEnabledConfigurations(): HISConfig[];
  selectConfiguration(id: string | null): void;
  getSelectedConfiguration(): HISConfig | null;

  // Sync Management
  setConfigurationSync(id: string, lastSyncAt: Date, recordsSynced: number): Promise<void>;
  isSyncing(id: string): boolean;
  startSync(id: string): void;
  stopSync(id: string): void;

  // Logging Methods
  addLog(log: Omit<IntegrationLog, 'id' | 'timestamp'>): void;
  getLogs(hisId?: string, limit?: number): IntegrationLog[];
  getLogsByStatus(status: string, hisId?: string): IntegrationLog[];
  getLogsByAction(action: string, hisId?: string): IntegrationLog[];
  clearLogs(hisId?: string): void;
  getLastLog(hisId: string): IntegrationLog | undefined;
  getLogStats(hisId?: string): {
    total: number;
    success: number;
    error: number;
    warning: number;
  };

  // Statistics
  getConfigurationStats(): {
    totalConfigurations: number;
    enabledConfigurations: number;
    activeSyncs: number;
  };
}

const generateId = (): string => `his_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useHISIntegrationStore = create<HISIntegrationState>()(
  persist(
    (set, get) => ({
      configurations: [],
      selectedConfigId: null,
      integrationLogs: [],
      maxLogsPerHIS: 1000,
      activeSyncs: new Map(),

      // Configuration Management
      addConfiguration: async (config) => {
        const id = generateId();
        const now = new Date();

        const newConfig: HISConfig = {
          ...config,
          id,
          createdAt: now,
          updatedAt: now,
          authType: config.authType || AuthType.API_KEY,
          enabled: config.enabled ?? true,
          timeout: config.timeout || 30000,
          retryCount: config.retryCount || 3,
          retryDelay: config.retryDelay || 1000,
        };

        set((state) => ({
          configurations: [...state.configurations, newConfig],
        }));

        return id;
      },

      updateConfiguration: async (id, updates) => {
        set((state) => ({
          configurations: state.configurations.map((config) =>
            config.id === id
              ? {
                  ...config,
                  ...updates,
                  id: config.id, // Prevent ID change
                  createdAt: config.createdAt, // Prevent creation date change
                  updatedAt: new Date(),
                }
              : config
          ),
        }));
      },

      deleteConfiguration: async (id) => {
        set((state) => ({
          configurations: state.configurations.filter((config) => config.id !== id),
          selectedConfigId: state.selectedConfigId === id ? null : state.selectedConfigId,
          integrationLogs: state.integrationLogs.filter((log) => log.hisId !== id),
        }));
      },

      getConfiguration: (id) => {
        return get().configurations.find((config) => config.id === id);
      },

      getAllConfigurations: () => {
        return get().configurations;
      },

      getEnabledConfigurations: () => {
        return get().configurations.filter((config) => config.enabled);
      },

      selectConfiguration: (id) => {
        set({ selectedConfigId: id });
      },

      getSelectedConfiguration: () => {
        const { selectedConfigId, configurations } = get();
        if (!selectedConfigId) return null;
        return configurations.find((config) => config.id === selectedConfigId) || null;
      },

      // Sync Management
      setConfigurationSync: async (id, lastSyncAt, recordsSynced) => {
        set((state) => ({
          configurations: state.configurations.map((config) =>
            config.id === id
              ? {
                  ...config,
                  lastSyncAt,
                  updatedAt: new Date(),
                }
              : config
          ),
        }));
      },

      isSyncing: (id) => {
        return get().activeSyncs.get(id) || false;
      },

      startSync: (id) => {
        set((state) => {
          const newSyncs = new Map(state.activeSyncs);
          newSyncs.set(id, true);
          return { activeSyncs: newSyncs };
        });
      },

      stopSync: (id) => {
        set((state) => {
          const newSyncs = new Map(state.activeSyncs);
          newSyncs.delete(id);
          return { activeSyncs: newSyncs };
        });
      },

      // Logging Methods
      addLog: (log) => {
        const id = generateId();
        const newLog: IntegrationLog = {
          ...log,
          id,
          timestamp: new Date(),
        };

        set((state) => {
          const updatedLogs = [newLog, ...state.integrationLogs];
          const hisLogs = updatedLogs.filter((l) => l.hisId === log.hisId);

          // Keep only maxLogsPerHIS for each HIS configuration
          if (hisLogs.length > state.maxLogsPerHIS) {
            const otherLogs = updatedLogs.filter((l) => l.hisId !== log.hisId);
            return {
              integrationLogs: [...otherLogs, ...hisLogs.slice(0, state.maxLogsPerHIS)],
            };
          }

          return { integrationLogs: updatedLogs };
        });
      },

      getLogs: (hisId, limit = 100) => {
        let logs = get().integrationLogs;
        if (hisId) {
          logs = logs.filter((log) => log.hisId === hisId);
        }
        return logs.slice(0, limit);
      },

      getLogsByStatus: (status, hisId) => {
        let logs = get().integrationLogs.filter((log) => log.status === status);
        if (hisId) {
          logs = logs.filter((log) => log.hisId === hisId);
        }
        return logs;
      },

      getLogsByAction: (action, hisId) => {
        let logs = get().integrationLogs.filter((log) => log.action === action);
        if (hisId) {
          logs = logs.filter((log) => log.hisId === hisId);
        }
        return logs;
      },

      clearLogs: (hisId) => {
        set((state) => ({
          integrationLogs: hisId
            ? state.integrationLogs.filter((log) => log.hisId !== hisId)
            : [],
        }));
      },

      getLastLog: (hisId) => {
        return get().integrationLogs.find((log) => log.hisId === hisId);
      },

      getLogStats: (hisId) => {
        const logs = hisId ? get().integrationLogs.filter((log) => log.hisId === hisId) : get().integrationLogs;

        return {
          total: logs.length,
          success: logs.filter((log) => log.status === 'success').length,
          error: logs.filter((log) => log.status === 'error').length,
          warning: logs.filter((log) => log.status === 'warning').length,
        };
      },

      // Statistics
      getConfigurationStats: () => {
        const configs = get().configurations;
        const syncs = get().activeSyncs;

        return {
          totalConfigurations: configs.length,
          enabledConfigurations: configs.filter((c) => c.enabled).length,
          activeSyncs: syncs.size,
        };
      },
    }),
    {
      name: 'his-integration-store',
      version: 1,
    }
  )
);

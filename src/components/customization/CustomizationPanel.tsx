/**
 * CustomizationPanel Component - AccreditEx
 *
 * Comprehensive UI for managing user customizations with real-time preview,
 * presets, and safe validation.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import React, { useState } from "react";
import { useCustomization } from "@/hooks/useCustomization";
import { useUserStore } from "@/stores/useUserStore";
import { CUSTOMIZATION_PRESETS } from "@/types/customization";
import {
  Settings,
  Palette,
  Layout,
  Zap,
  Eye,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
} from "lucide-react";

export const CustomizationPanel: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    customization,
    presets,
    isLoading,
    error,
    updateTheme,
    updateLayout,
    updateFeatures,
    updateAccessibility,
    resetCustomization,
    applyPreset,
    exportCustomization,
    importCustomization,
    isDarkMode,
    toggleDarkMode,
  } = useCustomization(currentUser?.id);

  const [activeTab, setActiveTab] = useState<
    "theme" | "layout" | "features" | "accessibility"
  >("theme");
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading || !customization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importCustomization(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Customization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personalize AccreditEx to match your preferences
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCustomization}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={resetCustomization}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Presets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Presets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CUSTOMIZATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                customization.preset === preset.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{preset.name}</h3>
                {customization.preset === preset.id && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {[
              { id: "theme", label: "Theme", icon: Palette },
              { id: "layout", label: "Layout", icon: Layout },
              { id: "features", label: "Features", icon: Zap },
              { id: "accessibility", label: "Accessibility", icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Theme Tab */}
          {activeTab === "theme" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {["light", "dark", "auto"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateTheme({ mode: mode as any })}
                      className={`p-4 rounded-lg border-2 capitalize ${
                        customization.theme.mode === mode
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={customization.theme.primaryColor}
                  onChange={(e) =>
                    updateTheme({ primaryColor: e.target.value })
                  }
                  className="w-full h-12 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={customization.theme.accentColor}
                  onChange={(e) => updateTheme({ accentColor: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Size
                </label>
                <select
                  value={customization.theme.fontSize}
                  onChange={(e) =>
                    updateTheme({ fontSize: e.target.value as any })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="x-large">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Border Radius
                </label>
                <select
                  value={customization.theme.borderRadius}
                  onChange={(e) =>
                    updateTheme({ borderRadius: e.target.value as any })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Density
                </label>
                <select
                  value={customization.theme.density}
                  onChange={(e) =>
                    updateTheme({ density: e.target.value as any })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === "layout" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sidebar Position
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {["left", "right"].map((pos) => (
                    <button
                      key={pos}
                      onClick={() =>
                        updateLayout({ sidebarPosition: pos as any })
                      }
                      className={`p-4 rounded-lg border-2 capitalize ${
                        customization.layout.sidebarPosition === pos
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Dashboard Layout
                </label>
                <select
                  value={customization.layout.dashboardLayout}
                  onChange={(e) =>
                    updateLayout({ dashboardLayout: e.target.value as any })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="kanban">Kanban</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Card Style
                </label>
                <select
                  value={customization.layout.cardStyle}
                  onChange={(e) =>
                    updateLayout({ cardStyle: e.target.value as any })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="elevated">Elevated</option>
                  <option value="outlined">Outlined</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Enable Notifications
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Receive browser notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.features.enableNotifications}
                  onChange={(e) =>
                    updateFeatures({ enableNotifications: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Notification Sounds
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Play sound with notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.features.enableSounds}
                  onChange={(e) =>
                    updateFeatures({ enableSounds: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Enable Auto-Save
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Automatically save changes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.features.enableAutoSave}
                  onChange={(e) =>
                    updateFeatures({ enableAutoSave: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Auto-Save Interval (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customization.features.autoSaveInterval}
                  onChange={(e) =>
                    updateFeatures({
                      autoSaveInterval: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Enable Animations
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use smooth transitions and effects
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.features.enableAnimations}
                  onChange={(e) =>
                    updateFeatures({ enableAnimations: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === "accessibility" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    High Contrast Mode
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Increase contrast for better visibility
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.accessibility.highContrast}
                  onChange={(e) =>
                    updateAccessibility({ highContrast: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Reduced Motion</label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Minimize animations and transitions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.accessibility.reducedMotion}
                  onChange={(e) =>
                    updateAccessibility({ reducedMotion: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Screen Reader Optimized
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Optimize for screen readers
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.accessibility.screenReaderOptimized}
                  onChange={(e) =>
                    updateAccessibility({
                      screenReaderOptimized: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Keyboard Shortcuts
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Enable keyboard shortcuts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customization.accessibility.keyboardShortcuts}
                  onChange={(e) =>
                    updateAccessibility({
                      keyboardShortcuts: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Focus Indicators
                </label>
                <select
                  value={customization.accessibility.focusIndicators}
                  onChange={(e) =>
                    updateAccessibility({
                      focusIndicators: e.target.value as
                        | "standard"
                        | "enhanced",
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="standard">Standard</option>
                  <option value="enhanced">Enhanced</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

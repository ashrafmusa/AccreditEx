import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import {
  getPresets,
  getUserPresets,
  getPublicPresets,
  applyPreset,
  createPreset,
  BUILT_IN_PRESETS,
} from "@/services/settingsPresetsService";
import type { SettingsPreset } from "@/types";
import {
  SparklesIcon,
  MoonIcon,
  SunIcon,
  ShieldCheckIcon,
  BoltIcon,
  CheckCircleIcon,
  StarIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";

const PRESET_ICONS: Record<string, React.FC<{ className?: string }>> = {
  "🌙": MoonIcon,
  "🎯": SparklesIcon,
  "🔒": ShieldCheckIcon,
  "⚡": BoltIcon,
  "⭐": StarIcon,
};

const SettingsPresetsPanel: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser } = useUserStore();
  const { appSettings, setAppSettings } = useAppStore();
  const [presets, setPresets] = useState<SettingsPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPreset, setNewPreset] = useState({
    name: "",
    description: "",
    category: "visual" as SettingsPreset["category"],
    isPublic: false,
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const publicPresets = await getPublicPresets();
      const userPresets = currentUser
        ? await getUserPresets(currentUser.id)
        : [];
      setPresets([...BUILT_IN_PRESETS, ...publicPresets, ...userPresets]);
    } catch (error) {
      // Firestore indexes may not exist yet — gracefully fall back to built-in presets
      console.warn("Could not load Firestore presets, using built-in only:", error);
      setPresets([...BUILT_IN_PRESETS]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    if (!currentUser) return;

    try {
      await applyPreset(currentUser.id, presetId, appSettings, setAppSettings);
      toast.success("Preset applied successfully");
    } catch (error) {
      console.error("Failed to apply preset:", error);
      toast.error("Failed to apply preset");
    }
  };

  const handleCreatePreset = async () => {
    if (!currentUser) return;
    if (!newPreset.name.trim() || !newPreset.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createPreset(
        newPreset.name,
        newPreset.description,
        newPreset.category,
        appSettings,
        currentUser.id,
        newPreset.isPublic,
      );
      toast.success("Preset created successfully");
      setShowCreateModal(false);
      setNewPreset({
        name: "",
        description: "",
        category: "visual",
        isPublic: false,
      });
      loadPresets();
    } catch (error) {
      console.error("Failed to create preset:", error);
      toast.error("Failed to create preset");
    }
  };

  const filteredPresets = presets.filter((preset) => {
    if (selectedCategory === "all") return true;
    return preset.category === selectedCategory;
  });

  const categories = [
    { id: "all", name: "All Presets", icon: SparklesIcon },
    { id: "visual", name: "Visual", icon: SunIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "performance", name: "Performance", icon: BoltIcon },
    { id: "accessibility", name: "Accessibility", icon: CheckCircleIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings Presets
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Quick apply pre-configured settings templates
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <SparklesIcon className="w-4 h-4" />
          Create Preset
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-rose-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <category.icon className="w-4 h-4" />
            {category.name}
          </button>
        ))}
      </div>

      {/* Presets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <SparklesIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading presets...</p>
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500">No presets found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const IconComponent = PRESET_ICONS[preset.icon || "⭐"] || StarIcon;

            return (
              <div
                key={preset.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      preset.category === "visual"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : preset.category === "security"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : preset.category === "performance"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-rose-100 dark:bg-pink-900/30"
                    }`}
                  >
                    <IconComponent
                      className={`w-6 h-6 ${
                        preset.category === "visual"
                          ? "text-blue-600 dark:text-blue-400"
                          : preset.category === "security"
                            ? "text-red-600 dark:text-red-400"
                            : preset.category === "performance"
                              ? "text-green-600 dark:text-green-400"
                              : "text-rose-600 dark:text-rose-400"
                      }`}
                    />
                  </div>
                  {preset.isPublic && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs font-medium">
                      Public
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {preset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {preset.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="capitalize">{preset.category}</span>
                  {preset.usageCount !== undefined && (
                    <span>{preset.usageCount} uses</span>
                  )}
                </div>

                <button
                  onClick={() => handleApplyPreset(preset.id!)}
                  className="w-full px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors group-hover:shadow-md"
                >
                  Apply Preset
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Built-in Presets Highlight */}
      <div className="bg-gradient-to-r from-rose-100 to-cyan-100 dark:from-pink-900/30 dark:to-cyan-900/30 rounded-lg p-6 border border-rose-200 dark:border-pink-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          Built-in Presets
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Try our pre-configured templates designed for specific use cases:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BUILT_IN_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center"
            >
              <div className="text-2xl mb-2">{preset.icon}</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {preset.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Preset Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Custom Preset
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preset Name *
                </label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) =>
                    setNewPreset({ ...newPreset, name: e.target.value })
                  }
                  placeholder="e.g., My Custom Theme"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newPreset.description}
                  onChange={(e) =>
                    setNewPreset({ ...newPreset, description: e.target.value })
                  }
                  placeholder="Describe this preset..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={newPreset.category}
                  onChange={(e) =>
                    setNewPreset({
                      ...newPreset,
                      category: e.target.value as SettingsPreset["category"],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="visual">{t("categoryVisual")}</option>
                  <option value="security">{t("categorySecurity")}</option>
                  <option value="performance">
                    {t("categoryPerformance")}
                  </option>
                  <option value="accessibility">
                    {t("categoryAccessibility")}
                  </option>
                  <option value="custom">{t("categoryCustom")}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newPreset.isPublic}
                  onChange={(e) =>
                    setNewPreset({ ...newPreset, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-rose-600 focus:ring-2 focus:ring-rose-500 rounded"
                />
                <label
                  htmlFor="isPublic"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Make this preset public (visible to all users)
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePreset}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Create
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPresetsPanel;

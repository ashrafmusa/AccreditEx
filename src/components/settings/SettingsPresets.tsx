/**
 * Settings Presets Component
 * Save and load preset configurations
 */

import React, { useState } from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import {
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  PlusIcon,
} from "@/components/icons";

interface Preset {
  id: string;
  name: string;
  description: string;
  settings: Record<string, any>;
  createdAt: Date;
  isDefault?: boolean;
}

interface SettingsPresetsProps {
  presets: Preset[];
  currentSettings: Record<string, any>;
  onLoadPreset: (preset: Preset) => void;
  onSavePreset: (name: string, description: string) => void;
  onDeletePreset: (presetId: string) => void;
  onSetDefault: (presetId: string) => void;
}

export const SettingsPresets: React.FC<SettingsPresetsProps> = ({
  presets,
  currentSettings,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  onSetDefault,
}) => {
  const { t } = useTranslation();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    setSaving(true);
    try {
      onSavePreset(presetName, presetDescription);
      setPresetName("");
      setPresetDescription("");
      setShowSaveForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Save New Preset */}
      {showSaveForm ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">
            Save Current Settings as Preset
          </h4>

          <input
            type="text"
            placeholder={
              t("presetNamePlaceholder") ||
              "Preset name (e.g., 'High Security')"
            }
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            placeholder={t("descriptionOptional") || "Description (optional)"}
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim() || saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Preset"}
            </button>
            <button
              onClick={() => {
                setShowSaveForm(false);
                setPresetName("");
                setPresetDescription("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Save as Preset
        </button>
      )}

      {/* Presets List */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Saved Presets</h4>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {preset.name}
                    </span>
                    {preset.isDefault && (
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {preset.description && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {preset.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Created {preset.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onLoadPreset(preset)}
                    title={t("loadPreset") || "Load preset"}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4" />
                  </button>

                  {!preset.isDefault && (
                    <button
                      onClick={() => onSetDefault(preset.id)}
                      title={t("setAsDefault") || "Set as default"}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm("Delete this preset?")) {
                        onDeletePreset(preset.id);
                      }
                    }}
                    title={t("deletePreset") || "Delete preset"}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {presets.length === 0 && !showSaveForm && (
        <p className="text-sm text-gray-600 text-center py-4">
          No presets yet. Save your current settings to create one.
        </p>
      )}
    </div>
  );
};

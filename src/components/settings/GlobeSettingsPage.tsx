import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/hooks/useTranslation";
import SettingsCard from "./SettingsCard";
import { useToast } from "@/hooks/useToast";
import ColorPicker from "./ColorPicker";
import { labelClasses } from "@/components/ui/constants";
import Globe from "@/components/ui/Globe";

const GlobeSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { appSettings, updateAppSettings } = useAppStore();

  // Initialize globe settings with defaults if they don't exist
  const [globe, setGlobe] = useState({
    baseColor: appSettings?.globeSettings?.baseColor ?? "#1e293b",
    markerColor: appSettings?.globeSettings?.markerColor ?? "#818cf8",
    glowColor: appSettings?.globeSettings?.glowColor ?? "#4f46e5",
    scale: appSettings?.globeSettings?.scale ?? 2.5,
    darkness: appSettings?.globeSettings?.darkness ?? 0.9,
    lightIntensity: appSettings?.globeSettings?.lightIntensity ?? 1.2,
    rotationSpeed: appSettings?.globeSettings?.rotationSpeed ?? 0.02,
  });

  const handleSave = async () => {
    try {
      if (!appSettings) {
        toast.error("Settings not loaded");
        return;
      }
      const updatedSettings = {
        ...appSettings,
        globeSettings: globe,
      };
      await updateAppSettings(updatedSettings);
      toast.success(t("settingsUpdated"));
    } catch (error) {
      toast.error("Failed to save globe settings");
      console.error("Failed to save globe settings:", error);
    }
  };

  const handleSliderChange = (field: keyof typeof globe, value: number) => {
    setGlobe((g) => ({ ...g, [field]: value }));
  };

  const handleColorChange = (
    field: "baseColor" | "markerColor" | "glowColor",
    color: string
  ) => {
    setGlobe((g) => ({ ...g, [field]: color }));
  };

  // Preview location (Riyadh, Saudi Arabia)
  const previewLocation = { lat: 24.7136, long: 46.6753 };

  return (
    <div className="space-y-6">
      <SettingsCard
        title={t("globeSettings") || "Globe Settings"}
        description={
          t("globeSettingsDescription") ||
          "Configure the appearance and behavior of the interactive globe"
        }
        footer={
          <button
            onClick={handleSave}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-sky-700"
          >
            {t("saveChanges")}
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Colors */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t("colors") || "Colors"}
              </h4>
              <div className="space-y-4">
                {/* Base Color */}
                <div>
                  <label className={labelClasses}>
                    {t("baseColor") || "Base Color"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("baseColorDescription") ||
                      "The primary background color of the globe"}
                  </p>
                  <ColorPicker
                    color={globe.baseColor}
                    onChange={(color) => handleColorChange("baseColor", color)}
                  />
                </div>

                {/* Marker Color */}
                <div>
                  <label className={labelClasses}>
                    {t("markerColor") || "Marker Color"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("markerColorDescription") ||
                      "The color of location markers on the globe"}
                  </p>
                  <ColorPicker
                    color={globe.markerColor}
                    onChange={(color) =>
                      handleColorChange("markerColor", color)
                    }
                  />
                </div>

                {/* Glow Color */}
                <div>
                  <label className={labelClasses}>
                    {t("glowColor") || "Glow Color"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("glowColorDescription") ||
                      "The color of the glowing effect around the globe"}
                  </p>
                  <ColorPicker
                    color={globe.glowColor}
                    onChange={(color) => handleColorChange("glowColor", color)}
                  />
                </div>
              </div>
            </div>

            {/* Animation & Effects */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t("animation") || "Animation & Effects"}
              </h4>
              <div className="space-y-6">
                {/* Rotation Speed */}
                <div>
                  <label className={labelClasses}>
                    {t("rotationSpeed") || "Rotation Speed"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("rotationSpeedDescription") ||
                      "How fast the globe rotates"}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.01"
                      max="0.1"
                      step="0.01"
                      value={globe.rotationSpeed}
                      onChange={(e) =>
                        handleSliderChange(
                          "rotationSpeed",
                          parseFloat(e.target.value)
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">
                      {globe.rotationSpeed.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className={labelClasses}>
                    {t("scale") || "Scale"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("scaleDescription") || "The size of the globe"}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={globe.scale}
                      onChange={(e) =>
                        handleSliderChange("scale", parseFloat(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">
                      {globe.scale.toFixed(1)}x
                    </span>
                  </div>
                </div>

                {/* Darkness */}
                <div>
                  <label className={labelClasses}>
                    {t("darkness") || "Darkness"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("darknessDescription") ||
                      "How dark the globe background is"}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={globe.darkness}
                      onChange={(e) =>
                        handleSliderChange(
                          "darkness",
                          parseFloat(e.target.value)
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">
                      {(globe.darkness * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Light Intensity */}
                <div>
                  <label className={labelClasses}>
                    {t("lightIntensity") || "Light Intensity"}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t("lightIntensityDescription") ||
                      "The brightness of light on the globe"}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={globe.lightIntensity}
                      onChange={(e) =>
                        handleSliderChange(
                          "lightIntensity",
                          parseFloat(e.target.value)
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">
                      {globe.lightIntensity.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex flex-col">
            <div className="sticky top-8">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t("preview") || "Preview"}
              </h4>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Globe
                  width={300}
                  height={300}
                  baseColor={globe.baseColor}
                  markerColor={globe.markerColor}
                  glowColor={globe.glowColor}
                  scale={globe.scale}
                  darkness={globe.darkness}
                  lightIntensity={globe.lightIntensity}
                  rotationSpeed={globe.rotationSpeed}
                  userLocation={previewLocation}
                />
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t("globePreviewInfo") ||
                    "Changes are reflected in real-time. Adjust the sliders and color pickers to customize the globe appearance."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default GlobeSettingsPage;

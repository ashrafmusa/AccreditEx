import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import {
  getAllVersions,
  getRecentVersions,
  compareVersions,
  restoreVersion,
  createSettingsVersion,
} from "@/services/settingsVersionService";
import type { SettingsVersion } from "@/types";
import {
  ClockIcon,
  TagIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";

const SettingsVersionHistory: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser } = useUserStore();
  const { appSettings, setAppSettings } = useAppStore();
  const [versions, setVersions] = useState<SettingsVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<
    [string, string] | null
  >(null);
  const [comparison, setComparison] = useState<any>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [versionComment, setVersionComment] = useState("");
  const [versionTags, setVersionTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const allVersions = await getAllVersions(currentUser!.id);
      setVersions(allVersions);
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!versionComment.trim()) {
      toast.error("Please enter a comment for this version");
      return;
    }

    try {
      await createSettingsVersion(
        currentUser!.id,
        appSettings,
        versionComment,
        versionTags.length > 0 ? versionTags : undefined
      );
      toast.success("Settings version saved successfully");
      setSaveModalOpen(false);
      setVersionComment("");
      setVersionTags([]);
      loadVersions();
    } catch (error) {
      console.error("Failed to save version:", error);
      toast.error("Failed to save version");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (
      !confirm(
        "Are you sure you want to restore this version? Current settings will be lost unless saved as a version first."
      )
    ) {
      return;
    }

    try {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return;

      await restoreVersion(currentUser!.id, versionId);
      setAppSettings(version.settings);
      toast.success("Settings restored successfully");
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore version");
    }
  };

  const handleCompareVersions = async (v1Id: string, v2Id: string) => {
    try {
      const v1 = versions.find((v) => v.id === v1Id);
      const v2 = versions.find((v) => v.id === v2Id);
      if (!v1 || !v2) return;

      const diff = compareVersions(v1, v2);
      setComparison(diff);
      setSelectedVersions([v1Id, v2Id]);
    } catch (error) {
      console.error("Failed to compare versions:", error);
      toast.error("Failed to compare versions");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !versionTags.includes(tagInput.trim())) {
      setVersionTags([...versionTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setVersionTags(versionTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings Version History
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track and restore previous settings configurations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadVersions}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            Save Current Version
          </button>
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500">No saved versions yet</p>
            <button
              onClick={() => setSaveModalOpen(true)}
              className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
            >
              Save Your First Version
            </button>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-rose-100 dark:bg-pink-900/30 text-pink-700 dark:text-rose-400 rounded-full text-sm font-semibold">
                      v{version.version}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {version.comment || "No comment"}
                    </h3>
                    <button
                      onClick={() =>
                        setExpandedVersion(
                          expandedVersion === version.id ? null : version.id
                        )
                      }
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {expandedVersion === version.id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {version.createdAt?.toDate().toLocaleString() || "N/A"}
                    </div>
                    {version.tags && version.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <TagIcon className="w-4 h-4" />
                        {version.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {expandedVersion === version.id && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                        {JSON.stringify(version.settings, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestoreVersion(version.id!)}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Restore
                  </button>
                  {versions.length >= 2 && (
                    <button
                      onClick={() => {
                        const otherVersion = versions.find(
                          (v) => v.id !== version.id
                        );
                        if (otherVersion) {
                          handleCompareVersions(version.id!, otherVersion.id!);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Compare
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comparison View */}
      {comparison && selectedVersions && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Version Comparison
          </h3>
          <div className="space-y-4">
            {comparison.added.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                  Added Settings ({comparison.added.length})
                </h4>
                <div className="space-y-1">
                  {comparison.added.map((key: string) => (
                    <div
                      key={key}
                      className="text-sm text-gray-700 dark:text-gray-300 font-mono"
                    >
                      + {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison.removed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                  Removed Settings ({comparison.removed.length})
                </h4>
                <div className="space-y-1">
                  {comparison.removed.map((key: string) => (
                    <div
                      key={key}
                      className="text-sm text-gray-700 dark:text-gray-300 font-mono"
                    >
                      - {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison.modified.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                  Modified Settings ({comparison.modified.length})
                </h4>
                <div className="space-y-1">
                  {comparison.modified.map((key: string) => (
                    <div
                      key={key}
                      className="text-sm text-gray-700 dark:text-gray-300 font-mono"
                    >
                      ~ {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Version Modal */}
      {saveModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setSaveModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Save Settings Version
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Version Comment *
                </label>
                <textarea
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  placeholder="e.g., Before navigation redesign"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {versionTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Save Version
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsVersionHistory;

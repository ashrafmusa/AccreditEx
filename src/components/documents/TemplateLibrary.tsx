import { useLanguage } from "@/components/common/LanguageProvider";
import { ComplianceTemplate } from "@/data/complianceTemplates";
import { useToast } from "@/hooks/useToast";
import {
  fetchAllTemplates,
  getComplianceStandards,
  getTemplateCategories,
  getTemplateMetadata,
  searchTemplates_Service,
} from "@/services/complianceTemplatesService";
import { CheckCircle2, Filter, Search, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ComplianceTemplate) => void;
  onInsertTemplate: (template: ComplianceTemplate) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onInsertTemplate,
}) => {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [allTemplates, setAllTemplates] = useState<ComplianceTemplate[]>([]);
  const [categories, setCategories] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [standards, setStandards] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Load templates on mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [templatesData, categoriesData, standardsData] =
          await Promise.all([
            fetchAllTemplates(),
            getTemplateCategories(),
            getComplianceStandards(),
          ]);
        setAllTemplates(templatesData);
        setCategories(categoriesData);
        setStandards(standardsData);
      } catch (error) {
        console.error("Failed to load templates:", error);
        showToast("Failed to load templates", "error");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, showToast]);

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(async () => {
    let results = allTemplates;

    // Apply search
    if (searchQuery.trim()) {
      results = await searchTemplates_Service(searchQuery);
    }

    // Apply category filter
    if (selectedCategory) {
      results = results.filter((t) => t.category === selectedCategory);
    }

    // Apply standard filter
    if (selectedStandard) {
      results = results.filter((t) => t.standard === selectedStandard);
    }

    return results;
  }, [searchQuery, selectedCategory, selectedStandard, allTemplates]);

  const [displayedTemplates, setDisplayedTemplates] = useState<
    ComplianceTemplate[]
  >([]);

  React.useEffect(() => {
    const updateFiltered = async () => {
      const results = await filteredTemplates;
      setDisplayedTemplates(results);
    };
    updateFiltered();
  }, [filteredTemplates]);

  const handleSelectTemplate = useCallback(
    (template: ComplianceTemplate) => {
      setSelectedTemplate(template.id);
      onSelectTemplate(template);
    },
    [onSelectTemplate],
  );

  const handleUseTemplate = useCallback(
    (template: ComplianceTemplate) => {
      onInsertTemplate(template);
      setSelectedTemplate(null);
      onClose();
      showToast(
        t("documents.templateInserted", {
          defaultValue: "Template inserted successfully",
        }),
        "success",
      );
    },
    [onInsertTemplate, onClose, showToast, t],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className={`bg-white dark:bg-dark-brand-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${
          isRTL ? "rtl" : "ltr"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("documents.templateLibrary", {
              defaultValue: "Compliance Template Library",
            })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("documents.searchTemplates", {
                defaultValue:
                  "Search templates by name, description, or tag...",
              })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Filters Row */}
          <div
            className={`flex gap-4 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                {t("documents.category", { defaultValue: "Category" })}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                {t("documents.standard", { defaultValue: "Standard" })}
              </label>
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
              >
                <option value="">All Standards</option>
                {standards.map((std) => (
                  <option key={std.value} value={std.value}>
                    {std.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">
                {t("documents.loadingTemplates", {
                  defaultValue: "Loading templates...",
                })}
              </div>
            </div>
          ) : displayedTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">
                {t("documents.noTemplatesFound", {
                  defaultValue:
                    "No templates found. Try adjusting your search or filters.",
                })}
              </div>
            </div>
          ) : (
            displayedTemplates.map((template) => {
              const metadata = getTemplateMetadata(template);
              const isSelected = selectedTemplate === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-brand-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                          {template.name}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded">
                          {template.category}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {template.standard}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {t("documents.wordCount", {
                            defaultValue: "Words: {{count}}",
                          }).replace("{{count}}", String(metadata.wordCount))}
                        </span>
                        <span>
                          {t("documents.readingTime", {
                            defaultValue: "Reading time: {{minutes}} min",
                          }).replace(
                            "{{minutes}}",
                            String(metadata.estimatedReadingTime),
                          )}
                        </span>
                        <span>
                          {t("documents.complexity", {
                            defaultValue: "Complexity: {{level}}",
                          }).replace("{{level}}", metadata.complexity)}
                        </span>
                        <span>
                          {t("documents.sections", {
                            defaultValue: "Sections: {{count}}",
                          }).replace(
                            "{{count}}",
                            String(metadata.requiredSectionsCount),
                          )}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-brand-primary ml-4 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer - Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("documents.templatesFound", {
              defaultValue: "Showing {{count}} template(s)",
            }).replace("{{count}}", String(displayedTemplates.length))}
          </div>

          <div
            className={`flex gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-brand-text-primary dark:text-dark-brand-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>

            <button
              onClick={() => {
                const template = displayedTemplates.find(
                  (t) => t.id === selectedTemplate,
                );
                if (template) {
                  handleUseTemplate(template);
                }
              }}
              disabled={!selectedTemplate}
              className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("documents.insertTemplate", {
                defaultValue: "Insert Template",
              })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;

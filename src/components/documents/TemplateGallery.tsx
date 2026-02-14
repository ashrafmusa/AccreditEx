import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Search, FileText, CheckCircle2 } from "lucide-react";
import DOMPurify from "dompurify";
import {
  documentTemplates,
  DocumentTemplate,
  getTemplatesByCategory,
  searchTemplates,
} from "../../data/documentTemplates";

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DocumentTemplate) => void;
}

const categoryColors: Record<string, string> = {
  policy: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  procedure: "bg-rose-100 text-pink-600 dark:bg-pink-900/30 dark:text-rose-300",
  sop: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  manual:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  form: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  checklist: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] =
    useState<DocumentTemplate | null>(null);

  const categories = [
    { id: "all", label: "All Templates", count: documentTemplates.length },
    {
      id: "policy",
      label: "Policies",
      count: getTemplatesByCategory("policy").length,
    },
    {
      id: "procedure",
      label: "Procedures",
      count: getTemplatesByCategory("procedure").length,
    },
    { id: "sop", label: "SOPs", count: getTemplatesByCategory("sop").length },
    {
      id: "manual",
      label: "Manuals",
      count: getTemplatesByCategory("manual").length,
    },
    {
      id: "form",
      label: "Forms",
      count: getTemplatesByCategory("form").length,
    },
    {
      id: "checklist",
      label: "Checklists",
      count: getTemplatesByCategory("checklist").length,
    },
  ];

  const filteredTemplates = React.useMemo(() => {
    let templates = documentTemplates;

    // Filter by category
    if (selectedCategory !== "all") {
      templates = getTemplatesByCategory(
        selectedCategory as DocumentTemplate["category"],
      );
    }

    // Filter by search term
    if (searchTerm) {
      templates = searchTemplates(searchTerm);
      if (selectedCategory !== "all") {
        templates = templates.filter((t) => t.category === selectedCategory);
      }
    }

    return templates;
  }, [searchTerm, selectedCategory]);

  const handleSelectTemplate = (template: DocumentTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Templates
              </Dialog.Title>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Choose a template to get started quickly
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Categories */}
            <div className="w-56 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-brand-primary text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{category.label}</span>
                    <span
                      className={`text-xs ${
                        selectedCategory === category.id
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content - Template Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No templates found
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group relative border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-brand-primary hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-900"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      {/* Template Icon */}
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{template.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {template.description}
                          </p>

                          {/* Category Badge */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                categoryColors[template.category]
                              }`}
                            >
                              {template.category}
                            </span>
                          </div>

                          {/* Tags */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {(template.tags || []).slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                          className="px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <Dialog
          open={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          className="relative z-[60]"
        >
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
              {/* Preview Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{previewTemplate.icon}</span>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                      {previewTemplate.name}
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {previewTemplate.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(previewTemplate.content || ""),
                  }}
                />
              </div>

              {/* Preview Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Use This Template
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
};

/**
 * AI Document Generator Component - AccreditEx
 *
 * Advanced AI-powered document generation interface that helps users
 * create comprehensive, compliant documents with AI assistance.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */

import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  DownloadIcon,
  FolderIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from "@/components/icons";
import { LibraryTemplate, templateLibrary } from "@/data/templateLibrary";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  aiDocumentGeneratorService,
  DocumentGenerationRequest,
  DocumentGenerationResponse,
} from "@/services/aiDocumentGeneratorService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import React, { useEffect, useRef, useState } from "react";

interface AIDocumentGeneratorProps {
  templateId?: string;
  onDocumentGenerated?: (response: DocumentGenerationResponse) => void;
  onClose?: () => void;
  context?: any;
  preferences?: {
    tone?: "professional" | "technical" | "formal" | "informal";
    length?: "concise" | "detailed" | "comprehensive";
    format?: "markdown" | "html" | "text";
  };
}

const AIDocumentGenerator: React.FC<AIDocumentGeneratorProps> = ({
  templateId,
  onDocumentGenerated,
  onClose,
  context: propsContext,
  preferences: propsPreferences,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedTemplate, setSelectedTemplate] =
    useState<LibraryTemplate | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [generationTime, setGenerationTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showDepartmentSelector, setShowDepartmentSelector] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");

  // Get projects and departments from stores
  const projects = useProjectStore((s) => s.projects);
  const departments = useAppStore((s) => s.departments);

  const [context, setContext] = useState({
    projectId: propsContext?.projectId || "",
    departmentId: propsContext?.departmentId || "",
    specificRequirements:
      propsContext?.specificRequirements || ([] as string[]),
    existingContent: propsContext?.existingContent || "",
  });

  // Get selected project and department names
  const selectedProject = projects.find((p) => p.id === context.projectId);
  const selectedDepartment = departments.find(
    (d) => d.id === context.departmentId,
  );

  // Helper function to get string name from LocalizedString or string
  const getName = (name: any): string => {
    if (typeof name === "string") {
      return name;
    }
    if (name && typeof name === "object") {
      return (name.en || name.ar || "").toString();
    }
    return "";
  };

  // Filter projects and departments based on search
  const filteredProjects = projects.filter((p) =>
    getName(p.name).toLowerCase().includes(projectSearch.toLowerCase()),
  );
  const filteredDepartments = departments.filter((d) =>
    getName(d.name).toLowerCase().includes(departmentSearch.toLowerCase()),
  );

  const [preferences, setPreferences] = useState(
    propsPreferences || {
      tone: "professional" as const,
      length: "comprehensive" as const,
      format: "html" as const,
    },
  );

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (templateId) {
      const template = templateLibrary.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [templateId]);

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a document template");
      return;
    }

    setIsGenerating(true);
    try {
      const request: DocumentGenerationRequest = {
        templateId: selectedTemplate.id,
        context,
        preferences,
      };

      const response =
        await aiDocumentGeneratorService.generateDocument(request);

      setGeneratedContent(response.content);
      setSuggestions(response.suggestions);
      setComplianceIssues(response.complianceIssues);
      setWordCount(response.wordCount);
      setReadingTime(response.estimatedReadingTime);
      setGenerationTime(response.generationTime);

      if (onDocumentGenerated) {
        onDocumentGenerated(response);
      }

      toast.success("Document generated successfully!");
    } catch (error) {
      console.error("Document generation error:", error);
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!generatedContent) {
      toast.error("No content to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result =
        await aiDocumentGeneratorService.analyzeDocument(generatedContent);
      setAnalysis(result);
      toast.success("Document analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImproveContent = async () => {
    if (!generatedContent) {
      toast.error("No content to improve");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiDocumentGeneratorService.improveContent({
        content: generatedContent,
        suggestions: {
          improveClarity: true,
          enhanceStructure: true,
          fixGrammar: true,
          improveReadability: true,
          enhanceProfessionalism: true,
        },
      });

      setGeneratedContent(result.improvedContent);
      setWordCount(result.improvedContent.split(" ").length);
      setReadingTime(Math.ceil(result.improvedContent.split(" ").length / 200));

      toast.success("Content improved successfully!");
    } catch (error) {
      console.error("Content improvement error:", error);
      toast.error("Failed to improve content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy content");
    }
  };

  const handleDownloadContent = () => {
    const blob = new Blob([generatedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate?.name || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddRequirement = () => {
    const requirement = prompt("Enter specific requirement:");
    if (requirement) {
      setContext((prev) => ({
        ...prev,
        specificRequirements: [...prev.specificRequirements, requirement],
      }));
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setContext((prev) => ({
      ...prev,
      specificRequirements: prev.specificRequirements.filter(
        (_: string, i: number) => i !== index,
      ),
    }));
  };

  const scrollToContent = () => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-rose-600 to-cyan-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Document Generator</h2>
              <p className="text-rose-100">
                {selectedTemplate
                  ? `Generating: ${selectedTemplate.name}`
                  : "Create comprehensive documents with AI assistance"}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-rose-200 hover:text-white transition-colors"
              aria-label="Close"
              title="Close"
            >
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <DocumentIcon className="w-5 h-5" aria-hidden="true" />
                <span>Template Selection</span>
              </h3>
              <button
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                className="text-sm text-rose-600 hover:text-rose-700 font-medium"
              >
                {showTemplatePicker ? "Hide" : "Browse All"}
              </button>
            </div>

            {selectedTemplate ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h4>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {selectedTemplate.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded">
                    {selectedTemplate.category}
                  </span>
                  <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded">
                    {selectedTemplate.program}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-rose-500 dark:hover:border-rose-500 transition-colors text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <DocumentIcon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">
                  Select a template to begin
                </div>
                <div className="text-xs mt-1">
                  {templateLibrary.length} templates available
                </div>
              </button>
            )}

            {/* Template Picker Modal */}
            {showTemplatePicker && (
              <div className="absolute inset-0 z-10 bg-white dark:bg-gray-900 rounded-lg overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Select Template ({templateLibrary.length})
                  </h4>
                  <button
                    onClick={() => setShowTemplatePicker(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {templateLibrary.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplatePicker(false);
                      }}
                      className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {template.category}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {template.program}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Context Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Context</span>
            </h3>

            {/* Project Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-4 h-4" />
                  Select Project
                </div>
              </label>
              {selectedProject ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedProject.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Program: {selectedProject.program} • ID:{" "}
                      {selectedProject.id}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setContext((prev) => ({ ...prev, projectId: "" }));
                      setProjectSearch("");
                    }}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Clear selection"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowProjectSelector(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-rose-500 dark:hover:border-rose-500 transition-colors text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-2"
                >
                  <FolderIcon className="w-5 h-5" />
                  <div className="text-start">
                    <div className="text-sm font-medium">Choose Project</div>
                    <div className="text-xs">{projects.length} available</div>
                  </div>
                </button>
              )}
            </div>

            {/* Project Selector Modal */}
            {showProjectSelector && (
              <div className="absolute inset-0 z-40 bg-black/40 rounded-lg flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Select Project
                    </h3>
                    <button
                      onClick={() => {
                        setShowProjectSelector(false);
                        setProjectSearch("");
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {filteredProjects.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {filteredProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              setContext((prev) => ({
                                ...prev,
                                projectId: project.id,
                              }));
                              setShowProjectSelector(false);
                              setProjectSearch("");
                            }}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {project.program} • {project.status}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        No projects found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Department Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <BuildingOffice2Icon className="w-4 h-4" />
                  Select Department
                </div>
              </label>
              {selectedDepartment ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getName(selectedDepartment.name)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedDepartment.head &&
                        `Head: ${selectedDepartment.head}`}{" "}
                      • ID: {selectedDepartment.id}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setContext((prev) => ({ ...prev, departmentId: "" }));
                      setDepartmentSearch("");
                    }}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Clear selection"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDepartmentSelector(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-rose-500 dark:hover:border-rose-500 transition-colors text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-2"
                >
                  <BuildingOffice2Icon className="w-5 h-5" />
                  <div className="text-start">
                    <div className="text-sm font-medium">Choose Department</div>
                    <div className="text-xs">
                      {departments.length} available
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Department Selector Modal */}
            {showDepartmentSelector && (
              <div className="absolute inset-0 z-40 bg-black/40 rounded-lg flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Select Department
                    </h3>
                    <button
                      onClick={() => {
                        setShowDepartmentSelector(false);
                        setDepartmentSearch("");
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {filteredDepartments.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {filteredDepartments.map((dept) => (
                          <button
                            key={dept.id}
                            onClick={() => {
                              setContext((prev) => ({
                                ...prev,
                                departmentId: dept.id,
                              }));
                              setShowDepartmentSelector(false);
                              setDepartmentSearch("");
                            }}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getName(dept.name)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {dept.head && `Head: ${dept.head}`} •{" "}
                              {dept.staffCount || 0} staff
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        No departments found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specific Requirements
              </label>
              <div className="space-y-2">
                {context.specificRequirements.map(
                  (req: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg"
                    >
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {req}
                      </span>
                      <button
                        onClick={() => handleRemoveRequirement(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove requirement"
                        title="Remove requirement"
                      >
                        <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ),
                )}
                <button
                  onClick={handleAddRequirement}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Add requirement"
                  title="Add requirement"
                >
                  + Add Requirement
                </button>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                htmlFor="existingContent"
              >
                Existing Content (Optional)
              </label>
              <textarea
                id="existingContent"
                value={context.existingContent}
                onChange={(e) =>
                  setContext((prev) => ({
                    ...prev,
                    existingContent: e.target.value,
                  }))
                }
                placeholder="Enter existing content to build upon"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                aria-label="Existing content"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Cog6ToothIcon className="w-5 h-5" aria-hidden="true" />
              <span>Preferences</span>
            </h3>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                htmlFor="tone"
              >
                Tone
              </label>
              <select
                id="tone"
                value={preferences.tone}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    tone: e.target.value as any,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Tone"
              >
                <option value="professional">Professional</option>
                <option value="technical">Technical</option>
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                htmlFor="length"
              >
                Length
              </label>
              <select
                id="length"
                value={preferences.length}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    length: e.target.value as any,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Length"
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                htmlFor="format"
              >
                Format
              </label>
              <select
                id="format"
                value={preferences.format}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    format: e.target.value as any,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label="Format"
              >
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGenerateDocument}
              disabled={!selectedTemplate || isGenerating}
              className="w-full px-4 py-3 bg-linear-to-r from-rose-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              aria-label={
                isGenerating ? "Generating document..." : "Generate document"
              }
              title={
                isGenerating ? "Generating document..." : "Generate document"
              }
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon
                    className="w-5 h-5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" aria-hidden="true" />
                  <span>Generate Document</span>
                </>
              )}
            </button>

            {generatedContent && (
              <>
                <button
                  onClick={handleAnalyzeDocument}
                  disabled={isAnalyzing}
                  className="w-full px-4 py-2 border border-rose-600 text-rose-600 rounded-lg font-semibold hover:bg-rose-50 dark:hover:bg-pink-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={
                    isAnalyzing ? "Analyzing document..." : "Analyze document"
                  }
                  title={
                    isAnalyzing ? "Analyzing document..." : "Analyze document"
                  }
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Document"}
                </button>

                <button
                  onClick={handleImproveContent}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={
                    isGenerating ? "Improving content..." : "Improve content"
                  }
                  title={
                    isGenerating ? "Improving content..." : "Improve content"
                  }
                >
                  {isGenerating ? "Improving..." : "Improve Content"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <DocumentIcon className="w-5 h-5" aria-hidden="true" />
                  <span>Generated Content</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyContent}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Copy to clipboard"
                    aria-label="Copy content to clipboard"
                  >
                    <DocumentDuplicateIcon
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    onClick={handleDownloadContent}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Download document"
                    aria-label="Download document"
                  >
                    <DownloadIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div
                ref={contentRef}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto"
              >
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {generatedContent}
                </pre>
              </div>

              {/* Content Statistics */}
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <span>📊</span>
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{readingTime} min read</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⚡</span>
                  <span>{generationTime}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <LightBulbIcon className="w-5 h-5" aria-hidden="true" />
                <span>AI Suggestions</span>
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2"
                  >
                    <CheckIcon
                      className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Issues */}
          {complianceIssues.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Cog6ToothIcon className="w-5 h-5" aria-hidden="true" />
                <span>Compliance Issues</span>
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                {complianceIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2"
                  >
                    <XMarkIcon
                      className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Analysis */}
          {analysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <DocumentIcon className="w-5 h-5" aria-hidden="true" />
                <span>Document Analysis</span>
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.contentScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Content Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.readabilityScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Readability
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.grammarScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Grammar
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.structureScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Structure
                    </div>
                  </div>
                </div>

                {analysis.complianceIssues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Compliance Issues:
                    </h4>
                    <div className="space-y-2">
                      {analysis.complianceIssues.map(
                        (issue: any, index: number) => (
                          <div
                            key={index}
                            className="text-sm text-gray-600 dark:text-gray-400"
                          >
                            <span className="font-medium">
                              {issue.section}:
                            </span>{" "}
                            {issue.issue}
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Recommendation: {issue.recommendation}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {analysis.improvementSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Improvement Suggestions:
                    </h4>
                    <div className="space-y-1">
                      {analysis.improvementSuggestions.map(
                        (suggestion: string, index: number) => (
                          <div
                            key={index}
                            className="text-sm text-gray-600 dark:text-gray-400"
                          >
                            • {suggestion}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedContent && !isGenerating && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <LightBulbIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Ready to Generate
              </h3>
              <p className="max-w-md mx-auto">
                Configure your document requirements on the left and click
                "Generate Document" to create comprehensive, compliant content
                with AI assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDocumentGenerator;

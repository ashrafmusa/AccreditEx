import React, { useState, useEffect } from "react";
import {
  NavigationState,
  Project,
  ComplianceStatus,
  ProjectStatus,
} from "@/types";
import { ProjectTemplate } from "@/types/templates";
import { useTranslation } from "@/hooks/useTranslation";
import { ContextualHelp } from "@/components/common/ContextualHelp";
import { getHelpContent } from "@/data/helpContent";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import { FolderIcon, ArrowLeftIcon } from "@/components/icons";
import { inputClasses, labelClasses } from "@/components/ui/constants";
import DatePicker from "@/components/ui/DatePicker";
import TemplateSelector from "@/components/projects/TemplateSelector";
import { Button, ErrorMessage } from "@/components/ui";
import { aiAgentService } from "@/services/aiAgentService";

interface CreateProjectPageProps {
  navigation:
    | { view: "createProject" }
    | { view: "editProject"; projectId: string };
  setNavigation: (state: NavigationState) => void;
}

const CreateProjectPage: React.FC<CreateProjectPageProps> = ({
  navigation,
  setNavigation,
}) => {
  const { t } = useTranslation();
  const { addProject, projects, updateProject } = useProjectStore();
  const { users } = useUserStore();
  const {
    accreditationPrograms,
    projectTemplates,
    getTemplatesByProgram,
    standards,
  } = useAppStore();
  const toast = useToast();

  const isEditMode = navigation.view === "editProject";
  const existingProject = isEditMode
    ? projects.find((p) => p.id === navigation.projectId)
    : undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [showTemplateSelector, setShowTemplateSelector] = useState(!isEditMode);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<ProjectTemplate | null>(null);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [isEnhancingChecklist, setIsEnhancingChecklist] = useState(false);

  useEffect(() => {
    if (isEditMode && existingProject) {
      setName(existingProject.name);
      setDescription(existingProject.description || "");
      setProgramId(existingProject.programId);
      setLeadId(existingProject.projectLead?.id || "");
      setDepartmentId(existingProject.departmentId || "");
      setDepartmentIds(
        existingProject.departmentIds ||
          (existingProject.departmentId ? [existingProject.departmentId] : []),
      );
      setTeamMemberIds(existingProject.teamMembers || []);
      setStartDate(new Date(existingProject.startDate));
      setEndDate(
        existingProject.endDate ? new Date(existingProject.endDate) : undefined,
      );
      setShowTemplateSelector(false);
    }
  }, [isEditMode, existingProject]);

  const handleAIGenerateDescription = async () => {
    if (isGeneratingDesc) return;
    if (!name.trim()) {
      toast.error("Please enter a project name first.");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const selectedProgram = accreditationPrograms.find(
        (p) => p.id === programId,
      );
      const prompt = `You are a healthcare accreditation expert. Generate a professional project description for this accreditation project.

Project Name: ${name.trim()}
${selectedProgram ? `Program: ${selectedProgram.name}` : ""}
${selectedTemplate ? `Template: ${selectedTemplate.name} (${selectedTemplate.checklist.length} checklist items, category: ${selectedTemplate.category})` : ""}

Write a clear, professional 2-3 sentence project description that:
- States the project's objective and scope
- Mentions the accreditation standards being addressed
- Highlights expected outcomes

Return ONLY the description text, no headers or formatting.`;

      const response = await aiAgentService.chat(prompt, true);
      // Clean up any markdown formatting the AI might add
      const cleanDesc = (response.response || "")
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*/g, "")
        .trim();
      setDescription(cleanDesc.slice(0, 1000));
      toast.success("AI generated project description.");
    } catch (error) {
      console.error("AI description generation error:", error);
      toast.error("Failed to generate description. Please try again.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleAIGenerateTimeline = async () => {
    if (isGeneratingTimeline) return;
    if (!name.trim()) {
      toast.error("Please enter a project name first.");
      return;
    }
    setIsGeneratingTimeline(true);
    try {
      const selectedProgram = accreditationPrograms.find(
        (p) => p.id === programId,
      );
      const prompt = `You are a healthcare accreditation project planning expert. Suggest a realistic timeline for this accreditation project.

Project Name: ${name.trim()}
${selectedProgram ? `Program: ${selectedProgram.name}` : ""}
${selectedTemplate ? `Template: ${selectedTemplate.name} (${selectedTemplate.checklist.length} checklist items, category: ${selectedTemplate.category})` : ""}
${description ? `Description: ${description}` : ""}
Today's date: ${new Date().toISOString().split("T")[0]}

Based on the scope and complexity of this accreditation project, suggest a recommended start date and end date.
Consider typical healthcare accreditation timelines, preparation phases, and review cycles.

Respond ONLY in this exact format (dates in YYYY-MM-DD):
START: YYYY-MM-DD
END: YYYY-MM-DD
RATIONALE: (one sentence explaining the timeline)`;

      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || "";

      const startMatch = text.match(/START:\s*(\d{4}-\d{2}-\d{2})/);
      const endMatch = text.match(/END:\s*(\d{4}-\d{2}-\d{2})/);

      if (startMatch) {
        const suggestedStart = new Date(startMatch[1]);
        if (!isNaN(suggestedStart.getTime())) setStartDate(suggestedStart);
      }
      if (endMatch) {
        const suggestedEnd = new Date(endMatch[1]);
        if (!isNaN(suggestedEnd.getTime())) setEndDate(suggestedEnd);
      }

      const rationaleMatch = text.match(/RATIONALE:\s*(.+)/);
      if (rationaleMatch) {
        toast.success(`Timeline set: ${rationaleMatch[1].trim()}`);
      } else {
        toast.success("AI suggested project timeline.");
      }
    } catch (error) {
      console.error("AI timeline generation error:", error);
      toast.error("Failed to generate timeline. Please try again.");
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  // A-1: AI Smart Checklist Enhancement — enriches deterministic checklist with AI-generated action plans, risk notes, and priorities
  const handleAIEnhanceChecklist = async (checklist: any[]): Promise<any[]> => {
    if (checklist.length === 0) return checklist;
    setIsEnhancingChecklist(true);
    try {
      const selectedProgram = accreditationPrograms.find(
        (p) => p.id === programId,
      );
      // Send a summary of checklist items (max 40 for token limits)
      const itemSummary = checklist
        .slice(0, 40)
        .map((c, i) => `${i + 1}. [${c.standardId}] ${c.item}`)
        .join("\n");

      const prompt = `You are a healthcare accreditation expert. Enhance this project checklist with AI-generated action plans, risk priorities, and implementation guidance.

Project: ${name.trim()}
${selectedProgram ? `Program: ${selectedProgram.name}` : ""}
${description ? `Description: ${description}` : ""}
Checklist items (${checklist.length} total${checklist.length > 40 ? ", showing first 40" : ""}):
${itemSummary}

For each item number, provide:
- A concise action plan (1-2 sentences on how to achieve compliance)
- A risk level: HIGH, MEDIUM, or LOW
- Priority order suggestion

Respond in this format for each item:
ITEM <number>:
ACTION: <action plan text>
RISK: <HIGH|MEDIUM|LOW>

Process all items shown. Be specific to healthcare accreditation standards.`;

      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || "";

      // Parse AI response and enrich checklist items
      const enrichedChecklist = [...checklist];
      const itemPattern =
        /ITEM\s*(\d+):\s*\n?ACTION:\s*(.+?)(?:\n|$)\s*RISK:\s*(HIGH|MEDIUM|LOW)/gi;
      let match;
      while ((match = itemPattern.exec(text)) !== null) {
        const idx = parseInt(match[1]) - 1;
        if (idx >= 0 && idx < enrichedChecklist.length) {
          enrichedChecklist[idx].actionPlan = match[2].trim();
          enrichedChecklist[idx].notes = `[AI Risk: ${match[3]}] `;
        }
      }

      toast.success(
        `AI enhanced ${checklist.length} checklist items with action plans and risk levels.`,
      );
      return enrichedChecklist;
    } catch (error) {
      console.error("AI checklist enhancement error:", error);
      toast.info(
        "AI enhancement skipped — checklist created with standard items.",
      );
      return checklist;
    } finally {
      setIsEnhancingChecklist(false);
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = t("projectNameRequired") || "Project name is required";
    } else if (name.trim().length < 3) {
      newErrors.name =
        t("projectNameMinLength") ||
        "Project name must be at least 3 characters";
    } else if (name.trim().length > 200) {
      newErrors.name =
        t("projectNameMaxLength") ||
        "Project name must not exceed 200 characters";
    }

    if (!programId) {
      newErrors.programId = t("programRequired") || "Program is required";
    }

    if (!leadId) {
      newErrors.leadId = t("projectLeadRequired") || "Project lead is required";
    }

    if (!startDate) {
      newErrors.startDate = t("startDateRequired") || "Start date is required";
    }

    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate =
        t("endDateMustBeAfterStart") || "End date must be after start date";
    }

    if (description && description.length > 1000) {
      newErrors.description =
        t("descriptionMaxLength") ||
        "Description must not exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTemplateSelect = (template: ProjectTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      // Try to match program based on template ID or name if possible, otherwise leave empty
      if (template.programId) {
        setProgramId(template.programId);
      }

      // Calculate end date based on estimated duration
      if (startDate && template.estimatedDuration) {
        const end = new Date(startDate);
        end.setDate(end.getDate() + template.estimatedDuration);
        setEndDate(end);
      }
    } else {
      // Reset if "Start from Scratch" is selected
      setName("");
      setDescription("");
      setProgramId("");
      setEndDate(undefined);
    }
    setShowTemplateSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("pleaseFixErrors") || "Please fix the errors below");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && existingProject) {
        const updatedData: Project = {
          ...existingProject,
          name,
          description,
          programId,
          projectLead: users.find((u) => u.id === leadId)!,
          teamMembers: teamMemberIds,
          departmentId: departmentId || undefined,
          departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
          startDate: startDate!.toISOString().split("T")[0],
          endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
        };
        await updateProject(updatedData);
        toast.success(
          t("projectUpdatedSuccessfully") || "Project updated successfully",
        );
        setNavigation({ view: "projectDetail", projectId: existingProject.id });
      } else {
        // Convert template checklist OR generate from standards
        let convertedChecklist: any[] = [];

        if (selectedTemplate?.checklist?.length) {
          // Use template checklist
          convertedChecklist = selectedTemplate.checklist.map(
            (templateItem, index) => ({
              id: `item-${Date.now()}-${index}`,
              item: templateItem.title,
              standardId: templateItem.category || `STD-${index + 1}`,
              status: ComplianceStatus.NotStarted,
              assignedTo: null,
              dueDate: null,
              actionPlan: templateItem.description || "",
              notes: "",
              evidenceFiles: [],
              comments: [],
              linkedFhirResources: [],
            }),
          );
        } else {
          // Generate checklist from standards matching the selected program
          const programStandards = standards.filter(
            (s) => s.programId === programId,
          );
          let itemIndex = 0;
          for (const standard of programStandards) {
            if (standard.subStandards && standard.subStandards.length > 0) {
              // Each sub-standard becomes a checklist item
              for (const sub of standard.subStandards) {
                convertedChecklist.push({
                  id: `item-${Date.now()}-${itemIndex++}`,
                  item: sub.description,
                  standardId: standard.standardId,
                  status: ComplianceStatus.NotStarted,
                  assignedTo: null,
                  dueDate: null,
                  actionPlan: "",
                  notes: "",
                  evidenceFiles: [],
                  comments: [],
                  linkedFhirResources: [],
                });
              }
            } else {
              // Standard without sub-standards becomes a single checklist item
              convertedChecklist.push({
                id: `item-${Date.now()}-${itemIndex++}`,
                item: standard.description,
                standardId: standard.standardId,
                status: ComplianceStatus.NotStarted,
                assignedTo: null,
                dueDate: null,
                actionPlan: "",
                notes: "",
                evidenceFiles: [],
                comments: [],
                linkedFhirResources: [],
              });
            }
          }
        }

        // A-1: AI Smart Enhancement Pass — enrich checklist with action plans and risk levels
        if (convertedChecklist.length > 0) {
          convertedChecklist =
            await handleAIEnhanceChecklist(convertedChecklist);
        }

        const projectLead = users.find((u) => u.id === leadId);
        if (!projectLead) {
          toast.error(t("projectLeadNotFound") || "Project lead not found");
          setIsSubmitting(false);
          return;
        }

        // Create a clean project lead object without undefined values
        const cleanProjectLead = {
          id: projectLead.id,
          name: projectLead.name,
          email: projectLead.email,
          role: projectLead.role,
          departmentId: projectLead.departmentId || undefined,
          jobTitle: projectLead.jobTitle || undefined,
          hireDate: projectLead.hireDate || undefined,
          competencies: projectLead.competencies || [],
          trainingAssignments: projectLead.trainingAssignments || [],
          readAndAcknowledge: projectLead.readAndAcknowledge || [],
        };

        const newProjectData = {
          name,
          description: description || "",
          programId,
          projectLead: cleanProjectLead,
          teamMembers: teamMemberIds,
          departmentId: departmentId || undefined,
          departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
          startDate: startDate!.toISOString().split("T")[0],
          endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
          status: "Not Started" as ProjectStatus,
          archived: false,
          archivedAt: undefined,
          finalizedBy: undefined,
          finalizationDate: undefined,
          progress: 0,
          checklist: convertedChecklist,
          capaReports: [],
          pdcaCycles: [],
          mockSurveys: [],
          designControls: [],
          activityLog: [],
        };

        // Remove any undefined values recursively
        const removeUndefined = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(removeUndefined);
          } else if (obj !== null && typeof obj === "object") {
            return Object.entries(obj).reduce(
              (acc, [key, value]) => {
                if (value !== undefined) {
                  acc[key] = removeUndefined(value);
                }
                return acc;
              },
              {} as Record<string, unknown>,
            );
          }
          return obj;
        };

        const cleanedData = removeUndefined(newProjectData);

        await addProject(cleanedData as Omit<Project, "id">);
        toast.success(
          t("projectCreatedSuccessfully") || "Project created successfully",
        );
        setNavigation({ view: "projects" });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("failedToSaveProject") || "Failed to save project";
      toast.error(errorMsg);
      console.error("Project save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start mb-6">
        <FolderIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              {isEditMode ? t("editProject") : t("createNewProject")}
            </h1>
            <ContextualHelp content={getHelpContent("createProject")!} />
          </div>
        </div>
      </div>

      {showTemplateSelector ? (
        <TemplateSelector
          templates={projectTemplates}
          selectedTemplateId={selectedTemplate?.id || null}
          onSelectTemplate={(templateId) => {
            const template = templateId
              ? (projectTemplates.find((t) => t.id === templateId) ?? null)
              : null;
            handleTemplateSelect(template);
          }}
          onPreview={(template) => setPreviewTemplate(template)}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-brand-surface dark:bg-dark-brand-surface p-8 rounded-lg shadow-md border border-brand-border dark:border-dark-brand-border animate-fadeIn"
        >
          {!isEditMode && (
            <Button
              type="button"
              onClick={() => setShowTemplateSelector(true)}
              variant="ghost"
              size="sm"
              className="mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1 rtl:ml-1" />
              {t("backToTemplates")}
            </Button>
          )}

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">
                {t("pleaseFixErrors") || "Please fix the errors below"}
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li
                    key={field}
                    className="text-red-700 dark:text-red-400 text-sm"
                  >
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="name" className={labelClasses}>
              {t("projectName")}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClasses} ${
                errors.name ? "border-red-500 focus:ring-red-500" : ""
              }`}
              required
              maxLength={200}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">{name.length}/200</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="description" className={labelClasses}>
                {t("projectDescription")}
              </label>
              <button
                type="button"
                onClick={handleAIGenerateDescription}
                disabled={isGeneratingDesc || !name.trim()}
                className="text-xs bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-3 py-1 rounded-md hover:from-rose-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mb-1"
              >
                {isGeneratingDesc ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>{" "}
                    Generating...
                  </>
                ) : (
                  <>🤖 AI Generate</>
                )}
              </button>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${inputClasses} ${
                errors.description ? "border-red-500 focus:ring-red-500" : ""
              }`}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {description.length}/1000
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="program" className={labelClasses}>
                {t("program")}
              </label>
              <select
                id="program"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className={`${inputClasses} ${
                  errors.programId ? "border-red-500 focus:ring-red-500" : ""
                }`}
                required
                disabled={isEditMode}
              >
                <option value="">{t("selectProgram")}</option>
                {accreditationPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.programId && (
                <p className="text-red-500 text-sm mt-1">{errors.programId}</p>
              )}
            </div>
            <div>
              <label htmlFor="lead" className={labelClasses}>
                {t("projectLead")}
              </label>
              <select
                id="lead"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className={`${inputClasses} ${
                  errors.leadId ? "border-red-500 focus:ring-red-500" : ""
                }`}
                required
              >
                <option value="">{t("selectLead")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {errors.leadId && (
                <p className="text-red-500 text-sm mt-1">{errors.leadId}</p>
              )}
            </div>
          </div>

          {/* Department Assignment */}
          <div>
            <label htmlFor="department" className={labelClasses}>
              {t("department") || "Department"}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Primary department for this project (backward compatible).
            </p>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputClasses}
            >
              <option value="">
                {t("noDepartment") || "— No Department —"}
              </option>
              {(useAppStore.getState().departments || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name.en || d.name.ar}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Department Assignment (Hospital-Wide Projects) */}
          <div>
            <label className={labelClasses}>
              🏢 Departments (Hospital-Wide)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              For hospital-wide accreditation projects, select all departments
              involved. AI can auto-assign standards to departments in the
              checklist view.
            </p>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
              {(useAppStore.getState().departments || [])
                .filter((d) => d.isActive !== false)
                .map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={departmentIds.includes(d.id)}
                      onChange={() => {
                        setDepartmentIds((prev) =>
                          prev.includes(d.id)
                            ? prev.filter((id) => id !== d.id)
                            : [...prev, d.id],
                        );
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {d.name.en || d.name.ar}
                    </span>
                  </label>
                ))}
            </div>
            {departmentIds.length > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {departmentIds.length} department
                {departmentIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Team Members Multi-Select */}
          <div>
            <label className={labelClasses}>
              {t("teamMembers") || "Team Members"}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Select users who will work on this project. They can be assigned
              to checklist items.
            </p>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
              {users
                .filter((u) => u.id !== leadId && u.isActive !== false)
                .map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={teamMemberIds.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeamMemberIds([...teamMemberIds, u.id]);
                        } else {
                          setTeamMemberIds(
                            teamMemberIds.filter((id) => id !== u.id),
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {u.role}
                          {u.department ? ` • ${u.department}` : ""}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
            </div>
            {teamMemberIds.length > 0 && (
              <p className="text-xs text-brand-primary mt-1 font-medium">
                {teamMemberIds.length} member
                {teamMemberIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between">
                <label className={labelClasses}>{t("startDate")}</label>
                <button
                  type="button"
                  onClick={handleAIGenerateTimeline}
                  disabled={isGeneratingTimeline || !name.trim()}
                  className="text-xs bg-gradient-to-r from-rose-600 to-cyan-600 text-white px-3 py-1 rounded-md hover:from-rose-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mb-1"
                >
                  {isGeneratingTimeline ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>{" "}
                      Suggesting...
                    </>
                  ) : (
                    <>🤖 AI Timeline</>
                  )}
                </button>
              </div>
              <DatePicker date={startDate} setDate={setStartDate} />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>{t("endDate")}</label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                fromDate={startDate}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-brand-border dark:border-dark-brand-border">
            <Button
              type="button"
              onClick={() => setNavigation({ view: "projects" })}
              disabled={isSubmitting}
              variant="secondary"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isEnhancingChecklist}
              loading={isSubmitting || isEnhancingChecklist}
            >
              {isEnhancingChecklist
                ? "🤖 AI Enhancing Checklist..."
                : t("save")}
            </Button>
          </div>
        </form>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">
                    {previewTemplate.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {previewTemplate.description}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    📋 {previewTemplate.checklist.length} {t("items")}
                  </span>
                  <span>
                    ⏱️ {previewTemplate.estimatedDuration} {t("days")}
                  </span>
                  <span>🏥 {previewTemplate.category}</span>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 dark:text-white">
                    {t("checklistItems")}:
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {previewTemplate.checklist.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <h4 className="font-medium dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                        {item.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {t("close")}
                  </button>
                  <button
                    onClick={() => {
                      handleTemplateSelect(previewTemplate);
                      setPreviewTemplate(null);
                      setShowTemplateSelector(false);
                    }}
                    className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-sky-700"
                  >
                    {t("useThisTemplate")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectPage;

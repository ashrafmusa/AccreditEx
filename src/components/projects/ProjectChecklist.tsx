import React, { useState, useMemo, useCallback } from "react";
import { Project, ComplianceStatus, ChecklistItem, Department } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import ChecklistItemComponent from "./ChecklistItemComponent";
import { SearchIcon, XMarkIcon } from "../icons";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAppStore } from "@/stores/useAppStore";
import { useToast } from "@/hooks/useToast";
import { aiAgentService } from "@/services/aiAgentService";
import AISuggestionModal from "@/components/ai/AISuggestionModal";
import { statusToTranslationKey } from "@/utils/complianceUtils";

/** A single AI-proposed standard→department mapping */
interface DeptAssignmentProposal {
  standardId: string;
  departmentId: string;
  itemCount: number;
  sample: string;
}

interface ProjectChecklistProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

const ProjectChecklist: React.FC<ProjectChecklistProps> = ({ project }) => {
  const { t } = useTranslation();
  const { updateChecklistItem, updateProject } = useProjectStore();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "all">(
    "all",
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAssigningDepts, setIsAssigningDepts] = useState(false);
  const [isApplyingDepts, setIsApplyingDepts] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState("");
  const [deptProposals, setDeptProposals] = useState<DeptAssignmentProposal[]>(
    [],
  );
  const [deptReviewOpen, setDeptReviewOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const departments = useAppStore((s) => s.departments) || [];

  const handleChecklistItemUpdate = async (
    itemId: string,
    updates: Partial<ChecklistItem>,
  ) => {
    await updateChecklistItem(project.id, itemId, updates);
  };

  const handleAIGapAnalysis = async () => {
    if (isAnalyzing || project.checklist.length === 0) return;
    setIsAnalyzing(true);
    try {
      const stats = {
        total: project.checklist.length,
        compliant: project.checklist.filter(
          (i) => i.status === ComplianceStatus.Compliant,
        ).length,
        nonCompliant: project.checklist.filter(
          (i) => i.status === ComplianceStatus.NonCompliant,
        ).length,
        partial: project.checklist.filter(
          (i) => i.status === ComplianceStatus.PartiallyCompliant,
        ).length,
        notStarted: project.checklist.filter(
          (i) => i.status === ComplianceStatus.NotStarted,
        ).length,
        noEvidence: project.checklist.filter(
          (i) =>
            i.evidenceFiles.length === 0 &&
            i.status !== ComplianceStatus.NotApplicable,
        ).length,
        overdue: project.checklist.filter(
          (i) =>
            i.dueDate &&
            new Date(i.dueDate) < new Date() &&
            i.status !== ComplianceStatus.Compliant,
        ).length,
      };

      // Build a summarized checklist to keep the prompt within token limits.
      // Prioritize non-compliant and partially compliant items, then overdue, then a sample of the rest.
      const MAX_ITEMS = 60;
      const formatItem = (item: ChecklistItem) =>
        `- [${item.status}] ${item.standardId}: ${item.item}${item.notes ? ` (Notes: ${item.notes.slice(0, 80)})` : ""}${item.actionPlan ? ` (Action: ${item.actionPlan.slice(0, 80)})` : ""}`;

      const nonCompliantItems = project.checklist.filter(
        (i) => i.status === ComplianceStatus.NonCompliant,
      );
      const partialItems = project.checklist.filter(
        (i) => i.status === ComplianceStatus.PartiallyCompliant,
      );
      const overdueItems = project.checklist.filter(
        (i) =>
          i.dueDate &&
          new Date(i.dueDate) < new Date() &&
          i.status !== ComplianceStatus.Compliant &&
          i.status !== ComplianceStatus.NonCompliant &&
          i.status !== ComplianceStatus.PartiallyCompliant,
      );
      const notStartedItems = project.checklist.filter(
        (i) => i.status === ComplianceStatus.NotStarted,
      );

      let summaryParts: string[] = [];
      let remaining = MAX_ITEMS;

      // Always include all non-compliant (up to 30)
      const ncSlice = nonCompliantItems.slice(0, Math.min(30, remaining));
      if (ncSlice.length > 0) {
        summaryParts.push(
          `### Non-Compliant Items (${nonCompliantItems.length} total, showing ${ncSlice.length}):`,
        );
        summaryParts.push(...ncSlice.map(formatItem));
        remaining -= ncSlice.length;
      }

      // Then partially compliant (up to remaining)
      const pcSlice = partialItems.slice(0, Math.min(20, remaining));
      if (pcSlice.length > 0) {
        summaryParts.push(
          `\n### Partially Compliant Items (${partialItems.length} total, showing ${pcSlice.length}):`,
        );
        summaryParts.push(...pcSlice.map(formatItem));
        remaining -= pcSlice.length;
      }

      // Then overdue
      const odSlice = overdueItems.slice(0, Math.min(10, remaining));
      if (odSlice.length > 0) {
        summaryParts.push(
          `\n### Overdue Items (${overdueItems.length} total, showing ${odSlice.length}):`,
        );
        summaryParts.push(...odSlice.map(formatItem));
        remaining -= odSlice.length;
      }

      // Sample of not-started if space remains
      if (remaining > 0 && notStartedItems.length > 0) {
        const nsSlice = notStartedItems.slice(0, Math.min(5, remaining));
        summaryParts.push(
          `\n### Not Started Items (${notStartedItems.length} total, showing ${nsSlice.length}):`,
        );
        summaryParts.push(...nsSlice.map(formatItem));
      }

      const summary = summaryParts.join("\n");

      const prompt = `Perform a comprehensive compliance gap analysis for this accreditation project checklist.

## Project: ${project.name}
## Statistics:
- Total items: ${stats.total}
- Compliant: ${stats.compliant} (${Math.round((stats.compliant / stats.total) * 100)}%)
- Non-Compliant: ${stats.nonCompliant}
- Partially Compliant: ${stats.partial}
- Not Started: ${stats.notStarted}
- Missing Evidence: ${stats.noEvidence} items
- Overdue: ${stats.overdue} items

## Priority Items (summarized):
${summary}

Please provide:
1. **Overall Compliance Risk Level** (Low/Medium/High/Critical)
2. **Critical Gaps** — most urgent non-compliant items and why
3. **Missing Evidence Risks** — items that need evidence urgently
4. **Overdue Action Items** — items past their due date
5. **Pattern Analysis** — common themes or systemic issues
6. **Priority Recommendations** — top 5 actions to improve compliance score
7. **Estimated Readiness** — assessment of readiness for accreditation survey`;

      const response = await aiAgentService.chat(prompt, true);
      setAiModalContent(response.response);
      setAiModalOpen(true);
      toast.success("Compliance gap analysis complete!");
    } catch (error) {
      toast.error("Failed to generate gap analysis");
      console.error("AI gap analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // A-2 Enhancement: Structured AI gap detection — flags at-risk items with risk tags in notes
  const [isFlaggingRisks, setIsFlaggingRisks] = useState(false);

  const handleAIFlagRisks = async () => {
    if (isFlaggingRisks || project.checklist.length === 0) return;
    setIsFlaggingRisks(true);
    try {
      // Build a compact list of non-compliant / partial / no-evidence items
      const atRiskItems = project.checklist.filter(
        (i) =>
          i.status === ComplianceStatus.NonCompliant ||
          i.status === ComplianceStatus.PartiallyCompliant ||
          (i.evidenceFiles.length === 0 &&
            i.status !== ComplianceStatus.NotApplicable &&
            i.status !== ComplianceStatus.Compliant) ||
          (i.dueDate &&
            new Date(i.dueDate) < new Date() &&
            i.status !== ComplianceStatus.Compliant),
      );

      if (atRiskItems.length === 0) {
        toast.info("No at-risk items found — all items appear healthy.");
        setIsFlaggingRisks(false);
        return;
      }

      const itemList = atRiskItems
        .slice(0, 50)
        .map(
          (item, i) =>
            `${i + 1}. ID:${item.id} | [${item.status}] ${item.standardId}: ${item.item.slice(0, 100)}${item.evidenceFiles.length === 0 ? " [NO EVIDENCE]" : ""}${item.dueDate && new Date(item.dueDate) < new Date() ? " [OVERDUE]" : ""}`,
        )
        .join("\n");

      const prompt = `You are a healthcare accreditation risk analyst. Analyze these at-risk checklist items and assign a risk level and brief risk note to each.

Project: ${project.name}
At-risk items (${atRiskItems.length} total${atRiskItems.length > 50 ? ", showing first 50" : ""}):
${itemList}

For each item, respond ONLY in this format:
ITEM <number>:
RISK: <CRITICAL|HIGH|MEDIUM>
NOTE: <Brief 1-sentence risk explanation and recommended action>

Assess risk based on: compliance status severity, evidence gaps, overdue status, and potential impact on accreditation.`;

      const response = await aiAgentService.chat(prompt, true);
      const text = response.response || "";

      // Parse and apply risk flags
      const flagPattern =
        /ITEM\s*(\d+):\s*\n?RISK:\s*(CRITICAL|HIGH|MEDIUM)\s*\n?NOTE:\s*(.+?)(?=\nITEM|\n\n|$)/gi;
      let flagMatch;
      let flaggedCount = 0;

      while ((flagMatch = flagPattern.exec(text)) !== null) {
        const idx = parseInt(flagMatch[1]) - 1;
        if (idx >= 0 && idx < atRiskItems.length) {
          const item = atRiskItems[idx];
          const riskTag = `[⚠️ AI Risk: ${flagMatch[2]}] ${flagMatch[3].trim()}`;
          // Prepend risk tag to existing notes, avoid duplicating
          const existingNotes = item.notes || "";
          const cleanedNotes = existingNotes
            .replace(/\[⚠️ AI Risk:.*?\]\s*.*?(?=\n|$)/g, "")
            .trim();
          const newNotes = cleanedNotes
            ? `${riskTag}\n${cleanedNotes}`
            : riskTag;
          await updateChecklistItem(project.id, item.id, {
            notes: newNotes,
          });
          flaggedCount++;
        }
      }

      toast.success(
        `AI flagged ${flaggedCount} items with risk levels and recommendations.`,
      );
    } catch (error) {
      toast.error("Failed to flag at-risk items");
      console.error("AI risk flagging error:", error);
    } finally {
      setIsFlaggingRisks(false);
    }
  };

  // AI Auto-Assign Departments to checklist items
  const handleAIAssignDepartments = async () => {
    if (
      isAssigningDepts ||
      project.checklist.length === 0 ||
      departments.length === 0
    )
      return;
    setIsAssigningDepts(true);
    try {
      const activeDepts = departments.filter((d) => d.isActive !== false);

      // Build rich department list with descriptions for better AI matching
      const deptLines = activeDepts
        .map((d) => {
          const desc = d.description?.en || d.description?.ar || "";
          return `- id: "${d.id}", name: "${d.name.en || d.name.ar}"${desc ? `, scope: "${desc.slice(0, 120)}"` : ""}`;
        })
        .join("\n");

      // Group checklist items by standardId — send standardId + top 2 samples
      const standardGroups = new Map<
        string,
        { count: number; samples: string[] }
      >();
      for (const item of project.checklist) {
        const key = item.standardId || "UNKNOWN";
        if (!standardGroups.has(key))
          standardGroups.set(key, { count: 0, samples: [] });
        const g = standardGroups.get(key)!;
        g.count++;
        if (g.samples.length < 2) g.samples.push(item.item.slice(0, 100));
      }

      // Build concise list: standardId + samples (keep prompt small but informative)
      const stdLines = Array.from(standardGroups.entries())
        .map(
          ([stdId, g]) =>
            `${stdId} (${g.count} items): ${g.samples.map((s) => `"${s}"`).join("; ")}`,
        )
        .join("\n");

      const prompt = `You are a healthcare accreditation expert. Assign each standard to the single most responsible hospital department.

Available Departments:
${deptLines}

Standards to assign:
${stdLines}

IMPORTANT RULES:
1. Use EXACT department IDs from the list above
2. Match based on clinical/operational scope: infection prevention→IC, human resources/staffing/credentialing→HR, direct patient care/nursing→Nursing/Clinical, medication/pharmacy→Pharmacy, laboratory/pathology→Lab, radiology/imaging→Radiology, facility management/safety/environment→Facilities, quality improvement/patient safety→Quality, leadership/governance/strategic→Administration, information technology/health records→IT, education/training/orientation→Education, dietary/nutrition→Nutrition, emergency→Emergency, surgical→Surgery, anesthesia→Anesthesia
3. When a standard spans multiple departments, pick the PRIMARY owner
4. Every standard MUST be assigned to exactly one department

Respond ONLY with a valid JSON array. No markdown, no explanation:
[{"standardId":"EXAMPLE-001","departmentId":"exact-dept-id-from-list"}]`;

      const response = await aiAgentService.chat(prompt, false);
      const responseText = response.response;
      console.log("🏢 AI dept assignment raw response:", responseText);

      // Try to extract JSON from the response
      let assignmentMap = new Map<string, string>();
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const assignments: { standardId: string; departmentId: string }[] =
            JSON.parse(jsonMatch[0]);
          for (const a of assignments) {
            if (a.standardId && a.departmentId) {
              assignmentMap.set(a.standardId, a.departmentId);
            }
          }
        } catch {
          // JSON parse failed, try text parsing
          console.warn("🏢 JSON parse failed, falling back to text parsing");
        }
      }

      // Fallback: parse text patterns with scoring-based department matching
      if (assignmentMap.size === 0) {
        const lines = responseText.split("\n");
        const stdIds = new Set(standardGroups.keys());

        // Build keyword index for each department for scoring
        const deptKeywords = new Map<
          string,
          { dept: (typeof activeDepts)[0]; keywords: string[] }
        >();
        for (const dept of activeDepts) {
          const nameEn = (dept.name.en || "").toLowerCase();
          const nameAr = (dept.name.ar || "").toLowerCase();
          const descEn = (dept.description?.en || "").toLowerCase();
          const keywords = [
            nameEn,
            nameAr,
            ...nameEn.split(/[\s/&,-]+/).filter((w) => w.length > 2),
            ...descEn.split(/[\s/&,-]+/).filter((w) => w.length > 3),
          ].filter(Boolean);
          deptKeywords.set(dept.id, { dept, keywords });
        }

        // Score-based matching function
        const scoreDeptMatch = (
          text: string,
        ): (typeof activeDepts)[0] | null => {
          const textLower = text.toLowerCase();
          let bestDept: (typeof activeDepts)[0] | null = null;
          let bestScore = 0;

          for (const [, { dept, keywords }] of deptKeywords) {
            let score = 0;
            const nameEn = (dept.name.en || "").toLowerCase();

            // Exact dept ID in text → highest score
            if (textLower.includes(dept.id)) score += 100;
            // Exact full name match
            if (nameEn && textLower.includes(nameEn)) score += 50;
            // Full name contains text (e.g. text="pharmacy", name="Clinical Pharmacy")
            if (nameEn && nameEn.includes(textLower.trim())) score += 40;
            // Individual keyword matches
            for (const kw of keywords) {
              if (kw.length > 2 && textLower.includes(kw)) score += 5;
            }

            if (score > bestScore) {
              bestScore = score;
              bestDept = dept;
            }
          }

          return bestScore >= 5 ? bestDept : null;
        };

        for (const line of lines) {
          const cleanLine = line
            .replace(/\*{1,2}/g, "")
            .replace(/`/g, "")
            .replace(/^\s*[-•\d.]+\s*/, "")
            .trim();
          if (!cleanLine || cleanLine.length < 5) continue;

          for (const stdId of stdIds) {
            if (assignmentMap.has(stdId)) continue;
            if (!cleanLine.includes(stdId)) continue;

            const afterStd = cleanLine.split(stdId).pop() || "";
            const deptText = afterStd
              .replace(/^\s*[→:–\-|,]+\s*/, "")
              .replace(/\s*\|.*$/, "")
              .replace(/\(.*?\)/g, "")
              .replace(/\"[^"]*\"/g, "") // remove quoted samples
              .trim();

            if (!deptText || deptText.length < 2) continue;

            const matchedDept = scoreDeptMatch(deptText);
            if (matchedDept) {
              assignmentMap.set(stdId, matchedDept.id);
            }
          }
        }
        console.log(
          "🏢 Score-based text parsing found:",
          assignmentMap.size,
          "assignments",
        );
      }

      // Tier 3: Proximity + scoring — scan entire response for dept references near standard IDs
      if (assignmentMap.size < standardGroups.size) {
        const stdIds = Array.from(standardGroups.keys()).filter(
          (s) => !assignmentMap.has(s),
        );
        const lowerResponse = responseText.toLowerCase();

        for (const dept of activeDepts) {
          const nameEn = (dept.name.en || "").toLowerCase();
          const nameAr = (dept.name.ar || "").toLowerCase();
          const searchNames = [dept.id, nameEn, nameAr].filter(
            (n) => n && n.length > 2,
          );

          for (const searchName of searchNames) {
            let searchFrom = 0;
            while (true) {
              const idx = lowerResponse.indexOf(searchName, searchFrom);
              if (idx === -1) break;
              const ctxStart = Math.max(0, idx - 300);
              const ctxEnd = Math.min(
                responseText.length,
                idx + searchName.length + 300,
              );
              const context = responseText.slice(ctxStart, ctxEnd);
              for (const stdId of stdIds) {
                if (context.includes(stdId) && !assignmentMap.has(stdId)) {
                  assignmentMap.set(stdId, dept.id);
                }
              }
              searchFrom = idx + searchName.length;
            }
          }
        }
        console.log(
          "🏢 Proximity+scoring found total:",
          assignmentMap.size,
          "assignments",
        );
      }

      if (assignmentMap.size === 0) {
        // Couldn't auto-parse — still open review modal with all standards unassigned
        // so users can manually assign
        console.warn(
          "🏢 Could not auto-parse AI suggestions, showing manual assignment UI",
        );
        const proposals: DeptAssignmentProposal[] = [];
        for (const [stdId, group] of standardGroups) {
          proposals.push({
            standardId: stdId,
            departmentId: "",
            itemCount: group.count,
            sample: group.samples[0] || "",
          });
        }
        setDeptProposals(proposals);
        setDeptReviewOpen(true);
        // Also store the raw AI response so users can reference it
        setAiModalContent(responseText);
        toast.info(
          "AI could not be auto-parsed. Please manually assign departments below — AI suggestions are shown for reference.",
        );
        return;
      }

      // Build proposals for review
      const proposals: DeptAssignmentProposal[] = [];
      for (const [stdId, deptId] of assignmentMap) {
        const group = standardGroups.get(stdId);
        proposals.push({
          standardId: stdId,
          departmentId: deptId,
          itemCount: group?.count || 0,
          sample: group?.samples[0] || "",
        });
      }

      // Also add any standards AI didn't cover so user can manually assign
      for (const [stdId, group] of standardGroups) {
        if (!assignmentMap.has(stdId)) {
          proposals.push({
            standardId: stdId,
            departmentId: "",
            itemCount: group.count,
            sample: group.samples[0] || "",
          });
        }
      }

      setDeptProposals(proposals);
      setDeptReviewOpen(true);
      toast.success(
        `AI suggested ${assignmentMap.size} department assignments. Review and apply.`,
      );
    } catch (error) {
      toast.error("Failed to get AI department suggestions");
      console.error("AI department assignment error:", error);
    } finally {
      setIsAssigningDepts(false);
    }
  };

  // Apply reviewed department proposals to checklist items — single batch write
  const handleApplyDeptProposals = async () => {
    setIsApplyingDepts(true);
    try {
      // Build a standardId → departmentId lookup
      const assignMap = new Map<string, string>();
      for (const proposal of deptProposals) {
        if (proposal.departmentId) {
          assignMap.set(proposal.standardId, proposal.departmentId);
        }
      }

      // Apply all changes in a single checklist mutation
      let updatedCount = 0;
      const newChecklist = project.checklist.map((item) => {
        const newDeptId = assignMap.get(item.standardId || "");
        if (newDeptId && item.departmentId !== newDeptId) {
          updatedCount++;
          return { ...item, departmentId: newDeptId };
        }
        return item;
      });

      // Single Firestore write instead of N individual writes
      if (updatedCount > 0) {
        await updateProject({ ...project, checklist: newChecklist });
      }

      setDeptReviewOpen(false);
      setDeptProposals([]);
      toast.success(
        `Applied department assignments to ${updatedCount} checklist items!`,
      );
    } catch (error) {
      toast.error("Failed to apply department assignments");
      console.error("Apply dept assignments error:", error);
    } finally {
      setIsApplyingDepts(false);
    }
  };

  // Update a single proposal's department
  const handleProposalDeptChange = (standardId: string, newDeptId: string) => {
    setDeptProposals((prev) =>
      prev.map((p) =>
        p.standardId === standardId ? { ...p, departmentId: newDeptId } : p,
      ),
    );
  };

  const filteredChecklist = useMemo(() => {
    // Reset visible count when filters change
    setVisibleCount(PAGE_SIZE);
    return project.checklist.filter((item) => {
      const matchesSearch =
        (item.item?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.standardId?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        );
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchesDepartment =
        departmentFilter === "all" ||
        (departmentFilter === "unassigned"
          ? !item.departmentId
          : item.departmentId === departmentFilter);
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [project.checklist, searchTerm, statusFilter, departmentFilter]);

  const visibleChecklist = useMemo(
    () => filteredChecklist.slice(0, visibleCount),
    [filteredChecklist, visibleCount],
  );

  const hasMore = visibleCount < filteredChecklist.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const checklistStats = useMemo(() => {
    const total = project.checklist.length;
    if (total === 0) return null;
    const compliant = project.checklist.filter(
      (i) => i.status === ComplianceStatus.Compliant,
    ).length;
    const partial = project.checklist.filter(
      (i) => i.status === ComplianceStatus.PartiallyCompliant,
    ).length;
    const nonCompliant = project.checklist.filter(
      (i) => i.status === ComplianceStatus.NonCompliant,
    ).length;
    const notStarted = project.checklist.filter(
      (i) => i.status === ComplianceStatus.NotStarted,
    ).length;
    const notApplicable = project.checklist.filter(
      (i) => i.status === ComplianceStatus.NotApplicable,
    ).length;
    const overdue = project.checklist.filter(
      (i) =>
        i.dueDate &&
        new Date(i.dueDate) < new Date() &&
        i.status !== ComplianceStatus.Compliant &&
        i.status !== ComplianceStatus.NotApplicable,
    ).length;
    const compliancePercent = Math.round((compliant / total) * 100);
    const progressPercent = Math.round(
      ((compliant + partial + notApplicable) / total) * 100,
    );
    return {
      total,
      compliant,
      partial,
      nonCompliant,
      notStarted,
      notApplicable,
      overdue,
      compliancePercent,
      progressPercent,
    };
  }, [project.checklist]);

  return (
    <div className="space-y-4">
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchChecklist")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-48 p-2 border rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">{t("allStatuses")}</option>
            {Object.values(ComplianceStatus).map((s) => (
              <option key={s} value={s}>
                {t(statusToTranslationKey(s) as any)}
              </option>
            ))}
          </select>
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-52 p-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="all">🏢 All Departments</option>
              <option value="unassigned">— Unassigned —</option>
              {departments
                .filter((d) => d.isActive !== false)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.en || d.name.ar}
                  </option>
                ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAIGapAnalysis}
            disabled={isAnalyzing || project.checklist.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-rose-600 to-cyan-600 text-white rounded-lg hover:from-rose-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                </svg>
                Analyzing...
              </>
            ) : (
              <>🤖 AI Gap Analysis</>
            )}
          </button>
          <button
            onClick={handleAIFlagRisks}
            disabled={isFlaggingRisks || project.checklist.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-lg hover:from-amber-700 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isFlaggingRisks ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                </svg>
                Flagging Risks...
              </>
            ) : (
              <>⚠️ AI Flag Risks</>
            )}
          </button>
          {departments.length > 0 && (
            <button
              onClick={handleAIAssignDepartments}
              disabled={isAssigningDepts || project.checklist.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAssigningDepts ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  </svg>
                  Assigning...
                </>
              ) : (
                <>🏢 AI Assign Departments</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Summary Bar */}
      {checklistStats && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("complianceProgress") || "Compliance Progress"}
            </span>
            <span className="text-sm font-bold text-brand-primary">
              {checklistStats.compliancePercent}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            {checklistStats.compliant > 0 && (
              <div
                className="bg-green-500 h-full transition-all duration-500"
                style={{
                  width: `${(checklistStats.compliant / checklistStats.total) * 100}%`,
                }}
                title={`${t("compliant")}: ${checklistStats.compliant}`}
              />
            )}
            {checklistStats.partial > 0 && (
              <div
                className="bg-yellow-400 h-full transition-all duration-500"
                style={{
                  width: `${(checklistStats.partial / checklistStats.total) * 100}%`,
                }}
                title={`${t("partiallyCompliant")}: ${checklistStats.partial}`}
              />
            )}
            {checklistStats.nonCompliant > 0 && (
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{
                  width: `${(checklistStats.nonCompliant / checklistStats.total) * 100}%`,
                }}
                title={`${t("nonCompliant")}: ${checklistStats.nonCompliant}`}
              />
            )}
            {checklistStats.notStarted > 0 && (
              <div
                className="bg-gray-400 h-full transition-all duration-500"
                style={{
                  width: `${(checklistStats.notStarted / checklistStats.total) * 100}%`,
                }}
                title={`${t("notStarted")}: ${checklistStats.notStarted}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              {t("compliant")}: {checklistStats.compliant}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
              {t("partiallyCompliant")}: {checklistStats.partial}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              {t("nonCompliant")}: {checklistStats.nonCompliant}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
              {t("notStarted")}: {checklistStats.notStarted}
            </span>
            {checklistStats.overdue > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                ⚠ {t("overdue") || "Overdue"}: {checklistStats.overdue}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Per-Department Progress Breakdown (collapsible) */}
      {departments.length > 0 &&
        project.checklist.some((i) => i.departmentId) && (
          <details className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border group">
            <summary className="p-4 cursor-pointer select-none flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              <span>🏢 Department Compliance Breakdown</span>
              <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400 group-open:hidden">
                {(() => {
                  const assigned = project.checklist.filter(
                    (i) => i.departmentId,
                  ).length;
                  const deptCount = new Set(
                    project.checklist
                      .map((i) => i.departmentId)
                      .filter(Boolean),
                  ).size;
                  return `${deptCount} depts · ${assigned} items`;
                })()}
              </span>
            </summary>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const deptMap = new Map<
                    string,
                    { total: number; compliant: number }
                  >();
                  let unassignedTotal = 0;
                  let unassignedCompliant = 0;
                  for (const item of project.checklist) {
                    if (item.departmentId) {
                      if (!deptMap.has(item.departmentId))
                        deptMap.set(item.departmentId, {
                          total: 0,
                          compliant: 0,
                        });
                      const d = deptMap.get(item.departmentId)!;
                      d.total++;
                      if (item.status === ComplianceStatus.Compliant)
                        d.compliant++;
                    } else {
                      unassignedTotal++;
                      if (item.status === ComplianceStatus.Compliant)
                        unassignedCompliant++;
                    }
                  }
                  const entries = Array.from(deptMap.entries()).map(
                    ([deptId, stats]) => {
                      const dept = departments.find((d) => d.id === deptId);
                      return {
                        name: dept ? dept.name.en || dept.name.ar : deptId,
                        ...stats,
                        deptId,
                      };
                    },
                  );
                  if (unassignedTotal > 0) {
                    entries.push({
                      name: "Unassigned",
                      total: unassignedTotal,
                      compliant: unassignedCompliant,
                      deptId: "unassigned",
                    });
                  }
                  return entries.map((e) => {
                    const pct =
                      e.total > 0
                        ? Math.round((e.compliant / e.total) * 100)
                        : 0;
                    return (
                      <button
                        key={e.deptId}
                        onClick={() => setDepartmentFilter(e.deptId)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          departmentFilter === e.deptId
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {e.name}
                          </span>
                          <span
                            className={`text-xs font-bold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {e.compliant}/{e.total} items
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </details>
        )}

      {/* Item count indicator */}
      {filteredChecklist.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>
            {t("showing") || "Showing"}{" "}
            {Math.min(visibleCount, filteredChecklist.length)} {t("of") || "of"}{" "}
            {filteredChecklist.length} {t("items") || "items"}
          </span>
          {searchTerm || statusFilter !== "all" ? (
            <span className="text-brand-primary font-medium">
              ({project.checklist.length} {t("total") || "total"})
            </span>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        {visibleChecklist.map((item) => (
          <ChecklistItemComponent
            key={item.id}
            item={item}
            project={project}
            onUpdate={(updates) => handleChecklistItemUpdate(item.id, updates)}
          />
        ))}
        {filteredChecklist.length === 0 && (
          <div className="text-center py-10">
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("noChecklistItemsFound")}
            </p>
          </div>
        )}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 text-sm font-medium bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            {t("loadMore") || "Load More"} (
            {filteredChecklist.length - visibleCount}{" "}
            {t("remaining") || "remaining"})
          </button>
        </div>
      )}

      <AISuggestionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Compliance Gap Analysis"
        content={aiModalContent}
        type="compliance-check"
      />

      {/* Department Assignment Review Modal */}
      {deptReviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500/75 dark:bg-gray-900/75"
              onClick={() => setDeptReviewOpen(false)}
            />
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏢</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      AI Department Assignment Review
                    </h3>
                    <p className="text-indigo-200 text-xs mt-0.5">
                      Review & modify assignments, then click "Apply All" to
                      save
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeptReviewOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Stats bar */}
              <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b dark:border-gray-700 flex flex-wrap gap-4 text-sm">
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                  {deptProposals.length} standard groups
                </span>
                <span className="text-green-700 dark:text-green-300">
                  ✓ {deptProposals.filter((p) => p.departmentId).length}{" "}
                  assigned
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ○ {deptProposals.filter((p) => !p.departmentId).length}{" "}
                  unassigned
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {deptProposals.reduce((sum, p) => sum + p.itemCount, 0)} total
                  checklist items
                </span>
              </div>

              {/* AI Raw Response Reference (collapsible) */}
              {aiModalContent && (
                <details className="px-6 py-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                  <summary className="cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 select-none">
                    📄 Show AI Response (reference for manual assignment)
                  </summary>
                  <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {aiModalContent}
                    </pre>
                  </div>
                </details>
              )}

              {/* Table */}
              <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-2 font-medium">Standard</th>
                      <th className="pb-2 font-medium">Sample Item</th>
                      <th className="pb-2 font-medium text-center">Items</th>
                      <th className="pb-2 font-medium">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptProposals.map((proposal) => {
                      const dept = departments.find(
                        (d) => d.id === proposal.departmentId,
                      );
                      return (
                        <tr
                          key={proposal.standardId}
                          className="border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-2.5 pr-3">
                            <span className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              {proposal.standardId}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {proposal.sample}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium">
                              {proposal.itemCount}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <select
                              value={proposal.departmentId}
                              onChange={(e) =>
                                handleProposalDeptChange(
                                  proposal.standardId,
                                  e.target.value,
                                )
                              }
                              className={`w-full p-1.5 text-xs border rounded-lg ${
                                proposal.departmentId
                                  ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                                  : "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                              }`}
                            >
                              <option value="">— Select Department —</option>
                              {departments
                                .filter((d) => d.isActive !== false)
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name.en || d.name.ar}
                                  </option>
                                ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-between items-center border-t dark:border-gray-700">
                <button
                  onClick={() => setDeptReviewOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {deptProposals.filter((p) => p.departmentId).length} of{" "}
                    {deptProposals.length} assigned
                  </span>
                  <button
                    onClick={handleApplyDeptProposals}
                    disabled={
                      isApplyingDepts ||
                      deptProposals.every((p) => !p.departmentId)
                    }
                    className="px-6 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isApplyingDepts ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
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
                        </svg>
                        Applying...
                      </>
                    ) : (
                      <>✓ Apply All Assignments</>
                    )}
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

export default ProjectChecklist;

import { ChecklistItem, ComplianceStatus, Standard } from "@/types";
import { ChecklistItemTemplate } from "@/types/templates";

export function resolveProjectStandards(records: Standard[]) {
  const groups = new Map<string, Standard[]>();
  for (const record of records) {
    const key = JSON.stringify([record.programId, record.standardId]);
    groups.set(key, [...(groups.get(key) || []), record]);
  }
  const standards: Standard[] = [];
  const conflicts: { programId: string; standardId: string }[] = [];
  const content = (record: Standard) =>
    JSON.stringify([
      record.description?.trim(),
      record.section?.trim(),
      record.criticality,
      record.version,
      record.subStandards,
    ]);
  for (const group of groups.values()) {
    if (group.some((record) => content(record) !== content(group[0]))) {
      conflicts.push({
        programId: group[0].programId,
        standardId: group[0].standardId,
      });
    } else {
      standards.push(group[0]);
    }
  }
  return { standards, conflicts };
}

export function buildProjectChecklist(
  programId: string,
  standardIds: string[],
  standards: Standard[],
  templateItems: (ChecklistItem | ChecklistItemTemplate)[],
  existingItems: ChecklistItem[] = [],
): ChecklistItem[] {
  const resolved = resolveProjectStandards(standards);
  const existingStandards = new Set(
    existingItems.map((item) => item.standardId),
  );
  const selected = [...new Set(standardIds)];
  const created = selected
    .filter((id) => !existingStandards.has(id))
    .map((id) => {
      const standard = resolved.standards.find(
        (item) => item.programId === programId && item.standardId === id,
      );
      if (!standard) throw new Error("Selected standard is unavailable");
      return {
        id: crypto.randomUUID(),
        standardId: id,
        item: standard.description,
        status: ComplianceStatus.NotStarted,
        assignedTo: "",
        dueDate: "",
        actionPlan: "",
        notes: "",
        evidenceFiles: [],
        comments: [],
      };
    });
  const templateChecklist: ChecklistItem[] = existingItems.length
    ? []
    : templateItems.map((item) => ({
        id: crypto.randomUUID(),
        standardId: "",
        item: "item" in item ? item.item : item.title,
        status: ComplianceStatus.NotStarted,
        assignedTo: "",
        dueDate: "",
        actionPlan: "",
        notes: "description" in item ? item.description : "",
        evidenceFiles: [],
        comments: [],
      }));
  return [...existingItems, ...created, ...templateChecklist];
}

export function parseProjectTimeline(text: string): {
  startDate: Date;
  endDate: Date;
} {
  const parse = (label: string) => {
    const value = text.match(
      new RegExp(`${label}:\\s*(\\d{4}-\\d{2}-\\d{2})`),
    )?.[1];
    if (!value) throw new Error("AI timeline is incomplete");
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error("AI timeline date is invalid");
    }
    return date;
  };
  const startDate = parse("START");
  const endDate = parse("END");
  if (endDate <= startDate) throw new Error("AI timeline is reversed");
  return { startDate, endDate };
}

import { AppDocument, ComplianceStatus, Project } from "@/types";

export function projectLinkedDocumentIds(project: Project): Set<string> {
  return new Set([
    ...(project.checklist || []).flatMap((item) => item.evidenceFiles || []),
    ...(project.designControls || []).flatMap(
      (control) => control.linkedDocumentIds || [],
    ),
    ...(project.pdcaCycles || []).flatMap(
      (cycle) => cycle.linkedDocumentIds || [],
    ),
    ...(project.capaReports || []).flatMap(
      (capa) => capa.linkedDocumentIds || [],
    ),
  ]);
}

export function projectDocuments(
  project: Project,
  documents: AppDocument[],
): AppDocument[] {
  const linkedIds = projectLinkedDocumentIds(project);
  return documents.filter(
    (document) =>
      (!project.organizationId ||
        document.organizationId === project.organizationId) &&
      (document.projectId === project.id || linkedIds.has(document.id)),
  );
}

export function projectEvidenceSummary(
  project: Project,
  documents: AppDocument[],
) {
  const linkedDocuments = projectDocuments(project, documents);
  const resolvedIds = new Set(linkedDocuments.map((document) => document.id));
  const applicable = (project.checklist || []).filter(
    (item) => item.status !== ComplianceStatus.NotApplicable,
  );
  return {
    documents: linkedDocuments,
    missingEvidence: applicable.filter(
      (item) => !(item.evidenceFiles || []).some((id) => resolvedIds.has(id)),
    ).length,
    unresolvedLinks: [...projectLinkedDocumentIds(project)].filter(
      (id) => !resolvedIds.has(id),
    ).length,
    unapprovedDocuments: linkedDocuments.filter(
      (document) => document.status !== "Approved",
    ).length,
  };
}

import type { AccreditationProgram, AppDocument, AuditPlan, Competency, Department, Project, Risk, Standard, TrainingProgram, User } from "@/types";
import { Action, Resource, permissionService } from "@/services/permissionService";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import { getAuthInstance } from "@/firebase/firebaseConfig";

export interface AIGroundingSource {
  ref: string;
  kind: string;
  id: string;
  organizationId: string;
  title: string;
  status?: string;
  version?: string | number;
  excerpt: string;
  excerptTruncated: boolean;
  links: { relation: string; target: string }[];
}

export interface AIGrounding {
  schema: "ai-grounding/1";
  organizationId: string;
  sources: AIGroundingSource[];
  coverage: { available: number; selected: number; omitted: number; limitations: string[] };
  search?: { query: string };
}

interface GroundingRecords {
  documents: AppDocument[];
  standards: Standard[];
  accreditationPrograms: AccreditationProgram[];
  departments: Department[];
  projects: Project[];
  risks: Risk[];
  trainingPrograms: TrainingProgram[];
  competencies: Competency[];
  auditPlans: AuditPlan[];
}

const localized = (value: { en?: string; ar?: string } | null | undefined): string =>
  [value?.en, value?.ar].filter(Boolean).join("\n");

const key = (kind: string, id: string) => `${kind}:${id}`;

export function buildAIGrounding(
  query: string,
  organizationId: string,
  records: GroundingRecords,
  canRead: (resource: Resource) => boolean,
  maxChars = 5000,
): AIGrounding {
  const sources: AIGroundingSource[] = [];
  const limits = ["Loaded records only; not an exhaustive database search.",
    "Records with unknown tenant ownership are excluded; only explicitly global reference catalogs are shared.",
    "Excerpts may omit relevant clauses. A recorded link is not proof of compliance.",
    "Only Approved document versions are authoritative local policies; other statuses are drafts or historical data.",
    "Catalog standards require verification against the applicable official edition. No clinical or accreditation certification."];
  const inScope = (record: { organizationId?: string }) =>
    !!organizationId && record.organizationId === organizationId;
  const referenceInScope = (record: { organizationId?: string; scope?: string }) =>
    !!organizationId && (inScope(record) || record.scope === "global");
  const add = (kind: string, id: string, title: string, text: string, links: AIGroundingSource["links"] = [],
    status?: string, version?: string | number) => {
    const ref = key(kind, id) + (version !== undefined ? `@v${version}` : "");
    if (!id.trim() || id.length > 500 || ref.length > 500 || /[\[\]\r\n]/.test(ref)) {
      const warning = "Records with unusable citation identifiers were excluded.";
      if (!limits.includes(warning)) limits.push(warning);
      return;
    }
    const normalized = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const excerpt = normalized.slice(0, 650);
    sources.push({ ref, kind, id, organizationId, title: title.slice(0, 500),
      status, version, excerpt, excerptTruncated: normalized.length > excerpt.length, links });
  };
  const link = (relation: string, kind: string, ids: string[] = []) =>
    ids.map(id => ({ relation, target: key(kind, id) }));
  const resolveStandards = (ids: string[] = [], programId?: string): Standard[] => {
    const catalog = records.standards.filter(referenceInScope);
    return ids.flatMap(id => {
      const exact = catalog.find(s => s.id === id);
      if (exact) return [exact];
      const matches = catalog.filter(s => s.standardId === id && (!programId || s.programId === programId));
      if (matches.length <= 1) return matches;
      const warning = "Ambiguous standard codes across programs or editions were not resolved automatically.";
      if (!limits.includes(warning)) limits.push(warning);
      return [];
    });
  };
  if (canRead(Resource.Document)) for (const d of records.documents.filter(inScope)) {
    const inline = localized(d.content).trim();
    const extraction = d.extractedText;
    const usableExtraction = extraction && (extraction.status === "extracted" || extraction.status === "truncated");
    const content = inline || (usableExtraction ? extraction.text : "");
    if (!inline && extraction) {
      const warning = usableExtraction
        ? "Attachment text is extracted, not verified against the original file; image-only content may be missing."
        : "Some attachment text could not be extracted; inspect the original files before use.";
      if (!limits.includes(warning)) limits.push(warning);
    }
    add("document", d.id, localized(d.name) || d.id, content,
      [...link("department", "department", d.departmentIds), ...link("related", "document", d.relatedDocumentIds),
        ...link("parent", "document", d.parentDocumentId ? [d.parentDocumentId] : []),
        ...link("project", "project", d.projectId ? [d.projectId] : [])],
      d.expiryDate && Date.parse(d.expiryDate) < Date.now() ? "Expired" : d.status, d.currentVersion);
    if (!inline && usableExtraction && extraction.limitations.length) {
      const source = sources.find(s => s.kind === "document" && s.id === d.id);
      if (source) source.excerptTruncated = true;
    }
  }
  if (canRead(Resource.Standard)) for (const s of records.standards.filter(referenceInScope)) {
    add("standard", s.id || s.standardId, s.standardId, `${s.description}\n${(s.subStandards || []).map(v => `${v.id}: ${v.description}`).join("\n")}`,
      [...link("program", "program", [s.programId]), ...link("document", "document", s.documentIds)], "catalog requirement", s.version);
  }
  if (canRead(Resource.Program)) for (const p of records.accreditationPrograms.filter(referenceInScope)) {
    add("program", p.id, p.name, localized(p.description), link("document", "document", p.documentIds), p.status, p.version);
  }
  if (canRead(Resource.Department)) for (const d of records.departments.filter(inScope)) {
    add("department", d.id, localized(d.name) || d.id, localized(d.description),
      [...link("requiredCompetency", "competency", d.requiredCompetencyIds),
        ...link("parentDepartment", "department", d.parentDepartmentId ? [d.parentDepartmentId] : [])]);
  }
  if (canRead(Resource.Project)) for (const p of records.projects.filter(inScope)) {
    const standardKeys = (p.standardIds || []).concat((p.checklist || []).map(c => c.standardId));
    const standardIds = resolveStandards(standardKeys, p.programId).map(s => s.id || s.standardId);
    add("project", p.id, p.name, `${p.description || ""}\n${(p.checklist || []).map(c => `${c.standardId}: ${c.item}; status=${c.status}`).join("\n")}`,
      [...link("program", "program", [p.programId]), ...link("standard", "standard", standardIds),
        ...link("department", "department", [...(p.departmentIds || []), ...(p.departmentId ? [p.departmentId] : [])])], p.status);
    for (const item of p.checklist || []) {
      const standard = resolveStandards([item.standardId], p.programId)[0];
      if (!standard) continue;
      for (const document of records.documents.filter(inScope).filter(d =>
        item.evidenceFiles?.includes(d.id) || (!!d.fileUrl && item.evidenceFiles?.includes(d.fileUrl)))) {
        const source = sources.find(s => s.kind === "document" && s.id === document.id);
        if (source) source.links.push(...link("evidenceFor", "standard", [standard.id || standard.standardId]),
          ...link("project", "project", [p.id]));
      }
    }
    if (canRead(Resource.CAPA)) for (const c of p.capaReports || []) {
      const standard = resolveStandards(c.sourceStandardId ? [c.sourceStandardId] : [], p.programId)[0];
      add("capa", c.id, c.title || `CAPA ${c.id}`, `${c.description || ""}\nRoot cause: ${c.rootCause}\nCorrective action: ${c.correctiveAction}`,
        [...link("project", "project", [p.id]), ...link("document", "document", c.linkedDocumentIds),
          ...link("standard", "standard", standard ? [standard.id || standard.standardId] : [])], c.status);
    }
    for (const cycle of p.pdcaCycles || []) {
      add("pdca", cycle.id, cycle.title, `${cycle.description || ""}\nStage: ${cycle.currentStage}\n${(cycle.actions || []).join("\n")}`,
        [...link("project", "project", [p.id]), ...link("document", "document", cycle.linkedDocumentIds),
          ...link("capa", "capa", cycle.linkedCAPAIds)], cycle.status);
    }
  }
  if (canRead(Resource.Risk)) for (const r of records.risks.filter(inScope)) {
    const standards = resolveStandards(r.affectedStandardIds);
    add("risk", r.id, r.title, `${r.description}\nMitigation: ${r.mitigationPlan}`,
      [...link("standard", "standard", standards.map(s => s.id || s.standardId)),
        ...link("department", "department", records.departments.filter(inScope).filter(d =>
          d.id === r.department || d.name?.en === r.department || d.name?.ar === r.department).map(d => d.id))], r.status);
  }
  if (canRead(Resource.Training)) {
    for (const t of records.trainingPrograms.filter(inScope)) {
      add("training", t.id, localized(t.title) || t.id, localized(t.description), [], t.isActive === false ? "inactive" : "active");
    }
    for (const c of records.competencies.filter(inScope)) {
      const standards = resolveStandards(c.relatedStandardIds);
      add("competency", c.id, localized(c.name) || c.id, localized(c.description),
        [...link("training", "training", c.relatedTrainingIds), ...link("standard", "standard", standards.map(s => s.id || s.standardId))]);
    }
  }
  if (canRead(Resource.Audit)) for (const a of records.auditPlans.filter(inScope)) {
    add("auditPlan", a.id, a.name, `${a.scope || ""}\n${a.objectives || ""}\nStandard section: ${a.standardSection}`,
      link("project", "project", [a.projectId]), a.status);
  }
  const known = new Set(sources.map(s => key(s.kind, s.id)));
  // Never disclose a relationship target whose record is not authorized/in scope.
  let relationshipsOmitted = false;
  for (const source of sources) {
    const unique = [...new Map(source.links.filter(l => known.has(l.target)).map(l => [`${l.relation}:${l.target}`, l])).values()];
    const firstByRelation = [...new Map(unique.map(l => [l.relation, l])).values()];
    const ordered = [...firstByRelation, ...unique.filter(l => !firstByRelation.includes(l))];
    source.links = ordered.slice(0, 7);
    relationshipsOmitted ||= ordered.length > source.links.length;
  }
  if (relationshipsOmitted) limits.push("Some recorded relationship targets were omitted to fit the evidence budget.");
  const stopWords = new Set(["the", "and", "for", "with", "this", "that", "only", "return", "document", "source", "content", "shall", "must", "from", "following"]);
  const tokens = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu) || [])].filter(t => !stopWords.has(t));
  const ranked = sources.map(source => {
    const identity = `${source.id} ${source.title}`.toLowerCase();
    const content = source.excerpt.toLowerCase();
    const exactId = source.id.length >= 3 && query.toLowerCase().includes(source.id.toLowerCase());
    return { source, score: tokens.reduce((n, t) => n + (identity.includes(t) ? 4 : content.includes(t) ? 1 : 0), exactId ? 20 : 0) };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.source.ref.localeCompare(b.source.ref));
  const selected = new Map<string, AIGroundingSource>();
  const candidates: AIGroundingSource[] = [];
  for (const { source } of ranked.slice(0, 3)) {
    candidates.push(source);
    for (const related of sources.filter(s => source.links.some(l => l.target === key(s.kind, s.id)) ||
      s.links.some(l => l.target === key(source.kind, source.id)))) candidates.push(related);
  }
  for (const source of [...candidates, ...ranked.map(r => r.source)]) {
    const sourceKey = key(source.kind, source.id);
    if (selected.has(sourceKey) || selected.size >= 7) continue;
    const serializedSize = (values: AIGroundingSource[]) => JSON.stringify(values)
      .replace(/[\u0080-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`).length;
    let bounded = source;
    while (bounded.excerpt.length > 80 && serializedSize([...selected.values(), bounded]) > maxChars) {
      bounded = { ...bounded, excerpt: bounded.excerpt.slice(0, Math.floor(bounded.excerpt.length / 2)), excerptTruncated: true };
    }
    if (serializedSize([...selected.values(), bounded]) <= maxChars) selected.set(sourceKey, bounded);
  }
  if (!selected.size) limits.push("No authorized matching evidence was retrieved. Do not invent organization-specific facts.");
  if (sources.some(s => s.links.length === 0)) limits.push("Some records have no authorized recorded relationships; absence of a link is not a confirmed gap.");
  return { schema: "ai-grounding/1", organizationId, sources: [...selected.values()],
    coverage: { available: sources.length, selected: selected.size, omitted: sources.length - selected.size, limitations: limits } };
}

export function getAIGrounding(query: string, maxChars = 5000): AIGrounding {
  const { currentUser } = useUserStore.getState();
  const { organizationId } = useTenantStore.getState();
  const auth = getAuthInstance().currentUser;
  const activeUser: User | null = auth && currentUser?.email === auth.email &&
    currentUser.organizationId === organizationId ? currentUser : null;
  const app = useAppStore.getState();
  const grounding = buildAIGrounding(query, organizationId || "", {
    documents: app.documents || [], standards: app.standards || [], accreditationPrograms: app.accreditationPrograms || [],
    departments: app.departments || [], projects: useProjectStore.getState().projects || [], risks: app.risks || [],
    trainingPrograms: app.trainingPrograms || [], competencies: app.competencies || [], auditPlans: app.auditPlans || [],
  }, resource => permissionService.can(activeUser, Action.Read, resource), maxChars);
  if (activeUser && query.trim()) grounding.search = { query: query.slice(0, 2000) };
  return grounding;
}

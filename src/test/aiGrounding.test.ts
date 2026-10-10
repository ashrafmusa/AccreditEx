import { buildAIGrounding } from "@/services/aiGroundingService";
import { Resource } from "@/services/permissionService";
import type { AppDocument, Project } from "@/types";

const documentRecord = (id: string, organizationId = "org-a"): AppDocument => ({
  id, organizationId, name: { en: "Specimen collection policy", ar: "" }, type: "Policy",
  isControlled: true, status: "Approved", content: { en: "Use the approved laboratory procedure.", ar: "" },
  currentVersion: 2, uploadedAt: "2026-10-10", departmentIds: ["lab"],
});
const snapshot = (): Parameters<typeof buildAIGrounding>[2] => ({
  documents: [documentRecord("policy"), documentRecord("foreign-policy", "org-b")],
  standards: [{ id: "std-id", organizationId: "org-a", standardId: "LAB.1", description: "Specimen identification",
    programId: "program", section: "Laboratory", documentIds: ["policy"], version: "2026" }],
  accreditationPrograms: [{ id: "program", organizationId: "org-a", name: "Laboratory accreditation", description: { en: "Program", ar: "" } }],
  departments: [{ id: "lab", organizationId: "org-a", name: { en: "Laboratory", ar: "" } }],
  projects: [], risks: [], trainingPrograms: [], competencies: [], auditPlans: [],
});

describe("Permission-aware AI evidence retrieval", () => {
  it("includes explicitly global reference catalogs but not unscoped legacy references", () => {
    // Arrange
    const records = snapshot();
    records.standards.push({ id: "global", standardId: "LAB.2", scope: "global", programId: "program", section: "Lab", description: "Specimen labels" });
    records.standards.push({ id: "unknown", standardId: "LAB.3", programId: "program", section: "Lab", description: "Specimen labels" });
    // Act
    const result = buildAIGrounding("LAB.2 Specimen", "org-a", records, () => true);
    // Assert
    expect(result.sources.some(s => s.id === "global")).toBe(true);
    expect(result.sources.some(s => s.id === "unknown")).toBe(false);
  });

  it("retrieves recorded document-standard-department relationships with versioned citations", () => {
    // Arrange / Act
    const result = buildAIGrounding("policy", "org-a", snapshot(), () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "document")?.ref).toBe("document:policy@v2");
    expect(result.sources.find(s => s.kind === "standard")?.links).toContainEqual({ relation: "document", target: "document:policy" });
    expect(result.sources.find(s => s.kind === "document")?.links).toContainEqual({ relation: "department", target: "department:lab" });
    expect(result.sources.every(s => s.organizationId === "org-a")).toBe(true);
    expect(JSON.stringify(result)).not.toContain("foreign-policy");
  });

  it("excludes unknown ownership, foreign tenants, and unavailable permissions", () => {
    // Arrange
    const records = snapshot();
    records.documents.push({ ...documentRecord("legacy"), organizationId: undefined });
    // Act
    const result = buildAIGrounding("Specimen", "org-a", records, r => r !== Resource.Document);
    // Assert
    expect(result.sources.some(s => s.kind === "document")).toBe(false);
    expect(result.sources.flatMap(s => s.links).some(l => l.target.startsWith("document:"))).toBe(false);
    expect(JSON.stringify(result)).not.toContain("legacy");
    expect(buildAIGrounding("Specimen", "", records, () => true).sources).toEqual([]);
  });

  it("makes no-source and partial-retrieval limits explicit", () => {
    // Arrange / Act
    const empty = buildAIGrounding("unrelated-unique-query", "org-a", snapshot(), () => true);
    const partial = buildAIGrounding("Specimen", "org-a", snapshot(), () => true, 650);
    // Assert
    expect(empty.sources).toEqual([]);
    expect(empty.coverage.limitations.join(" ")).toContain("No authorized matching evidence");
    expect(JSON.stringify(partial.sources).length).toBeLessThanOrEqual(650);
    expect(partial.coverage.omitted).toBeGreaterThan(0);
  });

  it("does not infer document-standard links from similar text", () => {
    // Arrange
    const records = snapshot();
    records.standards[0].documentIds = [];
    // Act
    const result = buildAIGrounding("Specimen", "org-a", records, () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "standard")?.links).not.toContainEqual({ relation: "document", target: "document:policy" });
  });

  it("preserves draft status and discloses clipped source excerpts", () => {
    // Arrange
    const records = snapshot();
    records.documents[0].status = "Draft";
    records.documents[0].content = { en: "Specimen ".repeat(200), ar: "" };
    // Act
    const result = buildAIGrounding("policy", "org-a", records, () => true);
    const source = result.sources.find(s => s.kind === "document");
    // Assert
    expect(source?.status).toBe("Draft");
    expect(source?.excerptTruncated).toBe(true);
    expect(result.coverage.limitations.join(" ")).toContain("Only Approved");
  });

  it("resolves project checklist standard codes to recorded standards", () => {
    // Arrange
    const records = snapshot();
    const project: Project = { id: "project", organizationId: "org-a", name: "Specimen project", programId: "program",
      status: "In Progress", progress: 0, startDate: "", createdAt: "", updatedAt: "", departmentId: "lab",
      checklist: [{ id: "item", standardId: "LAB.1", item: "Specimen labels", status: "Not Started",
        assignedTo: "", dueDate: "", actionPlan: "", notes: "", evidenceFiles: [], comments: [] }] };
    records.projects = [project];
    // Act
    const result = buildAIGrounding("project", "org-a", records, () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "project")?.links).toContainEqual({ relation: "standard", target: "standard:std-id" });
  });

  it("retrieves Arabic evidence without treating document instructions as executable", () => {
    // Arrange
    const records = snapshot();
    records.documents[0].name = { en: "", ar: "سياسة العينات" };
    records.documents[0].content = { en: "", ar: "تحقق من هوية العينة." };
    // Act
    const result = buildAIGrounding("العينات", "org-a", records, () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "document")?.excerpt).toBe("تحقق من هوية العينة.");
  });

  it("uses extracted attachment text only when editable content is absent", () => {
    // Arrange
    const records = snapshot();
    records.documents[0].content = { en: "", ar: "" };
    records.documents[0].extractedText = {
      sourceFileName: "policy.pdf", text: "Specimen review excerpt.", status: "truncated",
      extractedAt: "", pagesProcessed: 50, totalPages: 80, limitations: ["pageLimit"],
    };
    // Act
    const extracted = buildAIGrounding("policy", "org-a", records, () => true);
    records.documents[0].content = { en: "Editable policy content.", ar: "" };
    const inline = buildAIGrounding("policy", "org-a", records, () => true);
    // Assert
    expect(extracted.sources.find(s => s.kind === "document")?.excerpt).toBe("Specimen review excerpt.");
    expect(extracted.sources.find(s => s.kind === "document")?.excerptTruncated).toBe(true);
    expect(extracted.coverage.limitations.join(" ")).toContain("not verified against the original file");
    expect(inline.sources.find(s => s.kind === "document")?.excerpt).toBe("Editable policy content.");
  });

  it("withholds ambiguous standard code links across editions", () => {
    // Arrange
    const records = snapshot();
    records.standards.push({ ...records.standards[0], id: "other-edition", version: "2" });
    records.projects = [{ id: "project", organizationId: "org-a", name: "Specimen project", programId: "program",
      status: "In Progress", progress: 0, startDate: "", createdAt: "", updatedAt: "",
      checklist: [], standardIds: ["LAB.1"] }];
    // Act
    const result = buildAIGrounding("project", "org-a", records, () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "project")?.links.some(l => l.relation === "standard")).toBe(false);
    expect(result.coverage.limitations.join(" ")).toContain("Ambiguous standard codes");
  });

  it("links checklist evidence without exposing attachment URLs", () => {
    // Arrange
    const records = snapshot();
    records.documents[0].fileUrl = "https://example.invalid/private-attachment";
    records.projects = [{ id: "project", organizationId: "org-a", name: "Specimen project", programId: "program",
      status: "In Progress", progress: 0, startDate: "", createdAt: "", updatedAt: "",
      checklist: [{ id: "item", standardId: "LAB.1", item: "Specimen labels", status: "Not Started",
        assignedTo: "", dueDate: "", actionPlan: "", notes: "",
        evidenceFiles: [records.documents[0].fileUrl], comments: [] }] }];
    // Act
    const result = buildAIGrounding("policy", "org-a", records, () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "document")?.links).toContainEqual({
      relation: "evidenceFor", target: "standard:std-id",
    });
    expect(JSON.stringify(result)).not.toContain("https://example.invalid");
  });

  it("budgets Arabic evidence using escaped serialization without dropping all source content", () => {
    // Arrange
    const records = snapshot();
    records.documents[0].name = { en: "", ar: "سياسة العينات" };
    records.documents[0].content = { en: "", ar: "تحقق من هوية العينة. ".repeat(100) };
    // Act
    const result = buildAIGrounding("العينات", "org-a", records, () => true, 2500);
    const encoded = JSON.stringify(result.sources).replace(/[\u0080-\uFFFF]/g, char =>
      `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
    // Assert
    expect(result.sources.find(s => s.kind === "document")?.excerpt.length).toBeGreaterThan(0);
    expect(encoded.length).toBeLessThanOrEqual(2500);
  });

  it("does not present expired approved documents as current policies", () => {
    // Arrange
    const records = snapshot();
    records.documents[0].expiryDate = "2000-01-01";
    // Act
    const result = buildAIGrounding("policy", "org-a", records, () => true);
    // Assert
    expect(result.sources.find(s => s.kind === "document")?.status).toBe("Expired");
  });

  it("bounds large project relationship lists and preserves distinct relationship types", () => {
    // Arrange
    const records = snapshot();
    records.standards = Array.from({ length: 50 }, (_, index) => ({
      id: `std-${index}`, organizationId: "org-a", standardId: `LAB.${index}`,
      description: "Laboratory requirement", programId: "program", section: "Lab",
    }));
    records.projects = [{ id: "large-project", organizationId: "org-a", name: "Laboratory project", programId: "program",
      status: "In Progress", progress: 0, startDate: "", createdAt: "", updatedAt: "", departmentId: "lab",
      checklist: [], standardIds: records.standards.map(s => s.id || s.standardId) }];
    // Act
    const result = buildAIGrounding("large-project", "org-a", records, () => true);
    const project = result.sources.find(s => s.kind === "project");
    // Assert
    expect(project?.links.length).toBeLessThanOrEqual(7);
    expect(project?.links).toContainEqual({ relation: "program", target: "program:program" });
    expect(project?.links).toContainEqual({ relation: "department", target: "department:lab" });
    expect(result.coverage.limitations.join(" ")).toContain("relationship targets were omitted");
  });
});

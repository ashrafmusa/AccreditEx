import {
  resolveOhasSmcsProgram,
  seedOhasSmcsProjects,
  hasOhasSmcsProjects,
} from "@/services/ohasService";
import { getAccreditationPrograms } from "@/services/accreditationProgramService";
import { getStandards } from "@/services/standardService";
import { createProject, getProjects } from "@/services/projectService";
import smcs from "@/data/smcsStandards.json";
import type { AccreditationProgram, Project, Standard } from "@/types";
import { ProjectStatus } from "@/types";

jest.mock("@/services/accreditationProgramService", () => ({
  getAccreditationPrograms: jest.fn(),
}));
jest.mock("@/services/standardService", () => ({ getStandards: jest.fn() }));
jest.mock("@/services/projectService", () => ({
  createProject: jest.fn(),
  getProjects: jest.fn(),
}));

const program: AccreditationProgram = {
  id: "real-ohas",
  name: "OHAS",
  scope: "global",
  description: { en: "OHAS", ar: "OHAS" },
};
const standards: Standard[] = smcs.map((standard) => ({
  standardId: standard.standardId,
  section: standard.section,
  description: standard.description,
  programId: program.id,
  scope: "global",
}));
const legacy = {
  id: "p1",
  name: "SMCS — Laboratory Services",
  programId: "prog-ohap",
  organizationId: "org-a",
  standardIds: ["OHAS.SMCS.17"],
  checklist: [{ standardId: "OHAS.SMCS.17" }],
};
const { planReconciliation } =
  require("../../scripts/migrations/reconcile-smcs-program.cjs") as {
    planReconciliation: (
      program: AccreditationProgram,
      storedStandards: Standard[],
      projects: (typeof legacy)[],
      organizationId: string,
    ) => { id: string; from: string; to: string }[];
  };

describe("SMCS program reconciliation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAccreditationPrograms).mockResolvedValue([program]);
    jest.mocked(getStandards).mockResolvedValue(standards);
    jest.mocked(getProjects).mockResolvedValue([]);
    jest
      .mocked(createProject)
      .mockImplementation(async (data) => ({ ...data, id: "created" }));
  });

  it("resolves complete coverage rather than program names or dataset legacy IDs", () => {
    // Arrange
    const misleading = { ...program, id: "other", name: "OHAS" };
    // Act
    const resolved = resolveOhasSmcsProgram([misleading, program], standards);
    // Assert
    expect(resolved?.id).toBe(program.id);
    expect(
      resolveOhasSmcsProgram(
        [program],
        standards.filter((s) => s.standardId !== "OHAS.SMCS.17"),
      ),
    ).toBeNull();
    expect(
      resolveOhasSmcsProgram([{ ...program, status: "retired" }], standards),
    ).toBeNull();
    expect(resolveOhasSmcsProgram([{ ...program, status: "pending" }], standards)).toBeNull();
    expect(
      resolveOhasSmcsProgram(
        [program, misleading],
        [...standards, ...standards.map((s) => ({ ...s, programId: "other" }))],
      ),
    ).toBeNull();
  });

  it("seeds all fourteen departments using the validated real program ID", async () => {
    // Act
    const result = await seedOhasSmcsProjects(program.id);
    // Assert
    expect(result).toMatchObject({ created: 14, skipped: 0, errors: [] });
    expect(createProject).toHaveBeenCalledTimes(14);
    const created = jest.mocked(createProject).mock.calls.map(([data]) => data);
    expect(created.every((data) => data.programId === program.id)).toBe(true);
    expect(
      created.find((data) => data.name === legacy.name)?.checklist,
    ).toHaveLength(80);
  });

  it("rejects stale program selection and already-reconciled projects before writing", async () => {
    // Act / Assert
    await expect(seedOhasSmcsProjects("prog-ohap")).rejects.toThrow(
      "one active",
    );
    expect(createProject).not.toHaveBeenCalled();
    // Arrange
    const existing: Project = {
      ...legacy,
      programId: program.id,
      checklist: [],
      status: ProjectStatus.Open,
      startDate: "",
      progress: 0,
      createdAt: "",
      updatedAt: "",
    };
    jest.mocked(getProjects).mockResolvedValue([existing]);
    // Act / Assert
    await expect(seedOhasSmcsProjects(program.id)).rejects.toThrow(
      "already exist",
    );
    expect(createProject).not.toHaveBeenCalled();
    expect(hasOhasSmcsProjects([legacy])).toBe(true);
    expect(hasOhasSmcsProjects([{ ...legacy, programId: program.id }])).toBe(
      true,
    );
  });

  it("plans only legacy SMCS projects owned by the explicit organization without mutating data", () => {
    // Arrange
    const projects = [
      legacy,
      { ...legacy, id: "foreign", organizationId: "org-b" },
      { ...legacy, id: "repaired", programId: program.id },
      { ...legacy, id: "unrelated", name: "Other project" },
    ];
    const before = JSON.stringify(projects);
    // Act
    const plan = planReconciliation(program, standards, projects, "org-a");
    // Assert
    expect(plan).toEqual([{ id: "p1", from: "prog-ohap", to: program.id }]);
    expect(JSON.stringify(projects)).toBe(before);
  });

  it("blocks reconciliation with foreign programs, missing coverage, or unexpected checklist references", () => {
    // Act / Assert
    expect(() =>
      planReconciliation(
        { ...program, scope: "tenant", organizationId: "org-b" },
        standards,
        [legacy],
        "org-a",
      ),
    ).toThrow("not shared");
    expect(() =>
      planReconciliation(
        program,
        standards.filter((s) => s.standardId !== "OHAS.SMCS.17"),
        [legacy],
        "org-a",
      ),
    ).toThrow("every SMCS");
    expect(() =>
      planReconciliation(
        program,
        standards,
        [{ ...legacy, checklist: [{ standardId: "OTHER.1" }] }],
        "org-a",
      ),
    ).toThrow("unexpected");
    expect(
      planReconciliation(
        program,
        standards,
        [{ ...legacy, programId: program.id }],
        "org-a",
      ),
    ).toEqual([]);
  });
});

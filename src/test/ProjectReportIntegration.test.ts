import { generateAIComplianceReport } from "@/services/reportService";
import { aiAgentService } from "@/services/aiAgentService";
import { generatePDFReport } from "@/services/pdfReportGenerator";
import { addDoc } from "firebase/firestore";
import { cloudinaryService } from "@/services/cloudinaryService";
import { Project, ProjectStatus } from "@/types";

jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: { chat: jest.fn() },
}));
jest.mock("@/services/pdfReportGenerator", () => ({
  generatePDFReport: jest.fn(),
  downloadPDF: jest.fn(),
}));
jest.mock("@/services/freeTierMonitor", () => ({
  freeTierMonitor: { recordWrite: jest.fn() },
}));
jest.mock("@/utils/tenantQuery", () => ({
  getTenantStamp: () => ({ organizationId: "org-a" }),
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(),
  Timestamp: { now: () => "timestamp" },
}));

const project: Project = {
  id: "p1",
  organizationId: "org-a",
  name: "Laboratory",
  programId: "ohas",
  departmentIds: ["lab"],
  status: ProjectStatus.InProgress,
  startDate: "",
  progress: 0,
  checklist: [],
  createdAt: "",
  updatedAt: "",
};
describe("Connected project reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(aiAgentService.chat)
      .mockResolvedValue({
        response: "## Executive Summary\nReview laboratory controls.",
      } as Awaited<ReturnType<typeof aiAgentService.chat>>);
    jest.mocked(generatePDFReport).mockResolvedValue(new Blob(["PDF"]));
    jest
      .mocked(cloudinaryService.uploadDocument)
      .mockResolvedValue("https://example.com/report.pdf");
    jest
      .mocked(addDoc)
      .mockResolvedValue({ id: "report1" } as Awaited<
        ReturnType<typeof addDoc>
      >);
  });
  it("uses authenticated contextual AI and saves a tenant/project/department-linked report", async () => {
    // Arrange / Act
    const report = await generateAIComplianceReport({
      projectId: project.id,
      project,
      reportType: "complianceSummary",
      userName: "Reviewer",
    });
    // Assert
    expect(aiAgentService.chat).toHaveBeenCalledWith(
      expect.stringContaining("not accreditation certification"),
      true,
    );
    expect(report).toMatchObject({
      id: "report1",
      organizationId: "org-a",
      projectId: "p1",
      departmentIds: ["lab"],
      type: "Report",
      status: "Draft",
    });
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ projectId: "p1", organizationId: "org-a" }),
    );
  });
  it("does not create a success-shaped template report when AI fails", async () => {
    // Arrange
    jest
      .mocked(aiAgentService.chat)
      .mockRejectedValue(new Error("AI unavailable"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    // Act / Assert
    await expect(
      generateAIComplianceReport({
        projectId: project.id,
        project,
        reportType: "complianceSummary",
        userName: "Reviewer",
      }),
    ).rejects.toThrow("AI unavailable");
    expect(generatePDFReport).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

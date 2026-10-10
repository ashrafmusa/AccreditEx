import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DocumentControlHubPage from "@/pages/DocumentControlHubPage";
import {
  AppDocument,
  ComplianceStatus,
  Project,
  ProjectStatus,
  UserRole,
} from "@/types";
import { en } from "@/data/locales/en/projects";

const project: Project = {
  id: "p1",
  name: "Laboratory",
  organizationId: "org-a",
  programId: "ohas",
  status: ProjectStatus.InProgress,
  startDate: "",
  progress: 0,
  createdAt: "",
  updatedAt: "",
  checklist: [
    {
      id: "c1",
      standardId: "L.1",
      item: "Control",
      status: ComplianceStatus.NotStarted,
      evidenceFiles: ["linked"],
      comments: [],
      assignedTo: "",
      dueDate: "",
      actionPlan: "",
      notes: "",
    },
  ],
};
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => ({ projects: [project] }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    lang: "en",
    t: (key: string, params?: Record<string, string | number>) => {
      const messages: Record<string, unknown> = en;
      return Object.entries(params || {}).reduce(
        (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
        typeof messages[key] === "string" ? messages[key] : key,
      );
    },
  }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ error: jest.fn(), success: jest.fn() }),
}));
jest.mock("@/components/common/ContextualHelp", () => ({
  ContextualHelp: () => null,
}));
jest.mock("@/components/common/RestrictedFeatureIndicator", () => () => null);
jest.mock("@/components/documents/DocumentGapFiller", () => () => null);
jest.mock("@/components/documents/DocumentSidebar", () => () => null);
jest.mock("@/components/documents/DocumentSearch", () => () => null);
jest.mock(
  "@/components/documents/ControlledDocumentsTable",
  () => (props: { documents: AppDocument[] }) => (
    <div data-testid="records">
      {props.documents.map((doc) => (
        <p key={doc.id}>{doc.id}</p>
      ))}
    </div>
  ),
);
jest.mock("@/services/complianceDashboardService", () => ({
  getComplianceDashboard: jest.fn(),
}));

const doc = (
  id: string,
  overrides: Partial<AppDocument> = {},
): AppDocument => ({
  id,
  organizationId: "org-a",
  name: { en: id, ar: id },
  type: "Evidence",
  status: "Approved",
  isControlled: true,
  content: { en: "", ar: "" },
  uploadedAt: "2026-10-01",
  currentVersion: 1,
  versionHistory: [],
  ...overrides,
});

it("filters Document Control by actual project links including legacy uncontrolled evidence, and clears scope", () => {
  // Arrange
  const navigate = jest.fn();
  const props = {
    documents: [
      doc("linked", { isControlled: false }),
      doc("direct", { projectId: "p1" }),
      doc("other"),
      doc("foreign", { projectId: "p1", organizationId: "org-b" }),
    ],
    standards: [],
    departments: [],
    currentUser: {
      id: "u1",
      name: "Admin",
      email: "admin@example.com",
      organizationId: "org-a",
      role: UserRole.Admin,
    },
    setNavigation: navigate,
    onUpdateDocument: jest.fn(),
    onCreateDocument: jest.fn(),
    onAddProcessMap: jest.fn(),
    onDeleteDocument: jest.fn(),
    onApproveDocument: jest.fn(),
  };
  const view = render(
    <DocumentControlHubPage
      {...props}
      navigation={{ view: "documentControl", filter: "project:p1" }}
    />,
  );
  // Assert
  expect(screen.getByTestId("records")).toHaveTextContent("linked");
  expect(screen.getByTestId("records")).toHaveTextContent("direct");
  expect(screen.getByTestId("records")).not.toHaveTextContent("other");
  expect(screen.getByTestId("records")).not.toHaveTextContent("foreign");
  // Act
  fireEvent.click(
    screen.getByRole("button", { name: en.projectBackToWorkspace }),
  );
  expect(navigate).toHaveBeenCalledWith({
    view: "projectDetail",
    projectId: "p1",
  });
  fireEvent.click(
    screen.getByRole("button", { name: en.projectClearDocumentScope }),
  );
  expect(navigate).toHaveBeenCalledWith({ view: "documentControl" });
  view.rerender(
    <DocumentControlHubPage
      {...props}
      navigation={{ view: "documentControl" }}
    />,
  );
  // Assert
  expect(screen.getByTestId("records")).toHaveTextContent("other");
  expect(screen.getByTestId("records")).not.toHaveTextContent("linked");
});

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuditLogComponent from "@/components/audits/AuditLogComponent";
import AuditHubPage from "@/pages/AuditHubPage";
import {
  getRecentActivityLogs,
  getProjectActivityLogs,
} from "@/services/activityLogService";
import { en } from "@/data/locales/en/common";
import { ar } from "@/data/locales/ar/common";
import { Project, ProjectStatus } from "@/types";

let language: "en" | "ar" = "en";
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    lang: language,
    t: (key: string) => {
      const messages: Record<string, unknown> = language === "en" ? en : ar;
      return typeof messages[key] === "string" ? messages[key] : key;
    },
  }),
}));
jest.mock("@/services/activityLogService", () => ({
  getRecentActivityLogs: jest.fn(),
  getProjectActivityLogs: jest.fn(),
}));
jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => ({ auditPlans: [] }),
}));
jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => ({ projects: [] }),
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => ({ users: [] }),
}));
jest.mock("@/services/aiAgentService", () => ({ aiAgentService: {} }));
jest.mock("@/components/ai/AISuggestionModal", () => () => null);
jest.mock("@/components/audits/AuditPlanModal", () => () => null);

const project: Project = {
  id: "p1",
  name: "Lab",
  programId: "ohas",
  status: ProjectStatus.InProgress,
  startDate: "2026-10-01",
  progress: 0,
  checklist: [],
  createdAt: "",
  updatedAt: "",
};

describe("Audit log loading states", () => {
  beforeEach(() => {
    language = "en";
    jest.clearAllMocks();
  });

  it.each(["project", "hub"] as const)(
    "shows errors rather than empty success and supports retry in the %s log",
    async (surface) => {
      // Arrange
      jest
        .mocked(
          surface === "hub" ? getRecentActivityLogs : getProjectActivityLogs,
        )
        .mockRejectedValueOnce(new Error("Missing index"))
        .mockResolvedValueOnce([
          {
            id: "log1",
            timestamp: "2026-10-10T09:00:00Z",
            user: "Alya",
            action: { en: "Reviewed evidence", ar: "مراجعة الأدلة" },
          },
        ]);
      const errorLog = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      if (surface === "hub") {
        render(<AuditHubPage setNavigation={jest.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "auditLog" }));
      } else {
        render(<AuditLogComponent project={project} />);
      }
      // Assert
      expect(await screen.findByRole("alert")).toHaveTextContent(
        en.auditLogLoadFailed,
      );
      expect(screen.queryByText("noActivity")).not.toBeInTheDocument();
      // Act
      fireEvent.click(screen.getByRole("button", { name: en.auditLogRetry }));
      // Assert
      expect(await screen.findByText("Reviewed evidence")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      errorLog.mockRestore();
    },
  );

  it("does not announce an empty project log while a request is pending", async () => {
    // Arrange
    let finish: (
      logs: Awaited<ReturnType<typeof getRecentActivityLogs>>,
    ) => void = () => {};
    jest.mocked(getProjectActivityLogs).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<AuditLogComponent project={project} />);
    // Assert
    expect(screen.queryByText("noActivity")).not.toBeInTheDocument();
    // Act
    finish([]);
    // Assert
    await waitFor(() =>
      expect(screen.getByText("noActivity")).toBeInTheDocument(),
    );
  });

  it("provides Arabic error guidance and retry labels", async () => {
    // Arrange
    language = "ar";
    jest
      .mocked(getProjectActivityLogs)
      .mockRejectedValue(new Error("Missing index"));
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    // Act
    render(<AuditLogComponent project={project} />);
    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent(
      ar.auditLogLoadFailed,
    );
    expect(
      screen.getByRole("button", { name: ar.auditLogRetry }),
    ).toBeInTheDocument();
    errorLog.mockRestore();
  });
});

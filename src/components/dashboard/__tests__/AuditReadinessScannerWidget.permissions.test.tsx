import { render, screen } from "@testing-library/react";
import React from "react";
import AuditReadinessScannerWidget from "../AuditReadinessScannerWidget";

const mockUseProjectStore = jest.fn();
const mockUseAppStore = jest.fn();
const mockUseTenantStore = jest.fn();
const mockUseUserStore = jest.fn();

jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => mockUseProjectStore(),
}));

jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => mockUseAppStore(),
}));

jest.mock("@/stores/useTenantStore", () => ({
  useTenantStore: () => mockUseTenantStore(),
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => mockUseUserStore(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ lang: "en" }),
}));

jest.mock("@/services/facilityProvisioningService", () => ({
  provisionFacilityWorkspace: jest.fn(),
}));

describe("AuditReadinessScannerWidget provisioning access", () => {
  beforeEach(() => {
    mockUseProjectStore.mockReturnValue({ projects: [] });
    mockUseAppStore.mockReturnValue({
      documents: [],
      risks: [],
      auditPlans: [],
      departments: [],
      trainingPrograms: [],
    });
    mockUseTenantStore.mockReturnValue({ currentOrganization: null });
  });

  it.each(["Admin", "ProjectLead"])(
    "shows the starter blueprint action to %s users in an empty workspace",
    (role) => {
      mockUseUserStore.mockReturnValue({
        currentUser: { id: "user-1", role, name: "Alya" },
      });

      render(<AuditReadinessScannerWidget setNavigation={jest.fn()} />);

      expect(
        screen.getByRole("button", {
          name: "Provision Starter Facility Blueprint",
        }),
      ).toBeInTheDocument();
    },
  );

  it.each(["TeamMember", "Auditor", "Viewer"])(
    "hides the starter blueprint action from %s users",
    (role) => {
      mockUseUserStore.mockReturnValue({
        currentUser: { id: "user-1", role, name: "Alya" },
      });

      render(<AuditReadinessScannerWidget setNavigation={jest.fn()} />);

      expect(
        screen.queryByRole("button", {
          name: "Provision Starter Facility Blueprint",
        }),
      ).not.toBeInTheDocument();
    },
  );

  it("hides the starter blueprint action from inactive admins", () => {
    mockUseUserStore.mockReturnValue({
      currentUser: {
        id: "user-1",
        role: "Admin",
        name: "Alya",
        isActive: false,
      },
    });

    render(<AuditReadinessScannerWidget setNavigation={jest.fn()} />);

    expect(
      screen.queryByRole("button", {
        name: "Provision Starter Facility Blueprint",
      }),
    ).not.toBeInTheDocument();
  });
});

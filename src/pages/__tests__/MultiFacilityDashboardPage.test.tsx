import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import MultiFacilityDashboardPage from "../MultiFacilityDashboardPage";
import { getOrganizationFacilityReport } from "@/services/multiFacilityService";

const mockTenantState = {
  organizationId: "org-1",
  currentOrganization: { name: "Test Organization" },
};

jest.mock("@/components/common/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light" }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        multiFacilityDashboard: "Multi-Facility Dashboard",
        multiFacilitySubtitle: "Facility overview",
        multiFacilityNoBranches: "No facility branches found.",
        multiFacilityNoBranchesHint: "Add branches to see analytics.",
        multiFacilityError: "Failed to load facility data.",
        mfNoOrganization: "Select an organization.",
        mfRefresh: "Refresh",
        mfSortByCompliance: "Sort by Compliance",
        mfSortByName: "Sort by Name",
        mfFacilities: "Facilities",
        mfAvgCompliance: "Avg. Compliance",
        mfOpenFindings: "Open Findings",
        mfTopPerformer: "Top Performer",
        mfBenchmarkLine: "Org Benchmark",
        mfComplianceByFacility: "Compliance by Facility",
        mfFacilityName: "Facility",
        mfStatusBreakdown: "Status Breakdown",
        mfLocation: "Location",
        mfActiveProjects: "Active Projects",
        mfComplianceRate: "Compliance Rate",
        mfLastUpdated: "Last Updated",
        mfNoData: "No data available",
        mfCompliant: "Compliant",
        mfPartial: "Partial",
        mfNonCompliant: "Non-Compliant",
      })[key] ?? key,
  }),
}));

jest.mock("@/stores/useTenantStore", () => ({
  useTenantStore: () => mockTenantState,
}));

jest.mock("@/services/multiFacilityService", () => ({
  getOrganizationFacilityReport: jest.fn(),
}));

jest.mock("@/components/icons", () => ({
  ArrowPathIcon: () => <span aria-hidden="true" />,
  BuildingOffice2Icon: () => <span aria-hidden="true" />,
  ChartBarIcon: () => <span aria-hidden="true" />,
  ExclamationTriangleIcon: () => <span aria-hidden="true" />,
  MapPinIcon: () => <span aria-hidden="true" />,
}));

jest.mock("recharts", () => {
  const React = jest.requireActual("react");
  const container = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children);
  return {
    Bar: container,
    BarChart: container,
    CartesianGrid: container,
    Cell: () => null,
    ReferenceLine: container,
    ResponsiveContainer: container,
    Tooltip: () => null,
    XAxis: container,
    YAxis: container,
  };
});

const report = {
  organizationId: "org-1",
  organizationName: "Test Organization",
  branches: [],
  facilityMetrics: [],
  averageCompliance: 0,
  topPerformerName: null,
  needsAttentionName: null,
  totalOpenFindings: 0,
  generatedAt: "2026-10-12T00:00:00.000Z",
};

describe("MultiFacilityDashboardPage", () => {
  const getReportMock = jest.mocked(getOrganizationFacilityReport);

  beforeEach(() => {
    jest.clearAllMocks();
    getReportMock.mockResolvedValue(report);
  });

  it("shows a real empty state instead of fabricated facility metrics", async () => {
    render(<MultiFacilityDashboardPage />);

    expect(
      await screen.findByText("No facility branches found."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add branches to see analytics."),
    ).toBeInTheDocument();
    expect(screen.queryByText("North Lab Center")).not.toBeInTheDocument();
    expect(screen.queryByText("77%")).not.toBeInTheDocument();
  });

  it("retries loading the facility report when refresh is selected", async () => {
    render(<MultiFacilityDashboardPage />);

    await screen.findByText("No facility branches found.");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(getReportMock).toHaveBeenCalledTimes(2));
  });

  it("surfaces loading errors and offers a retry", async () => {
    getReportMock.mockRejectedValueOnce(new Error("network unavailable"));
    render(<MultiFacilityDashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load facility data.",
    );
    fireEvent.click(
      within(screen.getByRole("alert")).getByRole("button", {
        name: "Refresh",
      }),
    );

    await waitFor(() => expect(getReportMock).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("No facility branches found."),
    ).toBeInTheDocument();
  });
});

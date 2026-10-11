import { fireEvent, render, screen } from "@testing-library/react";

import IQCWestgardTab from "@/components/lab-ops/IQCWestgardTab";
import type { ToastContextType } from "@/hooks/useToast";
import type { LabOpsState } from "@/stores/useLabOpsStore";
import { useLabOpsStore } from "@/stores/useLabOpsStore";

const mockToastActions = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  custom: jest.fn(),
  showToast: jest.fn(),
};
const mockToast: ToastContextType = {
  ...mockToastActions,
  toast: undefined as unknown as ToastContextType,
};
mockToast.toast = mockToast;

jest.mock("@/hooks/useToast", () => ({
  useToast: () => mockToast,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: "en",
    dir: "ltr",
  }),
}));

jest.mock("@/components/ai/AISuggestionModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/services/aiAgentService", () => ({
  aiAgentService: {
    chat: jest.fn(),
  },
}));
jest.mock("@/stores/useTenantStore", () => ({
  useTenantStore: Object.assign(
    (selector: (state: { organizationId: string }) => unknown) => selector({ organizationId: "org-a" }),
    { getState: () => ({ organizationId: "org-a" }) },
  ),
}));
jest.mock("@/stores/useUserStore", () => ({
  useUserStore: (selector: (state: { users: object[] }) => unknown) => selector({
    users: [{ id: "qa-user", name: "QA User", email: "qa@example.test", organizationId: "org-a" }],
  }),
}));

const initialDataState = {
  equipment: JSON.parse(JSON.stringify(useLabOpsStore.getState().equipment)),
  calibrations: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().calibrations),
  ),
  maintenanceLogs: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().maintenanceLogs),
  ),
  reagents: JSON.parse(JSON.stringify(useLabOpsStore.getState().reagents)),
  reagentUsageLogs: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().reagentUsageLogs),
  ),
  proficiencyTests: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().proficiencyTests),
  ),
  qualityEvents: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().qualityEvents),
  ),
  capaRecords: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().capaRecords),
  ),
  qualityRisks: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().qualityRisks),
  ),
  competencyRecords: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().competencyRecords),
  ),
  iqcAnalytes: JSON.parse(
    JSON.stringify(useLabOpsStore.getState().iqcAnalytes),
  ),
  iqcResults: JSON.parse(JSON.stringify(useLabOpsStore.getState().iqcResults)),
  loading: false,
};

describe("IQCWestgardTab", () => {
  beforeEach(() => {
    mockToastActions.success.mockClear();
    mockToastActions.error.mockClear();
    mockToastActions.info.mockClear();
    mockToastActions.warning.mockClear();
    useLabOpsStore.setState(JSON.parse(JSON.stringify(initialDataState)));
  });

  it("shows a helpful empty-state hint when no active analytes exist", () => {
    useLabOpsStore.setState({ iqcAnalytes: [], iqcResults: [] });

    render(<IQCWestgardTab />);

    expect(screen.getByText("iqcNoActiveAnalytesHint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "iqcLogResult" })).toBeDisabled();
  });

  it("blocks a selected canonical operator whose latest competency is revoked", () => {
    const analyte = useLabOpsStore.getState().iqcAnalytes[0];
    const record = {
      id: "authorized", staffId: "qa-user", staffName: "QA User",
      analyteCode: analyte.analyteCode, analyteName: analyte.analyteName,
      labSection: analyte.labSection, status: "authorized" as const,
      authorizedUntil: "2099-12-31", lastAssessedDate: "2026-01-01",
      assessor: "QA", createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    useLabOpsStore.setState({
      competencyRecords: [record, { ...record, id: "revoked", status: "revoked", updatedAt: "2026-02-01" }],
    });
    render(<IQCWestgardTab />);
    fireEvent.click(screen.getByRole("button", { name: "iqcLogResult" }));
    fireEvent.change(screen.getByRole("combobox", { name: "iqcMeasuredBy" }), {
      target: { value: "qa-user" },
    });
    expect(screen.getByRole("button", { name: "iqcSubmitResult" })).toBeDisabled();
  });

  it("logs a violating QC run and creates a linked NC event", () => {
    const analyte = useLabOpsStore.getState().iqcAnalytes[0];
    useLabOpsStore.setState((state: LabOpsState) => ({
      competencyRecords: [
        ...state.competencyRecords,
        {
          id: "comp-test-001",
          staffName: "QA User",
          staffId: "qa-user",
          analyteCode: analyte.analyteCode,
          analyteName: analyte.analyteName,
          labSection: analyte.labSection,
          level: analyte.level,
          status: "authorized",
          authorizedUntil: "2099-12-31",
          lastAssessedDate: "2026-01-01",
          assessor: "QA Assessor",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    }));

    render(<IQCWestgardTab />);

    fireEvent.click(screen.getByRole("button", { name: "iqcLogResult" }));

    fireEvent.change(screen.getByPlaceholderText(/iqcMeasuredValue/i), {
      target: { value: "110" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "iqcMeasuredBy" }), {
      target: { value: "qa-user" },
    });

    fireEvent.click(screen.getByRole("button", { name: "iqcSubmitResult" }));

    expect(mockToast.success).toHaveBeenCalledWith("iqcResultLoggedSuccess");
    expect(screen.getByText(/iqcRunRejected/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "iqcCreateNC" }));

    expect(screen.getByText("iqcNCCreated")).toBeInTheDocument();
    expect(mockToast.success).toHaveBeenCalledWith("iqcNCCreated");
  });
});

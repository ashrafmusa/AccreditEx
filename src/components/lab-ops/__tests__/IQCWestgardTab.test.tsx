import { fireEvent, render, screen } from "@testing-library/react";

import IQCWestgardTab from "@/components/lab-ops/IQCWestgardTab";
import type { ToastContextType } from "@/hooks/useToast";
import type { LabOpsState } from "@/stores/useLabOpsStore";
import { useLabOpsStore } from "@/stores/useLabOpsStore";

const mockToast: ToastContextType = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  custom: jest.fn(),
  showToast: jest.fn(),
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
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    useLabOpsStore.setState(JSON.parse(JSON.stringify(initialDataState)));
  });

  it("shows a helpful empty-state hint when no active analytes exist", () => {
    useLabOpsStore.setState({ iqcAnalytes: [], iqcResults: [] });

    render(<IQCWestgardTab />);

    expect(screen.getByText("iqcNoActiveAnalytesHint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "iqcLogResult" })).toBeDisabled();
  });

  it("logs a violating QC run and creates a linked NC event", () => {
    const analyte = useLabOpsStore.getState().iqcAnalytes[0];
    useLabOpsStore.setState((state: LabOpsState) => ({
      competencyRecords: [
        ...state.competencyRecords,
        {
          id: "comp-test-001",
          staffName: "QA User",
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
    fireEvent.change(screen.getByPlaceholderText(/iqcMeasuredBy/i), {
      target: { value: "QA User" },
    });

    fireEvent.click(screen.getByRole("button", { name: "iqcSubmitResult" }));

    expect(mockToast.success).toHaveBeenCalledWith("iqcResultLoggedSuccess");
    expect(screen.getByText(/iqcRunRejected/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "iqcCreateNC" }));

    expect(screen.getByText("iqcNCCreated")).toBeInTheDocument();
    expect(mockToast.success).toHaveBeenCalledWith("iqcNCCreated");
  });
});

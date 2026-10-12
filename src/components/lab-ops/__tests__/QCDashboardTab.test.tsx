import { render, screen } from "@testing-library/react";

import QCDashboardTab from "@/components/lab-ops/QCDashboardTab";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type { IQCAnalyte, IQCResult } from "@/types/labOps";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: "en",
    dir: "ltr",
  }),
}));

const analyte: IQCAnalyte = {
  id: "analyte-glucose-l1",
  analyteCode: "GLU-L1",
  analyteName: "Glucose",
  labSection: "Chemistry",
  equipmentId: "analyzer-1",
  equipmentName: "Analyzer 1",
  controlMaterial: "Control A",
  controlLot: "LOT-1",
  level: 1,
  targetMean: 100,
  targetSD: 5,
  unit: "mg/dL",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const result = (id: string, measuredAt: string, measuredValue: number): IQCResult => ({
  id,
  analyteId: analyte.id,
  analyteName: analyte.analyteName,
  analyteCode: analyte.analyteCode,
  labSection: analyte.labSection,
  equipmentId: analyte.equipmentId,
  level: analyte.level,
  measuredValue,
  sdFromMean: (measuredValue - analyte.targetMean) / analyte.targetSD,
  measuredAt,
  measuredBy: "QA User",
  violatedRules: [],
  rejected: false,
  createdAt: measuredAt,
});

describe("QCDashboardTab", () => {
  beforeEach(() => {
    useLabOpsStore.setState({ iqcAnalytes: [], iqcResults: [] });
  });

  it("does not show a chart when no active analytes are configured", () => {
    render(<QCDashboardTab />);

    expect(screen.getByText("iqcNoActiveAnalytesHint")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("plots saved results against the configured analyte targets", () => {
    useLabOpsStore.setState({
      iqcAnalytes: [analyte],
      iqcResults: [
        result("result-1", "2026-10-10T08:00:00.000Z", 100),
        result("result-2", "2026-10-11T08:00:00.000Z", 110),
      ],
    });

    render(<QCDashboardTab />);

    expect(
      screen.getByRole("img", {
        name: "Glucose — controlLevel 1 iqcLeveyJennings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-10-11T08:00:00.000Z: 110 mg/dL (2.00 SD)"))
      .toBeInTheDocument();
  });

  it("does not mix results from a different control level into the chart", () => {
    useLabOpsStore.setState({
      iqcAnalytes: [analyte],
      iqcResults: [
        result("result-l1", "2026-10-10T08:00:00.000Z", 100),
        { ...result("result-l2", "2026-10-11T08:00:00.000Z", 110), level: 2 },
      ],
    });

    render(<QCDashboardTab />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("iqcNoChartData")).toBeInTheDocument();
  });
});

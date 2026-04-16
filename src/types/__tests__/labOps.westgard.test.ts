import type { CompetencyRecord, IQCResult } from "@/types/labOps";
import { applyWestgardRules, checkCompetencyAuthorization } from "@/types/labOps";

function makeResult(sdFromMean: number): IQCResult {
    return {
        id: `r-${Math.random().toString(36).slice(2)}`,
        analyteId: "a1",
        analyteName: "Glucose",
        analyteCode: "GLU-L1",
        labSection: "Chemistry",
        equipmentId: "eq-001",
        level: 1,
        measuredValue: 100,
        sdFromMean,
        measuredAt: "2026-04-01T00:00:00Z",
        measuredBy: "Tester",
        violatedRules: [],
        rejected: false,
        createdAt: "2026-04-01T00:00:00Z",
    };
}

describe("applyWestgardRules", () => {
    it("flags 1_2s for absolute z > 2", () => {
        const rules = applyWestgardRules([], 2.1);
        expect(rules).toContain("1_2s");
    });

    it("flags 1_3s for absolute z > 3", () => {
        const rules = applyWestgardRules([], -3.2);
        expect(rules).toContain("1_2s");
        expect(rules).toContain("1_3s");
    });

    it("flags 2_2s for two consecutive points beyond +2 SD", () => {
        const history = [makeResult(2.4)];
        const rules = applyWestgardRules(history, 2.2);
        expect(rules).toContain("2_2s");
    });

    it("flags R_4s for opposite-side pair beyond +/-2 SD", () => {
        const history = [makeResult(-2.3)];
        const rules = applyWestgardRules(history, 2.4);
        expect(rules).toContain("R_4s");
    });

    it("flags 4_1s for four consecutive points beyond +1 SD", () => {
        const history = [makeResult(1.4), makeResult(1.3), makeResult(1.2)];
        const rules = applyWestgardRules(history, 1.5);
        expect(rules).toContain("4_1s");
    });

    it("flags 10_x for ten consecutive points on one side of mean", () => {
        const history = [
            makeResult(0.8),
            makeResult(0.7),
            makeResult(0.6),
            makeResult(0.5),
            makeResult(0.4),
            makeResult(0.3),
            makeResult(0.2),
            makeResult(0.1),
            makeResult(0.05),
        ];
        const rules = applyWestgardRules(history, 0.9);
        expect(rules).toContain("10_x");
    });

    it("does not emit reject-pattern rules for stable near-mean values", () => {
        const history = [makeResult(0.3), makeResult(-0.2), makeResult(0.1)];
        const rules = applyWestgardRules(history, 0.2);
        expect(rules).toEqual([]);
    });
});

describe("checkCompetencyAuthorization", () => {
    it("matches staff names despite punctuation/spacing differences", () => {
        const records: CompetencyRecord[] = [
            {
                id: "comp-001",
                staffName: "A. Hassan",
                analyteCode: "GLU-L1",
                analyteName: "Glucose",
                labSection: "Chemistry",
                status: "authorized",
                authorizedUntil: "2099-12-31",
                lastAssessedDate: "2026-01-01",
                assessor: "QA",
                createdAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-01T00:00:00Z",
            },
        ];

        const gate = checkCompetencyAuthorization(records, "A Hassan", "GLU-L1", "2026-04-01T00:00:00Z");
        expect(gate.authorized).toBe(true);
        expect(gate.status).toBe("authorized");
    });

    it("matches analyte base code when level suffix differs", () => {
        const records: CompetencyRecord[] = [
            {
                id: "comp-002",
                staffName: "A. Hassan",
                analyteCode: "GLU",
                analyteName: "Glucose",
                labSection: "Chemistry",
                status: "authorized",
                authorizedUntil: "2099-12-31",
                lastAssessedDate: "2026-01-01",
                assessor: "QA",
                createdAt: "2026-01-01T00:00:00Z",
                updatedAt: "2026-01-01T00:00:00Z",
            },
        ];

        const gate = checkCompetencyAuthorization(records, "A. Hassan", "GLU-L1", "2026-04-01T00:00:00Z");
        expect(gate.authorized).toBe(true);
        expect(gate.status).toBe("authorized");
    });
});

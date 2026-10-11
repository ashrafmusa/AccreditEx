import { fireEvent, render, screen } from "@testing-library/react";
import ReagentTab from "@/components/lab-ops/ReagentTab";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { SEED_REAGENTS } from "@/types/labOps";

const mockError = jest.fn();
jest.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: mockError }) }));
jest.mock("@/hooks/useTranslation", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/services/labOpsService", () => ({
    getLabOpsData: jest.fn(), saveLabOpsDataWithRetry: jest.fn(),
}));
jest.mock("@/stores/useTenantStore", () => ({
    useTenantStore: { getState: () => ({ organizationId: "org-a" }) },
}));

describe("Reagent usage form", () => {
    beforeEach(() => {
        mockError.mockClear();
        useLabOpsStore.setState({
            reagents: [{ ...SEED_REAGENTS[0], quantity: 10 }], reagentUsageLogs: [],
            hasLoadedFromFirestore: false, loadedOrganizationId: null,
        });
    });

    it.each([-1, 11])("rejects quantity %s visibly without changing inventory", (quantity) => {
        render(<ReagentTab />);
        fireEvent.click(screen.getByText(SEED_REAGENTS[0].name));
        fireEvent.click(screen.getByRole("button", { name: /logUsage/ }));
        fireEvent.change(screen.getByRole("spinbutton"), { target: { value: String(quantity) } });
        fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "QA" } });
        fireEvent.click(screen.getByRole("button", { name: "save" }));
        expect(mockError).toHaveBeenCalledWith("labOpsInvalidUsage");
        expect(useLabOpsStore.getState().reagents[0].quantity).toBe(10);
        expect(useLabOpsStore.getState().reagentUsageLogs).toEqual([]);
    });
});

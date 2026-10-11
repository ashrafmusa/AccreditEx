import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReagentTab from "@/components/lab-ops/ReagentTab";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import { SEED_REAGENTS } from "@/types/labOps";

const mockError = jest.fn();
jest.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: mockError }) }));
jest.mock("@/hooks/useTranslation", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/services/labOpsService", () => ({
    getLabOpsData: jest.fn(), saveLabOpsDataWithRetry: jest.fn(), labRecordStorageEnabled: () => false,
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
            recordMode: false, usageHasMore: false, loadingUsage: false,
        });
    });

    it("labels incomplete usage history and requests the next page without treating it as empty", () => {
            // Arrange
            const loadMoreUsage = jest.fn().mockResolvedValue(undefined);
            useLabOpsStore.setState({ usageHasMore: true, loadMoreUsage });
            render(<ReagentTab />);
            fireEvent.click(screen.getByText(SEED_REAGENTS[0].name));
            // Act
            fireEvent.click(screen.getByRole("button", { name: "labOpsLoadOlder" }));
            // Assert
            expect(screen.getByRole("status")).toHaveTextContent("labOpsUsagePartial");
            expect(loadMoreUsage).toHaveBeenCalledTimes(1);
        });

        it("keeps the form open when a transactional usage save rejects", async () => {
            // Arrange
            const previous = useLabOpsStore.getState().addReagentUsage;
            const save = jest.fn().mockRejectedValue(new Error("offline"));
            useLabOpsStore.setState({ addReagentUsage: save });
            render(<ReagentTab />);
            fireEvent.click(screen.getByText(SEED_REAGENTS[0].name));
            fireEvent.click(screen.getByRole("button", { name: /logUsage/ }));
            fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
            fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "QA" } });
            // Act
            fireEvent.click(screen.getByRole("button", { name: "save" }));
            // Assert
            await waitFor(() => expect(mockError).toHaveBeenCalled());
            expect(screen.getByRole("spinbutton")).toBeInTheDocument();
            const first = save.mock.calls[0][0] as { id: string };
            fireEvent.click(screen.getByRole("button", { name: "save" }));
            await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
            expect(save.mock.calls[1][0]).toEqual(first);
            useLabOpsStore.setState({ addReagentUsage: previous });
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

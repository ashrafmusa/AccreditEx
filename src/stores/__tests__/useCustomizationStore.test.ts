import { CustomizationService } from "@/services/customizationService";
import { DEFAULT_CUSTOMIZATION, type UserCustomization } from "@/types/customization";
import { useCustomizationStore } from "@/stores/useCustomizationStore";

jest.mock("@/services/customizationService", () => ({
    CustomizationService: {
        loadCustomization: jest.fn(),
        saveCustomization: jest.fn(),
    },
}));

const customizationFor = (userId: string): UserCustomization => ({
    id: `custom_${userId}`,
    userId,
    ...DEFAULT_CUSTOMIZATION,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
});

describe("useCustomizationStore persistence", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCustomizationStore.setState({
            customization: null,
            isLoading: false,
            error: null,
        });
        jest.mocked(CustomizationService.saveCustomization).mockResolvedValue(undefined);
    });

    it("loads the authenticated user's saved settings", async () => {
        const saved = customizationFor("user-a");
        jest.mocked(CustomizationService.loadCustomization).mockResolvedValue(saved);

        await useCustomizationStore.getState().loadCustomization("user-a");

        expect(CustomizationService.loadCustomization).toHaveBeenCalledWith("user-a");
        expect(CustomizationService.saveCustomization).not.toHaveBeenCalled();
        expect(useCustomizationStore.getState().customization).toEqual(saved);
        expect(useCustomizationStore.getState().error).toBeNull();
    });

    it("creates and persists defaults only when the remote document is absent", async () => {
        jest.mocked(CustomizationService.loadCustomization).mockResolvedValue(null);

        await useCustomizationStore.getState().loadCustomization("user-b");

        const created = useCustomizationStore.getState().customization;
        expect(created).toMatchObject({
            id: "custom_user-b",
            userId: "user-b",
            theme: DEFAULT_CUSTOMIZATION.theme,
        });
        expect(CustomizationService.saveCustomization).toHaveBeenCalledWith(created);
    });

    it("does not publish edits when remote persistence fails", async () => {
        const saved = customizationFor("user-a");
        useCustomizationStore.setState({ customization: saved });
        jest.mocked(CustomizationService.saveCustomization).mockRejectedValueOnce(new Error("offline"));

        await expect(
            useCustomizationStore.getState().updateCustomization({
                theme: { ...saved.theme, primaryColor: "#112233" },
            }),
        ).rejects.toThrow("offline");

        expect(useCustomizationStore.getState().customization).toEqual(saved);
        expect(useCustomizationStore.getState().error).toBe("Failed to save customization");
    });

    it("keeps a previous user's persisted settings out of the newly loaded user's state", async () => {
        const saved = customizationFor("user-b");
        useCustomizationStore.setState({ customization: customizationFor("user-a") });
        jest.mocked(CustomizationService.loadCustomization).mockResolvedValue(saved);

        await useCustomizationStore.getState().loadCustomization("user-b");

        expect(useCustomizationStore.getState().customization).toEqual(saved);
        expect(useCustomizationStore.getState().customization?.userId).toBe("user-b");
    });
});

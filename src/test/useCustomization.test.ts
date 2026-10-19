import { act, renderHook, waitFor } from "@testing-library/react";
import { useCustomization } from "@/hooks/useCustomization";
import { useCustomizationStore } from "@/stores/useCustomizationStore";
import { DEFAULT_CUSTOMIZATION, type UserCustomization } from "@/types/customization";
import { CustomizationService } from "@/services/customizationService";

jest.mock("@/services/customizationService", () => ({
    CustomizationService: {
        loadCustomization: jest.fn(),
        saveCustomization: jest.fn(),
        applyCSSVariables: jest.fn(),
        applyBodyClasses: jest.fn(),
        exportCustomization: jest.fn(),
        importCustomization: jest.fn(),
    },
}));

const customizationFor = (userId: string): UserCustomization => ({
    id: `custom_${userId}`,
    userId,
    ...DEFAULT_CUSTOMIZATION,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
});

describe("useCustomization user scoping", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCustomizationStore.setState({
            customization: customizationFor("user-a"),
            isLoading: false,
            error: null,
        });
    });

    it("reloads and exposes only the authenticated user's remote customization", async () => {
        const userB = customizationFor("user-b");
        jest.mocked(CustomizationService.loadCustomization).mockResolvedValue(userB);
        const { result } = renderHook(() => useCustomization("user-b"));

        expect(result.current.customization).toBeNull();

        await act(async () => {
            await waitFor(() => expect(result.current.customization).toEqual(userB));
        });

        expect(CustomizationService.loadCustomization).toHaveBeenCalledWith("user-b");
        expect(result.current.customization?.userId).toBe("user-b");
    });
});

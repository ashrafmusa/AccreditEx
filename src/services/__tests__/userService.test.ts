import { getDoc, updateDoc } from "firebase/firestore";
import { setProgramSelection } from "@/services/userService";

jest.mock("@/firebase/firebaseConfig", () => ({
    db: {},
    getAuthInstance: () => ({ currentUser: { uid: "user-1" } }),
}));

jest.mock("@/utils/tenantQuery", () => ({
    getTenantQuery: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
    doc: jest.fn(() => "user-ref"),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
}));

jest.mock("@/services/freeTierMonitor", () => ({
    freeTierMonitor: { recordWrite: jest.fn() },
}));

describe("setProgramSelection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(getDoc).mockResolvedValue({
            exists: () => true,
        } as Awaited<ReturnType<typeof getDoc>>);
    });

    it("persists the selected organization size in the user profile", async () => {
        await setProgramSelection(
            {
                id: "user-1",
                name: "Alya",
                email: "alya@example.com",
                role: "Admin",
                organizationId: "org-1",
            },
            {
                program: "cbahi",
                organizationName: "Example Hospital",
                organizationType: "hospital",
                organizationSize: "small",
                country: "Oman",
                city: "Muscat",
                region: "Muscat",
            },
        );

        expect(updateDoc).toHaveBeenCalledWith(
            "user-ref",
            expect.objectContaining({
                "profile.organizationSize": "small",
            }),
        );
    });
});

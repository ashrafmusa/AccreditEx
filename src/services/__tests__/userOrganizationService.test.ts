import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { findSoleOrganizationOwnedByUser } from "@/services/userOrganizationService";

jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(() => "organizations"),
    getDocs: jest.fn(),
    limit: jest.fn((count) => count),
    query: jest.fn((...args) => args),
    where: jest.fn((...args) => args),
}));

describe("findSoleOrganizationOwnedByUser", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns the organization ID only when there is one exact owner match", async () => {
        jest.mocked(getDocs).mockResolvedValueOnce({
            docs: [{ id: "org-accreditex" }],
        } as Awaited<ReturnType<typeof getDocs>>);

        await expect(findSoleOrganizationOwnedByUser("auth-user-1")).resolves.toBe("org-accreditex");
        expect(query).toHaveBeenCalledWith(
            "organizations",
            ["createdBy", "==", "auth-user-1"],
            2,
        );
    });

    it("returns null when the user owns no organizations", async () => {
        jest.mocked(getDocs).mockResolvedValueOnce({
            docs: [],
        } as unknown as Awaited<ReturnType<typeof getDocs>>);

        await expect(findSoleOrganizationOwnedByUser("auth-user-1")).resolves.toBeNull();
    });

    it("refuses to choose between multiple owned organizations", async () => {
        jest.mocked(getDocs).mockResolvedValueOnce({
            docs: [{ id: "org-a" }, { id: "org-b" }],
        } as Awaited<ReturnType<typeof getDocs>>);

        await expect(findSoleOrganizationOwnedByUser("auth-user-1"))
            .rejects.toThrow("Multiple organizations are owned");
    });

    it("does not query organizations without an authenticated user ID", async () => {
        await expect(findSoleOrganizationOwnedByUser("")).resolves.toBeNull();
        expect(collection).not.toHaveBeenCalled();
        expect(where).not.toHaveBeenCalled();
        expect(limit).not.toHaveBeenCalled();
    });
});

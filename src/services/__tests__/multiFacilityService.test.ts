import { collection, getDocs, query, where } from "firebase/firestore";
import { getOrganizationBranches } from "@/services/multiFacilityService";

jest.mock("@/firebase/firebaseConfig", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, path) => path),
  getDocs: jest.fn(),
  query: jest.fn((...args) => args),
  where: jest.fn((...args) => args),
}));

describe("getOrganizationBranches", () => {
  const getDocsMock = jest.mocked(getDocs);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("filters inactive branches and sorts active branches by name", async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: "branch-z",
          data: () => ({ organizationId: "org-1", name: "Zulu", isActive: true }),
        },
        {
          id: "branch-inactive",
          data: () => ({ organizationId: "org-1", name: "Inactive", isActive: false }),
        },
        {
          id: "branch-a",
          data: () => ({ organizationId: "org-1", name: "Alpha", isActive: true }),
        },
      ],
    } as never);

    const branches = await getOrganizationBranches("org-1");

    expect(collection).toHaveBeenCalledWith({}, "branches");
    expect(where).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledWith("organizationId", "==", "org-1");
    expect(query).toHaveBeenCalledTimes(1);
    expect(branches.map(({ id }) => id)).toEqual(["branch-a", "branch-z"]);
  });

  it("propagates Firestore read failures instead of reporting no branches", async () => {
    const firestoreError = new Error("Firestore unavailable");
    getDocsMock.mockRejectedValue(firestoreError);

    await expect(getOrganizationBranches("org-1")).rejects.toBe(firestoreError);
  });
});

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export async function findSoleOrganizationOwnedByUser(userId: string): Promise<string | null> {
    if (!userId) return null;

    const organizations = await getDocs(query(
        collection(db, "organizations"),
        where("createdBy", "==", userId),
        limit(2),
    ));
    if (organizations.docs.length > 1) {
        throw new Error("Multiple organizations are owned by this user; organization selection is required");
    }
    return organizations.docs[0]?.id ?? null;
}

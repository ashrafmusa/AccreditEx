import { db } from "@/firebase/firebaseConfig";
import { useUserStore } from "@/stores/useUserStore";
import type { AIResponse } from "@/types/aiResponse";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/** Persist thumbs-up/down on an AI answer into the shared `feedback` collection. */
export async function submitAIFeedback(
  rating: "up" | "down",
  response: AIResponse,
): Promise<void> {
  const user = useUserStore.getState().currentUser;
  try {
    await addDoc(collection(db, "feedback"), {
      type: "ai_response",
      rating: rating === "up" ? 5 : 1,
      aiRating: rating,
      aiResponseType: response.type,
      aiModel: response.model || null,
      aiSource: response.source,
      message: response.contentMarkdown.slice(0, 1000),
      userId: user?.id || "anonymous",
      userRole: user?.role || "Unknown",
      organizationId: user?.organizationId || null,
      url: typeof window !== "undefined" ? window.location.pathname : null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn("AI feedback could not be saved:", error);
  }
}

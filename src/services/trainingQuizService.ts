import { functions } from "@/firebase/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import type { CertificateData } from "@/types";

export interface TrainingQuizSubmission {
    score: number;
    passed: boolean;
    certificateId?: string;
    certificate?: CertificateData;
}

export async function submitTrainingQuiz(
    trainingId: string,
    answers: Record<string, number>,
): Promise<TrainingQuizSubmission> {
    const callable = httpsCallable<
        { trainingId: string; answers: Record<string, number> },
        TrainingQuizSubmission
    >(functions, "submitTrainingQuiz");
    const result = await callable({ trainingId, answers });
    return result.data;
}

/**
 * AccrediTex — Firebase Cloud Functions (Spark / Free Plan)
 *
 * NOTE: Stripe webhooks are handled by the Render Python backend
 * (accreditex.onrender.com/stripe/webhook) — no Firebase Functions
 * needed for payments, keeping this app on the free Spark plan.
 *
 * Functions here:
 *  1. setUserClaims      — Sets organizationId + role as Firebase Custom Claims.
 *  2. onUserDocWrite     — Keeps claims in sync when user doc changes.
 *  3. setSuperAdminClaim — Grants/revokes super-admin claim (admin only).
 */

import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

admin.initializeApp();

// 1. setUserClaims
export const setUserClaims = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Must be authenticated.');

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) throw new HttpsError('not-found', `No user doc for uid: ${uid}`);

    const data = userDoc.data()!;
    const role: string = data.role ?? 'TeamMember';
    const organizationId: string = data.organizationId ?? '';

    const existingUser = await admin.auth().getUser(uid);
    const existingClaims = (existingUser.customClaims ?? {}) as Record<string, unknown>;

    await admin.auth().setCustomUserClaims(uid, { ...existingClaims, role, organizationId });
    return { success: true, role, organizationId };
});

// 2. onUserDocWrite
export const onUserDocWrite = onDocumentWritten('users/{uid}', async (event) => {
    const uid = event.params.uid;
    const before = event.data?.before;
    const after = event.data?.after;
    if (!before || !after) return;

    if (!after.exists) {
        const existingUser = await admin.auth().getUser(uid);
        const existingClaims = (existingUser.customClaims ?? {}) as Record<string, unknown>;
        delete existingClaims.role;
        delete existingClaims.organizationId;
        await admin.auth().setCustomUserClaims(uid, existingClaims);
        return;
    }

    const beforeData = before.data() ?? {};
    const data = after.data()!;
    if (
        before.exists &&
        beforeData.role === data.role &&
        beforeData.organizationId === data.organizationId
    ) {
        return;
    }

    const role: string = data.role ?? 'TeamMember';
    const organizationId: string = data.organizationId ?? '';

    const existingUser = await admin.auth().getUser(uid);
    const existingClaims = (existingUser.customClaims ?? {}) as Record<string, unknown>;

    await admin.auth().setCustomUserClaims(uid, { ...existingClaims, role, organizationId });
});

// 3. setSuperAdminClaim
export const setSuperAdminClaim = onCall(async (request) => {
    const callerClaims = request.auth?.token as Record<string, unknown> | undefined;
    if (!callerClaims || callerClaims.isSuperAdmin !== true) {
        throw new HttpsError('permission-denied', 'Only super-admins can grant this claim.');
    }
    const { targetUid, isSuperAdmin } = request.data as { targetUid: string; isSuperAdmin: boolean };
    if (!targetUid || typeof isSuperAdmin !== 'boolean') {
        throw new HttpsError('invalid-argument', 'targetUid and isSuperAdmin required.');
    }
    const targetUser = await admin.auth().getUser(targetUid);
    const existingClaims = (targetUser.customClaims ?? {}) as Record<string, unknown>;
    await admin.auth().setCustomUserClaims(targetUid, { ...existingClaims, isSuperAdmin });
    await admin.firestore().collection('settings_audit_logs').add({
        action: 'super_admin_claim_updated',
        actorUid: request.auth!.uid,
        targetUid,
        isSuperAdmin,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, targetUid, isSuperAdmin };
});

export const submitTrainingQuiz = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Must be authenticated.');

    const requestData = request.data as {
        trainingId?: unknown;
        answers?: unknown;
    } | null;
    const trainingId = requestData?.trainingId;
    const answers = requestData?.answers;
    if (
        typeof trainingId !== 'string' ||
        !trainingId.trim() ||
        trainingId.includes('/') ||
        !answers ||
        typeof answers !== 'object' ||
        Array.isArray(answers)
    ) {
        throw new HttpsError('invalid-argument', 'A training ID and answer map are required.');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const trainingRef = db.collection('trainingPrograms').doc(trainingId);
    const [userSnapshot, trainingSnapshot] = await Promise.all([
        userRef.get(),
        trainingRef.get(),
    ]);
    if (!userSnapshot.exists) {
        throw new HttpsError('not-found', 'The authenticated user profile was not found.');
    }
    if (!trainingSnapshot.exists) {
        throw new HttpsError('not-found', 'The training program was not found.');
    }

    const user = userSnapshot.data() ?? {};
    const training = trainingSnapshot.data() ?? {};
    const organizationId = user.organizationId;
    if (typeof organizationId !== 'string' || !organizationId) {
        throw new HttpsError('failed-precondition', 'The user has no active organization.');
    }
    if (training.organizationId !== organizationId || training.isActive === false) {
        throw new HttpsError('permission-denied', 'The training is not active in the user organization.');
    }

    const quiz = training.quiz;
    const passingScore = training.passingScore;
    if (
        !Array.isArray(quiz) ||
        quiz.length === 0 ||
        !Number.isFinite(passingScore) ||
        passingScore < 0 ||
        passingScore > 100
    ) {
        throw new HttpsError('failed-precondition', 'The training quiz is not configured correctly.');
    }

    const answerMap = answers as Record<string, unknown>;
    const questionIds = new Set<string>();
    for (const question of quiz) {
        if (
            !question ||
            typeof question.id !== 'string' ||
            !question.id ||
            questionIds.has(question.id) ||
            !Array.isArray(question.options) ||
            !Number.isInteger(question.correctOptionIndex) ||
            question.correctOptionIndex < 0 ||
            question.correctOptionIndex >= question.options.length
        ) {
            throw new HttpsError('failed-precondition', 'The training quiz contains invalid questions.');
        }
        questionIds.add(question.id);
    }
    if (Object.keys(answerMap).some((questionId) => !questionIds.has(questionId))) {
        throw new HttpsError('invalid-argument', 'Answers contain an unknown question.');
    }
    for (const [questionId, answer] of Object.entries(answerMap)) {
        const question = quiz.find((item: { id: string }) => item.id === questionId);
        if (
            !Number.isInteger(answer) ||
            (answer as number) < 0 ||
            (answer as number) >= question.options.length
        ) {
            throw new HttpsError('invalid-argument', 'An answer is not a valid option for its question.');
        }
    }

    const correctAnswers = quiz.reduce(
        (count: number, question: { id: string; correctOptionIndex: number }) =>
            count + (answerMap[question.id] === question.correctOptionIndex ? 1 : 0),
        0,
    );
    const score = Math.round((correctAnswers / quiz.length) * 100);
    const passed = score >= passingScore;
    const now = new Date().toISOString();
    const statusRef = db.collection('userTrainingStatuses').doc(uid);
    const certificateId = passed ? `cert-${uid}-${trainingId}` : undefined;
    const certificateRef = certificateId
        ? db.collection('certificates').doc(certificateId)
        : undefined;
    const title = training.title;
    const trainingTitle = typeof title === 'string'
        ? title
        : typeof title?.en === 'string'
            ? title.en
            : typeof title?.ar === 'string'
                ? title.ar
                : trainingId;

    return db.runTransaction(async (transaction) => {
        const statusSnapshot = await transaction.get(statusRef);
        const certificateSnapshot = certificateRef
            ? await transaction.get(certificateRef)
            : undefined;
        const existingStatus = statusSnapshot.data() ?? {};
        if (statusSnapshot.exists && existingStatus.userId !== uid) {
            throw new HttpsError('data-loss', 'Training status ownership is invalid.');
        }
        if (
            certificateSnapshot?.exists &&
            certificateSnapshot.data()?.userId !== uid
        ) {
            throw new HttpsError('data-loss', 'Certificate ownership is invalid.');
        }

        const existingStatuses = Object.fromEntries(
            Object.entries(existingStatus).filter(
                ([key]) => !['userId', 'organizationId', 'updatedAt'].includes(key),
            ),
        );
        const previousTrainingStatus = existingStatuses[trainingId] as
            | { status?: unknown; score?: unknown; completionDate?: unknown; certificateId?: unknown }
            | undefined;
        const alreadyCompleted = previousTrainingStatus?.status === 'Completed';
        const statusRecord: Record<string, unknown> = {
            status: passed || alreadyCompleted ? 'Completed' : 'In Progress',
            score: typeof previousTrainingStatus?.score === 'number'
                ? Math.max(previousTrainingStatus.score, score)
                : score,
            updatedAt: now,
        };
        const completionDate = certificateSnapshot?.data()?.completionDate
            ?? previousTrainingStatus?.completionDate;
        const existingCertificateId = passed
            ? certificateId
            : previousTrainingStatus?.certificateId;
        if (passed || alreadyCompleted) {
            statusRecord.completionDate = completionDate ?? now;
            if (typeof existingCertificateId === 'string') {
                statusRecord.certificateId = existingCertificateId;
            }
        }
        transaction.set(statusRef, {
            ...existingStatuses,
            userId: uid,
            organizationId,
            [trainingId]: statusRecord,
            updatedAt: now,
        });

        if (passed && certificateRef && !certificateSnapshot?.exists) {
            const certificate: Record<string, unknown> = {
                id: certificateId,
                organizationId,
                userId: uid,
                trainingId,
                trainingTitle,
                completionDate: now,
                score,
            };
            if (typeof user.name === 'string') certificate.userName = user.name;
            transaction.create(certificateRef, certificate);
        }

        const certificate = passed
            ? (certificateSnapshot?.data() ?? {
                id: certificateId,
                organizationId,
                userId: uid,
                trainingId,
                trainingTitle,
                completionDate: now,
                score,
                ...(typeof user.name === 'string' ? { userName: user.name } : {}),
            })
            : undefined;
        return { score, passed, certificateId: passed ? certificateId : undefined, certificate };
    });
});

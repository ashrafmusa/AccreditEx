"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitTrainingQuiz = exports.setSuperAdminClaim = exports.onUserDocWrite = exports.setUserClaims = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
// 1. setUserClaims
exports.setUserClaims = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated.');
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists)
        throw new https_1.HttpsError('not-found', `No user doc for uid: ${uid}`);
    const data = userDoc.data();
    const role = (_b = data.role) !== null && _b !== void 0 ? _b : 'TeamMember';
    const organizationId = (_c = data.organizationId) !== null && _c !== void 0 ? _c : '';
    const existingUser = await admin.auth().getUser(uid);
    const existingClaims = ((_d = existingUser.customClaims) !== null && _d !== void 0 ? _d : {});
    await admin.auth().setCustomUserClaims(uid, Object.assign(Object.assign({}, existingClaims), { role, organizationId }));
    return { success: true, role, organizationId };
});
// 2. onUserDocWrite
exports.onUserDocWrite = (0, firestore_1.onDocumentWritten)('users/{uid}', async (event) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const uid = event.params.uid;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before;
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after;
    if (!before || !after)
        return;
    if (!after.exists) {
        const existingUser = await admin.auth().getUser(uid);
        const existingClaims = ((_c = existingUser.customClaims) !== null && _c !== void 0 ? _c : {});
        delete existingClaims.role;
        delete existingClaims.organizationId;
        await admin.auth().setCustomUserClaims(uid, existingClaims);
        return;
    }
    const beforeData = (_d = before.data()) !== null && _d !== void 0 ? _d : {};
    const data = after.data();
    if (before.exists &&
        beforeData.role === data.role &&
        beforeData.organizationId === data.organizationId) {
        return;
    }
    const role = (_e = data.role) !== null && _e !== void 0 ? _e : 'TeamMember';
    const organizationId = (_f = data.organizationId) !== null && _f !== void 0 ? _f : '';
    const existingUser = await admin.auth().getUser(uid);
    const existingClaims = ((_g = existingUser.customClaims) !== null && _g !== void 0 ? _g : {});
    await admin.auth().setCustomUserClaims(uid, Object.assign(Object.assign({}, existingClaims), { role, organizationId }));
});
// 3. setSuperAdminClaim
exports.setSuperAdminClaim = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const callerClaims = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token;
    if (!callerClaims || callerClaims.isSuperAdmin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Only super-admins can grant this claim.');
    }
    const { targetUid, isSuperAdmin } = request.data;
    if (!targetUid || typeof isSuperAdmin !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'targetUid and isSuperAdmin required.');
    }
    const targetUser = await admin.auth().getUser(targetUid);
    const existingClaims = ((_b = targetUser.customClaims) !== null && _b !== void 0 ? _b : {});
    await admin.auth().setCustomUserClaims(targetUid, Object.assign(Object.assign({}, existingClaims), { isSuperAdmin }));
    await admin.firestore().collection('settings_audit_logs').add({
        action: 'super_admin_claim_updated',
        actorUid: request.auth.uid,
        targetUid,
        isSuperAdmin,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, targetUid, isSuperAdmin };
});
exports.submitTrainingQuiz = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated.');
    const requestData = request.data;
    const trainingId = requestData === null || requestData === void 0 ? void 0 : requestData.trainingId;
    const answers = requestData === null || requestData === void 0 ? void 0 : requestData.answers;
    if (typeof trainingId !== 'string' ||
        !trainingId.trim() ||
        trainingId.includes('/') ||
        !answers ||
        typeof answers !== 'object' ||
        Array.isArray(answers)) {
        throw new https_1.HttpsError('invalid-argument', 'A training ID and answer map are required.');
    }
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const trainingRef = db.collection('trainingPrograms').doc(trainingId);
    const [userSnapshot, trainingSnapshot] = await Promise.all([
        userRef.get(),
        trainingRef.get(),
    ]);
    if (!userSnapshot.exists) {
        throw new https_1.HttpsError('not-found', 'The authenticated user profile was not found.');
    }
    if (!trainingSnapshot.exists) {
        throw new https_1.HttpsError('not-found', 'The training program was not found.');
    }
    const user = (_b = userSnapshot.data()) !== null && _b !== void 0 ? _b : {};
    const training = (_c = trainingSnapshot.data()) !== null && _c !== void 0 ? _c : {};
    const organizationId = user.organizationId;
    if (typeof organizationId !== 'string' || !organizationId) {
        throw new https_1.HttpsError('failed-precondition', 'The user has no active organization.');
    }
    if (training.organizationId !== organizationId || training.isActive === false) {
        throw new https_1.HttpsError('permission-denied', 'The training is not active in the user organization.');
    }
    const quiz = training.quiz;
    const passingScore = training.passingScore;
    if (!Array.isArray(quiz) ||
        quiz.length === 0 ||
        !Number.isFinite(passingScore) ||
        passingScore < 0 ||
        passingScore > 100) {
        throw new https_1.HttpsError('failed-precondition', 'The training quiz is not configured correctly.');
    }
    const answerMap = answers;
    const questionIds = new Set();
    for (const question of quiz) {
        if (!question ||
            typeof question.id !== 'string' ||
            !question.id ||
            questionIds.has(question.id) ||
            !Array.isArray(question.options) ||
            !Number.isInteger(question.correctOptionIndex) ||
            question.correctOptionIndex < 0 ||
            question.correctOptionIndex >= question.options.length) {
            throw new https_1.HttpsError('failed-precondition', 'The training quiz contains invalid questions.');
        }
        questionIds.add(question.id);
    }
    if (Object.keys(answerMap).some((questionId) => !questionIds.has(questionId))) {
        throw new https_1.HttpsError('invalid-argument', 'Answers contain an unknown question.');
    }
    for (const [questionId, answer] of Object.entries(answerMap)) {
        const question = quiz.find((item) => item.id === questionId);
        if (!Number.isInteger(answer) ||
            answer < 0 ||
            answer >= question.options.length) {
            throw new https_1.HttpsError('invalid-argument', 'An answer is not a valid option for its question.');
        }
    }
    const correctAnswers = quiz.reduce((count, question) => count + (answerMap[question.id] === question.correctOptionIndex ? 1 : 0), 0);
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
        : typeof (title === null || title === void 0 ? void 0 : title.en) === 'string'
            ? title.en
            : typeof (title === null || title === void 0 ? void 0 : title.ar) === 'string'
                ? title.ar
                : trainingId;
    return db.runTransaction(async (transaction) => {
        var _a, _b, _c, _d, _e;
        const statusSnapshot = await transaction.get(statusRef);
        const certificateSnapshot = certificateRef
            ? await transaction.get(certificateRef)
            : undefined;
        const existingStatus = (_a = statusSnapshot.data()) !== null && _a !== void 0 ? _a : {};
        if (statusSnapshot.exists && existingStatus.userId !== uid) {
            throw new https_1.HttpsError('data-loss', 'Training status ownership is invalid.');
        }
        if ((certificateSnapshot === null || certificateSnapshot === void 0 ? void 0 : certificateSnapshot.exists) &&
            ((_b = certificateSnapshot.data()) === null || _b === void 0 ? void 0 : _b.userId) !== uid) {
            throw new https_1.HttpsError('data-loss', 'Certificate ownership is invalid.');
        }
        const existingStatuses = Object.fromEntries(Object.entries(existingStatus).filter(([key]) => !['userId', 'organizationId', 'updatedAt'].includes(key)));
        const previousTrainingStatus = existingStatuses[trainingId];
        const alreadyCompleted = (previousTrainingStatus === null || previousTrainingStatus === void 0 ? void 0 : previousTrainingStatus.status) === 'Completed';
        const statusRecord = {
            status: passed || alreadyCompleted ? 'Completed' : 'In Progress',
            score: typeof (previousTrainingStatus === null || previousTrainingStatus === void 0 ? void 0 : previousTrainingStatus.score) === 'number'
                ? Math.max(previousTrainingStatus.score, score)
                : score,
            updatedAt: now,
        };
        const completionDate = (_d = (_c = certificateSnapshot === null || certificateSnapshot === void 0 ? void 0 : certificateSnapshot.data()) === null || _c === void 0 ? void 0 : _c.completionDate) !== null && _d !== void 0 ? _d : previousTrainingStatus === null || previousTrainingStatus === void 0 ? void 0 : previousTrainingStatus.completionDate;
        const existingCertificateId = passed
            ? certificateId
            : previousTrainingStatus === null || previousTrainingStatus === void 0 ? void 0 : previousTrainingStatus.certificateId;
        if (passed || alreadyCompleted) {
            statusRecord.completionDate = completionDate !== null && completionDate !== void 0 ? completionDate : now;
            if (typeof existingCertificateId === 'string') {
                statusRecord.certificateId = existingCertificateId;
            }
        }
        transaction.set(statusRef, Object.assign(Object.assign({}, existingStatuses), { userId: uid, organizationId, [trainingId]: statusRecord, updatedAt: now }));
        if (passed && certificateRef && !(certificateSnapshot === null || certificateSnapshot === void 0 ? void 0 : certificateSnapshot.exists)) {
            const certificate = {
                id: certificateId,
                organizationId,
                userId: uid,
                trainingId,
                trainingTitle,
                completionDate: now,
                score,
            };
            if (typeof user.name === 'string')
                certificate.userName = user.name;
            transaction.create(certificateRef, certificate);
        }
        const certificate = passed
            ? ((_e = certificateSnapshot === null || certificateSnapshot === void 0 ? void 0 : certificateSnapshot.data()) !== null && _e !== void 0 ? _e : Object.assign({ id: certificateId, organizationId, userId: uid, trainingId,
                trainingTitle, completionDate: now, score }, (typeof user.name === 'string' ? { userName: user.name } : {})))
            : undefined;
        return { score, passed, certificateId: passed ? certificateId : undefined, certificate };
    });
});
//# sourceMappingURL=index.js.map
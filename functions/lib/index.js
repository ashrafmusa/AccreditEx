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
exports.setSuperAdminClaim = exports.onUserDocWrite = exports.setUserClaims = void 0;
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
    var _a, _b, _c, _d;
    const uid = event.params.uid;
    if (!((_a = event.data) === null || _a === void 0 ? void 0 : _a.after.exists)) {
        await admin.auth().setCustomUserClaims(uid, {});
        return;
    }
    const data = event.data.after.data();
    const role = (_b = data.role) !== null && _b !== void 0 ? _b : 'TeamMember';
    const organizationId = (_c = data.organizationId) !== null && _c !== void 0 ? _c : '';
    let existingClaims = {};
    try {
        const existingUser = await admin.auth().getUser(uid);
        existingClaims = ((_d = existingUser.customClaims) !== null && _d !== void 0 ? _d : {});
    }
    catch ( /* ignore */_e) { /* ignore */ }
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
    return { success: true, targetUid, isSuperAdmin };
});
//# sourceMappingURL=index.js.map
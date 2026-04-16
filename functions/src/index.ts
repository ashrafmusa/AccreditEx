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
    if (!event.data?.after.exists) {
        await admin.auth().setCustomUserClaims(uid, {});
        return;
    }
    const data = event.data.after.data()!;
    const role: string = data.role ?? 'TeamMember';
    const organizationId: string = data.organizationId ?? '';

    let existingClaims: Record<string, unknown> = {};
    try {
        const existingUser = await admin.auth().getUser(uid);
        existingClaims = (existingUser.customClaims ?? {}) as Record<string, unknown>;
    } catch { /* ignore */ }

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
    return { success: true, targetUid, isSuperAdmin };
});

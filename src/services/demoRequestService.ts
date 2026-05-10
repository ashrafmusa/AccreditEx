/**
 * Demo Request Service
 * Centralizes all Firestore writes for demo requests.
 * Architecture rule: NO Firestore calls in components — services only.
 */

import { db } from '@/firebase/firebaseConfig';
import emailjs from '@emailjs/browser';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

export interface DemoRequestPayload {
    name: string;
    email: string;
    organization: string;
    message: string;
}

export type DemoRequestStatus = 'new' | 'contacted' | 'scheduled' | 'completed' | 'closed';

export interface DemoRequest extends DemoRequestPayload {
    id: string;
    status: DemoRequestStatus;
    createdAt: Timestamp;
    notes?: string;
}

// ── Email (EmailJS) ──────────────────────────────────────────────────────────
// Gracefully skipped if env vars are not configured.
const EJ_SERVICE = process.env.VITE_EMAILJS_SERVICE_ID ?? '';
const EJ_ADMIN_T = process.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID ?? '';
const EJ_REPLY_T = process.env.VITE_EMAILJS_REPLY_TEMPLATE_ID ?? '';
const EJ_PUB_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY ?? '';
const ALERT_EMAIL = process.env.VITE_DEMO_ALERT_EMAIL ?? '';

async function sendEmailNotifications(payload: DemoRequestPayload): Promise<void> {
    if (!EJ_SERVICE || !EJ_PUB_KEY) return; // not configured — skip silently

    const baseParams = {
        from_name: payload.name,
        from_email: payload.email,
        organization: payload.organization || '—',
        message: payload.message || '—',
    };

    // Alert to sales/admin team
    if (EJ_ADMIN_T && ALERT_EMAIL) {
        await emailjs.send(EJ_SERVICE, EJ_ADMIN_T, {
            ...baseParams,
            to_email: ALERT_EMAIL,
        }, EJ_PUB_KEY).catch(() => { /* non-blocking */ });
    }

    // Auto-reply to the prospect
    if (EJ_REPLY_T) {
        await emailjs.send(EJ_SERVICE, EJ_REPLY_T, {
            ...baseParams,
            to_email: payload.email,
            to_name: payload.name,
        }, EJ_PUB_KEY).catch(() => { /* non-blocking */ });
    }
}

// ── Duplicate check ───────────────────────────────────────────────────────────

/**
 * Returns true if an existing demo request for this email already exists.
 */
export async function isDuplicateDemoRequest(email: string): Promise<boolean> {
    const q = query(
        collection(db, 'demoRequests'),
        where('email', '==', email.toLowerCase().trim()),
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

// ── Submit ────────────────────────────────────────────────────────────────────

/**
 * Submit a demo request to Firestore + send email notifications.
 * @returns The new document ID on success.
 * @throws {Error} with message 'duplicate' if this email already requested a demo.
 */
export async function submitDemoRequest(payload: DemoRequestPayload): Promise<string> {
    const normalizedEmail = payload.email.toLowerCase().trim();

    // Best-effort duplicate check — silently skip if read is denied (unauthenticated user)
    try {
        const duplicate = await isDuplicateDemoRequest(normalizedEmail);
        if (duplicate) throw new Error('duplicate');
    } catch (err) {
        if (err instanceof Error && err.message === 'duplicate') throw err;
        // Permission denied or network error — proceed with the write
    }

    const ref = await addDoc(collection(db, 'demoRequests'), {
        ...payload,
        email: normalizedEmail,
        createdAt: Timestamp.now(),
        status: 'new' as DemoRequestStatus,
    });

    // Non-blocking — don't fail the submission if email fails
    sendEmailNotifications({ ...payload, email: normalizedEmail }).catch(() => { });

    return ref.id;
}

// ── Admin: list all requests ──────────────────────────────────────────────────

export async function listDemoRequests(): Promise<DemoRequest[]> {
    const q = query(collection(db, 'demoRequests'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DemoRequest));
}

// ── Admin: update status ──────────────────────────────────────────────────────

export async function updateDemoRequestStatus(
    id: string,
    status: DemoRequestStatus,
    notes?: string,
): Promise<void> {
    const data: Record<string, unknown> = { status };
    if (notes !== undefined) data.notes = notes;
    await updateDoc(doc(db, 'demoRequests', id), data);
}


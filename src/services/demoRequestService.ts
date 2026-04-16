/**
 * Demo Request Service
 * Centralizes all Firestore writes for demo requests.
 * Architecture rule: NO Firestore calls in components — services only.
 */

import { db } from '@/firebase/firebaseConfig';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export interface DemoRequestPayload {
    name: string;
    email: string;
    organization: string;
    message: string;
}

/**
 * Submit a demo request to Firestore.
 * @param payload - Contact details entered by the prospect.
 * @returns The new document ID on success.
 */
export async function submitDemoRequest(payload: DemoRequestPayload): Promise<string> {
    const ref = await addDoc(collection(db, 'demoRequests'), {
        ...payload,
        createdAt: Timestamp.now(),
        status: 'new',
    });
    return ref.id;
}

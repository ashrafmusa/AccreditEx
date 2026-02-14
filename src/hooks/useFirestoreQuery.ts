import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, query, Query } from 'firebase/firestore';

// Zod type fallback — avoids hard dependency on zod package
interface ZodLikeSchema<T = any> {
    safeParse(data: unknown): { success: true; data: T } | { success: false; error: { flatten(): any } };
}

export const useFirestoreQuery = <T>(
    q: Query,
    schema: ZodLikeSchema<T>
): [T[] | null, boolean] => {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const parsedData = querySnapshot.docs.map((doc) => {
                const validationResult = schema.safeParse(doc.data());
                if (validationResult.success) {
                    return validationResult.data;
                } else {
                    console.error('Invalid data from Firestore:', validationResult.error.flatten());
                    return null;
                }
            });

            setData(parsedData.filter((item): item is T => item !== null));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [q, schema]);

    return [data, loading];
};
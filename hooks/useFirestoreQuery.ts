import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, query, Query } from 'firebase/firestore';
import { z } from 'zod';

export const useFirestoreQuery = <T extends z.ZodType<any, any, any>>(
    q: Query,
    schema: T
): [z.infer<T>[] | null, boolean] => {
    const [data, setData] = useState<z.infer<T>[] | null>(null);
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

            setData(parsedData.filter((item) => item !== null) as z.infer<T>[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [q, schema]);

    return [data, loading];
};
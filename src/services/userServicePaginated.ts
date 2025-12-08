/**
 * Paginated user service for Firebase Firestore
 * Replaces direct fetch-all patterns with cursor-based pagination
 */

import {
  collection,
  query,
  where,
  getDocs,
  limit as firestoreLimit,
  startAfter,
  orderBy,
  Query,
  QueryConstraint,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { User } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

/**
 * Get users with pagination support
 * @param pageSize - Number of users per page (default: 50)
 * @param cursor - Last document for cursor-based pagination
 */
export async function getUsersPaginated(
  pageSize: number = DEFAULT_PAGE_SIZE,
  cursor?: DocumentSnapshot
) {
  try {
    const usersRef = collection(db, 'users');
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      firestoreLimit(pageSize + 1), // +1 to check if there are more
    ];

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    const q = query(usersRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const hasMore = querySnapshot.docs.length > pageSize;
    const docs = hasMore
      ? querySnapshot.docs.slice(0, pageSize)
      : querySnapshot.docs;

    const users = docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as User[];

    return {
      data: users,
      hasMore,
      cursor: docs.length > 0 ? docs[docs.length - 1] : undefined,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get all users (use sparingly, prefer getPaginatedUsers)
 * @deprecated Use getUsersPaginated for better performance
 */
export async function getUsers(): Promise<User[]> {
  const result = await getUsersPaginated(1000); // Fetch up to 1000 in one call
  let allUsers = result.data;
  let cursor = result.cursor;

  while (result.hasMore) {
    const nextResult = await getUsersPaginated(1000, cursor);
    allUsers = [...allUsers, ...nextResult.data];
    cursor = nextResult.cursor;
    if (!nextResult.hasMore) break;
  }

  return allUsers;
}

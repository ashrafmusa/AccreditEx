/**
 * Firestore-based notification service
 * Replaces localStorage-based notifications with Firebase Firestore
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Notification } from '@/types';
import { getTenantQuery, getTenantStamp } from '@/utils/tenantQuery';

/**
 * Get notifications for a specific user, ordered by timestamp
 */
export async function getNotificationsForUser(
  userId: string
): Promise<Notification[]> {
  try {
    const q = getTenantQuery(
      'notifications',
      where('userId', '==', userId),
      firestoreLimit(50) // Limit to 50 most recent; sorted client-side to avoid composite index dependency
    );

    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp || 0),
      }))
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      }) as Notification[];

    return notifications;
  } catch (error) {
    console.warn('Failed to load notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error}`);
  }
}

/**
 * Mark all notifications for user as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = getTenantQuery('notifications', where('userId', '==', userId), where('read', '==', false));

    const querySnapshot = await getDocs(q);
    for (let start = 0; start < querySnapshot.docs.length; start += 500) {
      const batch = writeBatch(db);
      querySnapshot.docs.slice(start, start + 500).forEach((notification) => {
        batch.update(notification.ref, { read: true });
      });
      await batch.commit();
    }
  } catch (error) {
    throw new Error(`Failed to mark notifications as read: ${error}`);
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  notification: Omit<Notification, 'id'>
): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const payload = Object.fromEntries(
      Object.entries(notification).filter(([, value]) => value !== undefined),
    );
    const docRef = await addDoc(notificationsRef, {
      ...payload,
      ...getTenantStamp(),
      userId,
      timestamp: Timestamp.now(),
      read: false,
    });

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error}`);
  }
}

export async function markNotificationsAsRead(
  notificationIds: string[],
): Promise<void> {
  try {
    for (let start = 0; start < notificationIds.length; start += 500) {
      const batch = writeBatch(db);
      notificationIds.slice(start, start + 500).forEach((notificationId) => {
        batch.update(doc(db, 'notifications', notificationId), { read: true });
      });
      await batch.commit();
    }
  } catch (error) {
    throw new Error(`Failed to mark notifications as read: ${error}`);
  }
}

export async function archiveNotification(
  notificationId: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { archived: true });
  } catch (error) {
    throw new Error(`Failed to archive notification: ${error}`);
  }
}

export async function deleteNotificationsForUser(
  userId: string,
  archivedOnly = false,
): Promise<number> {
  try {
    const constraints = [where('userId', '==', userId)];
    if (archivedOnly) constraints.push(where('archived', '==', true));
    const snapshot = await getDocs(getTenantQuery('notifications', ...constraints));
    for (let start = 0; start < snapshot.docs.length; start += 500) {
      const batch = writeBatch(db);
      snapshot.docs.slice(start, start + 500).forEach((notification) => {
        batch.delete(notification.ref);
      });
      await batch.commit();
    }
    return snapshot.docs.length;
  } catch (error) {
    throw new Error(`Failed to delete notifications: ${error}`);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    throw new Error(`Failed to delete notification: ${error}`);
  }
}

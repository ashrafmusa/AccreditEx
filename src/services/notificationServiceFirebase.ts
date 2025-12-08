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
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Notification } from '@/types';

/**
 * Get notifications for a specific user, ordered by timestamp
 */
export async function getNotificationsForUser(
  userId: string
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(50) // Limit to 50 most recent
    );

    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    })) as Notification[];

    return notifications;
  } catch (error) {
    // Silently handle errors
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
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));

    const querySnapshot = await getDocs(q);
    for (const doc of querySnapshot.docs) {
      await updateDoc(doc.ref, { read: true });
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
    const docRef = await addDoc(notificationsRef, {
      ...notification,
      userId,
      timestamp: Timestamp.now(),
      read: false,
    });

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error}`);
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

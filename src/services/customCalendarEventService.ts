import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { CustomCalendarEvent } from '../types';

const customEventsCollection = collection(db, 'customEvents');

export const getCustomEvents = async (): Promise<CustomCalendarEvent[]> => {
    const eventSnapshot = await getDocs(customEventsCollection);
    return eventSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomCalendarEvent));
};

export const addCustomEvent = async (event: Omit<CustomCalendarEvent, 'id'>): Promise<CustomCalendarEvent> => {
    const docRef = await addDoc(customEventsCollection, event);
    return { id: docRef.id, ...event } as CustomCalendarEvent;
};

export const updateCustomEvent = async (event: CustomCalendarEvent): Promise<void> => {
    const docRef = doc(db, 'customEvents', event.id);
    const { id, ...eventData } = event;
    await updateDoc(docRef, eventData);
};

export const deleteCustomEvent = async (eventId: string): Promise<void> => {
    const docRef = doc(db, 'customEvents', eventId);
    await deleteDoc(docRef);
};
import * as firebase from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { authTokenOptimizer } from "@/services/authTokenOptimizer";

const processEnv = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;

const firebaseEnv = {
    apiKey: import.meta.env.VITE_API_KEY || processEnv.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN || processEnv.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID || processEnv.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET || processEnv.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || processEnv.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID || processEnv.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID || processEnv.VITE_MEASUREMENT_ID
};

const missingFirebaseEnv = Object.entries(firebaseEnv)
    .filter(([key, value]) => key !== 'measurementId' && (!value || String(value).trim() === ''))
    .map(([key]) => key);

if (missingFirebaseEnv.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingFirebaseEnv);
    console.error('Expected Vite variables: VITE_API_KEY, VITE_AUTH_DOMAIN, VITE_PROJECT_ID, VITE_STORAGE_BUCKET, VITE_MESSAGING_SENDER_ID, VITE_APP_ID');
    console.error('If running dev, create `.env` or `.env.local` (or run with production mode).');
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// NOTE: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: firebaseEnv.apiKey,
    authDomain: firebaseEnv.authDomain,
    projectId: firebaseEnv.projectId,
    storageBucket: firebaseEnv.storageBucket,
    messagingSenderId: firebaseEnv.messagingSenderId,
    appId: firebaseEnv.appId,
    measurementId: firebaseEnv.measurementId
};

// Initialize Firebase
const app = !firebase.getApps().length ? firebase.initializeApp(firebaseConfig) : firebase.getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Lazy initialize auth - only when needed (after login page)
let authInstance: Auth | null = null;

export const getAuthInstance = (): Auth => {
    if (!authInstance) {
        authInstance = getAuth(app);
        // Initialize auth token optimizer only after auth is ready
        authTokenOptimizer.initialize(authInstance);
    }
    return authInstance;
};

export const auth = getAuthInstance();

// TEMPORARILY DISABLED - Enable offline persistence for free tier optimization
// Reduces reads by caching data locally
// try {
//     enableIndexedDbPersistence(db).catch((err) => {
//         if (err.code === 'failed-precondition') {
//             console.warn('Multiple tabs open, persistence disabled');
//         } else if (err.code === 'unimplemented') {
//             console.warn('Browser does not support persistence');
//         }
//     });
// } catch (error) {
//     // Handle cases where persistence is already enabled
// }

console.log('🔥 Firebase initialized:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});
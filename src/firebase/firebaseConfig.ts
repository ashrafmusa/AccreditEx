import { authTokenOptimizer } from "@/services/authTokenOptimizer";
import * as firebase from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import {
    connectFirestoreEmulator,
    enableIndexedDbPersistence,
    getFirestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

type ViteEnv = Record<string, string | boolean | undefined>;

const viteEnv = ((import.meta as unknown as { env?: ViteEnv }).env ?? {}) as ViteEnv;
const processEnv = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;

const getEnvValue = (key: string): string | undefined => {
    const viteValue = viteEnv[key];
    if (typeof viteValue === "string" && viteValue.trim() !== "") {
        return viteValue;
    }

    const processValue = processEnv[key];
    if (typeof processValue === "string" && processValue.trim() !== "") {
        return processValue;
    }

    return undefined;
};

const firebaseEnv = {
    apiKey: getEnvValue('VITE_API_KEY'),
    authDomain: getEnvValue('VITE_AUTH_DOMAIN'),
    projectId: getEnvValue('VITE_PROJECT_ID'),
    storageBucket: getEnvValue('VITE_STORAGE_BUCKET'),
    messagingSenderId: getEnvValue('VITE_MESSAGING_SENDER_ID'),
    appId: getEnvValue('VITE_APP_ID'),
    measurementId: getEnvValue('VITE_MEASUREMENT_ID')
};
const useFirebaseEmulators = getEnvValue("VITE_USE_FIREBASE_EMULATORS") === "true";

if (useFirebaseEmulators && !firebaseEnv.projectId?.startsWith("demo-")) {
    throw new Error("Firebase emulators require a demo-* project ID.");
}

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
export const functions = getFunctions(app);

if (useFirebaseEmulators) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

// Lazy initialize auth - only when needed (after login page)
let authInstance: Auth | null = null;

export const getAuthInstance = (): Auth => {
    if (!authInstance) {
        authInstance = getAuth(app);
        if (useFirebaseEmulators) {
            connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
                disableWarnings: true,
            });
        }
        // Initialize auth token optimizer only after auth is ready
        authTokenOptimizer.initialize(authInstance);
    }
    return authInstance;
};

export const auth = getAuthInstance();

// Enable offline persistence for better reliability
if (!useFirebaseEmulators) {
    try {
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence disabled');
            } else if (err.code === 'unimplemented') {
                console.warn('Browser does not support persistence');
            }
        });
    } catch (error) {
        // Handle cases where persistence is already enabled
    }
}

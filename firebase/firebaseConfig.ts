import * as firebase from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// NOTE: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBPkTWdojLlQBG7E9OPWCXPZ_Zzg31YrLg",
    authDomain: "accreditex-79c08.firebaseapp.com",
    projectId: "accreditex-79c08",
    storageBucket: "accreditex-79c08.firebasestorage.app",
    messagingSenderId: "600504438909",
    appId: "1:600504438909:web:5e25200e69243a615e2114",
    measurementId: "G-41932M9TKF"
};

// Initialize Firebase
const app = !firebase.getApps().length ? firebase.initializeApp(firebaseConfig) : firebase.getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
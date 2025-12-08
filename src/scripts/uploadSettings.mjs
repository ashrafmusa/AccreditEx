import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadSettings() {
  try {
    // Read settings.json
    const settingsPath = path.join(__dirname, '../data/settings.json');
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Upload to appSettings collection with a document ID
    const settingsRef = doc(collection(db, 'appSettings'), 'config');
    await setDoc(settingsRef, settingsData, { merge: true });

    console.log('✓ Settings uploaded successfully to appSettings/config');
  } catch (error) {
    console.error('Error uploading settings:', error.message);
    process.exit(1);
  }
}

uploadSettings();

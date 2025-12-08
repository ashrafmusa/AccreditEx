#!/usr/bin/env node

/**
 * Firebase Firestore Data Import Script
 * Imports users and appSettings from JSON files
 * Usage: node scripts/importFirestoreData.mjs
 * 
 * Before running:
 * 1. Ensure you have Firebase authentication configured
 * 2. Set FIREBASE_PROJECT_ID environment variable (or use default: accreditex-79c08)
 * 3. Make sure firestore.rules allow the required operations
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Firebase configuration (from environment variables)
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.VITE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.VITE_PROJECT_ID || 'accreditex-79c08',
  storageBucket: process.env.VITE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.VITE_APP_ID || 'YOUR_APP_ID',
};

console.log('🚀 Firebase Firestore Data Import Script\n');
console.log(`📍 Project ID: ${firebaseConfig.projectId}`);
console.log(`🔐 Auth Domain: ${firebaseConfig.authDomain}\n`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to load JSON file
function loadJsonFile(filename) {
  try {
    const filePath = resolve(__dirname, '../data', filename);
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load ${filename}:`, error.message);
    return null;
  }
}

// Import data
async function importData() {
  try {
    console.log('📥 Starting data import...\n');

    // Import users collection
    console.log('👥 Importing users collection...');
    const usersData = loadJsonFile('users.json');
    
    if (usersData && Array.isArray(usersData)) {
      let importedCount = 0;
      for (const user of usersData) {
        try {
          await setDoc(doc(collection(db, 'users'), user.id), user);
          importedCount++;
          process.stdout.write(`\r   Imported ${importedCount}/${usersData.length} users...`);
        } catch (error) {
          console.error(`\n   ❌ Failed to import user ${user.id}:`, error.message);
        }
      }
      console.log(`\n✅ Successfully imported ${importedCount} users\n`);
    } else {
      console.warn('⚠️  No users data to import\n');
    }

    // Import appSettings
    console.log('⚙️  Importing appSettings...');
    const settingsData = loadJsonFile('settings.json');
    
    if (settingsData) {
      try {
        await setDoc(doc(collection(db, 'appSettings'), 'default'), settingsData);
        console.log('✅ Successfully imported appSettings\n');
      } catch (error) {
        console.error(`❌ Failed to import appSettings:`, error.message);
      }
    } else {
      console.warn('⚠️  No appSettings data to import\n');
    }

    console.log('🎉 Data import process completed!\n');
    console.log('📊 Next steps:');
    console.log('   1. Verify data in Firebase Console');
    console.log('   2. Create composite indexes (see COMPOSITE_INDEXES_GUIDE.md)');
    console.log('   3. Run the application: npm run dev');
    console.log('   4. Check Usage Monitor in Settings for usage stats\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Import error:', error);
    process.exit(1);
  }
}

// Run import
importData();

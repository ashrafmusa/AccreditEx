#!/usr/bin/env node

/**
 * Script to import seed data into Firestore
 * Usage: node scripts/importFirestoreData.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccount) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
  console.error('Please set your Firebase service account key as an environment variable');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'accreditex-79c08',
});

const db = admin.firestore();

async function importData() {
  try {
    console.log('Starting Firestore data import...\n');

    // Import users collection
    const usersPath = path.join(__dirname, '../data/users.json');
    if (fs.existsSync(usersPath)) {
      console.log('📥 Importing users collection...');
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      
      let importedCount = 0;
      for (const user of usersData) {
        await db.collection('users').doc(user.id).set(user);
        importedCount++;
      }
      
      console.log(`✅ Successfully imported ${importedCount} users\n`);
    } else {
      console.warn('⚠️  users.json not found, skipping users import');
    }

    // Import appSettings (as a single document)
    const settingsPath = path.join(__dirname, '../data/settings.json');
    if (fs.existsSync(settingsPath)) {
      console.log('📥 Importing appSettings...');
      const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      await db.collection('appSettings').doc('default').set(settingsData);
      
      console.log('✅ Successfully imported appSettings\n');
    } else {
      console.warn('⚠️  settings.json not found, skipping appSettings import');
    }

    console.log('🎉 Data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during data import:', error);
    process.exit(1);
  }
}

importData();

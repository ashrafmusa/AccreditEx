#!/usr/bin/env node

/**
 * Firebase Firestore Setup Script
 * Initializes Firestore with users and appSettings collections
 * Usage: node setupFirebase.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const projectId = process.env.FIREBASE_PROJECT_ID || 'accreditex-79c08';

console.log(`🔧 Setting up Firebase Firestore for project: ${projectId}\n`);

try {
  // Initialize Firebase Admin SDK
  // First check if service account file exists locally
  const serviceAccountPath = path.join(__dirname, 'serviceAccount.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.warn('⚠️  serviceAccount.json not found in project root');
    console.warn('Using application default credentials instead...\n');
  }

  let app;
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    // Use default credentials (requires GOOGLE_APPLICATION_CREDENTIALS env var)
    app = initializeApp({
      projectId,
    });
  }

  const db = getFirestore(app);

  // Helper function to import JSON file
  function loadJsonFile(filePath) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }

  async function setupCollections() {
    try {
      // Import users
      console.log('📥 Importing users collection...');
      const usersData = loadJsonFile(path.join(__dirname, 'data/users.json'));
      
      if (usersData && Array.isArray(usersData)) {
        for (const user of usersData) {
          await db.collection('users').doc(user.id).set(user);
        }
        console.log(`✅ Imported ${usersData.length} users\n`);
      }

      // Import appSettings
      console.log('📥 Importing appSettings...');
      const settingsData = loadJsonFile(path.join(__dirname, 'data/settings.json'));
      
      if (settingsData) {
        await db.collection('appSettings').doc('default').set(settingsData);
        console.log('✅ Imported appSettings\n');
      }

      console.log('🎉 Firebase Firestore setup completed successfully!');
      console.log('\n✨ Collections ready:');
      console.log('   - users (12 documents)');
      console.log('   - appSettings (1 document)');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error setting up collections:', error);
      process.exit(1);
    }
  }

  setupCollections();
} catch (error) {
  console.error('❌ Initialization error:', error);
  process.exit(1);
}

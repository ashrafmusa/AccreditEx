#!/usr/bin/env node

/**
 * Check if required Firebase collections exist and have data
 * This helps diagnose if the app won't start because collections are empty
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Firebase Collections Check\n');

const projectId = process.env.VITE_PROJECT_ID;
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!projectId) {
  console.log('❌ VITE_PROJECT_ID not set in .env');
  process.exit(1);
}

console.log(`Project ID: ${projectId}\n`);

// Initialize Firebase Admin SDK
let db;

if (fs.existsSync(serviceAccountPath)) {
  console.log('📝 Using serviceAccountKey.json for authentication\n');
  
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId
  });
  db = admin.firestore();
} else {
  console.log('⚠️  serviceAccountKey.json not found');
  console.log('   This tool requires Firebase Admin SDK authentication');
  console.log('   To use this tool:');
  console.log('   1. Download serviceAccountKey.json from Firebase Console');
  console.log('   2. Place it in the project root');
  console.log('   3. Run this script again\n');
  
  console.log('📝 Without serviceAccountKey.json, checking what we know:\n');
  
  const requiredCollections = [
    { name: 'appSettings', required: true, reason: 'App initialization requires this' },
    { name: 'standards', required: false, reason: 'Application standards/procedures' },
    { name: 'accreditationPrograms', required: false, reason: 'List of programs' },
    { name: 'departments', required: false, reason: 'Department listings' },
    { name: 'trainingPrograms', required: false, reason: 'Training courses' },
    { name: 'competencies', required: false, reason: 'Employee competencies' },
    { name: 'risks', required: false, reason: 'Risk register' },
    { name: 'documents', required: false, reason: 'Controlled documents' },
    { name: 'projects', required: false, reason: 'Accreditation projects' },
    { name: 'users', required: false, reason: 'User profiles' },
  ];
  
  console.log('Required Collections:\n');
  requiredCollections.forEach(col => {
    const symbol = col.required ? '🔴' : '⚪';
    const status = col.required ? 'REQUIRED' : 'Optional';
    console.log(`${symbol} ${col.name.padEnd(25)} - ${status.padEnd(10)} (${col.reason})`);
  });
  
  console.log('\n---\n');
  console.log('To fully diagnose why the app won\'t start:\n');
  console.log('Option 1: Add serviceAccountKey.json');
  console.log('  - Download from Firebase Console > Project Settings > Service Accounts');
  console.log('  - Place in project root directory');
  console.log('  - Run: node firebase-collections-check.cjs\n');
  
  console.log('Option 2: Check Firebase Console Directly');
  console.log(`  - Go to: https://console.firebase.google.com/project/${projectId}/firestore/databases/-/data`);
  console.log('  - Look for "appSettings" collection');
  console.log('  - Verify it has at least one document with required fields\n');
  
  console.log('Option 3: Use Firebase CLI');
  console.log('  - Install: npm install -g firebase-tools');
  console.log(`  - Login: firebase login`);
  console.log('  - List collections: firebase firestore:inspect\n');
  
  process.exit(0);
}

// If we have authentication, proceed with checks
async function checkCollections() {
  try {
    console.log('Checking required collections:\n');
    
    // List all collections
    const collections = await db.listCollections();
    const collectionNames = collections.map(c => c.id);
    
    if (collectionNames.length === 0) {
      console.log('❌ No collections found in Firestore!');
      console.log('   This is why the app won\'t start.\n');
      console.log('Required: Create the "appSettings" collection with at least one document.\n');
      return;
    }
    
    console.log(`Found ${collectionNames.length} collections: ${collectionNames.join(', ')}\n`);
    
    // Check appSettings specifically
    console.log('Checking appSettings collection:\n');
    
    if (!collectionNames.includes('appSettings')) {
      console.log('❌ CRITICAL: appSettings collection NOT FOUND');
      console.log('   This is required for app startup!\n');
      console.log('Action: Create appSettings collection in Firebase Console\n');
    } else {
      const appSettingsRef = db.collection('appSettings');
      const snapshot = await appSettingsRef.get();
      
      if (snapshot.empty) {
        console.log('❌ appSettings collection EXISTS but is EMPTY');
        console.log('   Add at least one document to this collection.\n');
        console.log('Required fields for appSettings document:');
        console.log('  - appName (string)');
        console.log('  - logoUrl (string)');
        console.log('  - primaryColor (string, hex color)');
        console.log('  - defaultLanguage (string: "en" or "ar")');
        console.log('  - defaultUserRole (string: "Admin", "ProjectLead", etc)');
        console.log('  - passwordPolicy (object)');
        console.log('  - globeSettings (object)');
        console.log('  - appearance (object)');
        console.log('  - notifications (object)');
        console.log('  - accessibility (object)\n');
      } else {
        console.log(`✅ appSettings collection has ${snapshot.size} document(s)\n`);
        
        snapshot.forEach((doc, index) => {
          console.log(`Document ${index + 1}: ${doc.id}`);
          const data = doc.data();
          console.log(`  - appName: ${data.appName || '❌ MISSING'}`);
          console.log(`  - primaryColor: ${data.primaryColor || '❌ MISSING'}`);
          console.log(`  - defaultLanguage: ${data.defaultLanguage || '❌ MISSING'}`);
          console.log(`  - passwordPolicy: ${data.passwordPolicy ? '✅' : '❌ MISSING'}`);
          console.log(`  - appearance: ${data.appearance ? '✅' : '❌ MISSING'}`);
          console.log(`  - notifications: ${data.notifications ? '✅' : '❌ MISSING'}`);
          console.log(`  - accessibility: ${data.accessibility ? '✅' : '❌ MISSING'}\n`);
        });
      }
    }
    
    // Check other common collections
    console.log('Checking other collections:\n');
    
    const commonCollections = [
      'standards', 'accreditationPrograms', 'departments', 
      'trainingPrograms', 'competencies', 'risks', 
      'documents', 'projects', 'users'
    ];
    
    for (const collName of commonCollections) {
      if (collectionNames.includes(collName)) {
        const col = db.collection(collName);
        const snap = await col.limit(1).get();
        const count = (await col.get()).size;
        console.log(`✅ ${collName.padEnd(25)} - ${count} documents`);
      } else {
        console.log(`⚪ ${collName.padEnd(25)} - Not created yet`);
      }
    }
    
    console.log('\n---\n');
    console.log('Summary:\n');
    
    if (collectionNames.includes('appSettings') && !snapshot.empty) {
      console.log('✅ appSettings collection is properly set up');
      console.log('✅ App should be able to start\n');
      console.log('If app is still not starting:');
      console.log('- Check browser DevTools Console for errors');
      console.log('- Verify Firebase credentials in .env are correct');
      console.log('- Check network connectivity to Firebase');
    } else {
      console.log('❌ appSettings collection is missing or empty');
      console.log('❌ THIS IS WHY THE APP WON\'T START\n');
      console.log('Action: Create appSettings collection in Firebase Console');
      console.log(`URL: https://console.firebase.google.com/project/${projectId}/firestore/databases/-/data\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking Firebase:', error.message);
    console.log('\nPossible causes:');
    console.log('- serviceAccountKey.json is invalid or expired');
    console.log('- Firebase project is suspended');
    console.log('- Network cannot reach Firebase');
    process.exit(1);
  }
}

checkCollections();

#!/usr/bin/env node

/**
 * Simple Firebase CLI helper script
 * This creates the appSettings collection using Firebase tools
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Firebase Collections Setup via CLI\n');

const projectId = 'accreditex-79c08';
const settingsFile = path.join(__dirname, 'src/data/settings.json');

// Check if settings file exists
if (!fs.existsSync(settingsFile)) {
  console.log('❌ settings.json not found at:', settingsFile);
  process.exit(1);
}

const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

console.log('📋 Settings to upload:\n');
console.log(JSON.stringify(settings, null, 2));
console.log('\n');

console.log('════════════════════════════════════════════════════════════\n');
console.log('To create appSettings collection, choose an option:\n');

console.log('OPTION 1: Use Firebase Console (Easiest)');
console.log('──────────────────────────────────────\n');
console.log(`1. Go to Firebase Console:`);
console.log(`   https://console.firebase.google.com/project/${projectId}/firestore/data\n`);
console.log('2. Click "+ Start collection"\n');
console.log('3. Collection ID: appSettings\n');
console.log('4. Document ID: default\n');
console.log('5. Click "Save"\n');
console.log('6. Click on the document and add these fields:');
console.log('   (Copy-paste the JSON above)\n');
console.log('7. Refresh your app in browser\n\n');

console.log('OPTION 2: Use Firebase Emulator (Local Development)');
console.log('──────────────────────────────────────────────────\n');
console.log('1. Install firebase-tools:');
console.log('   npm install -g firebase-tools\n');
console.log('2. Start emulator:');
console.log('   firebase emulator:start\n');
console.log('3. Access at: http://localhost:4000\n');
console.log('4. Create collection in Firestore Emulator UI\n\n');

console.log('OPTION 3: Use Firebase CLI (Requires Authentication)');
console.log('───────────────────────────────────────────────────\n');
console.log('1. Install firebase-tools:');
console.log('   npm install -g firebase-tools\n');
console.log('2. Login to Firebase:');
console.log('   firebase login\n');
console.log('3. Run this command:');
const jsonStr = JSON.stringify(settings).replace(/'/g, "\\'");
console.log(`   firebase --project=${projectId} firestore:set appSettings/default --merge < data.json\n`);

console.log('════════════════════════════════════════════════════════════\n');

console.log('JSON Content to Copy (for Firebase Console):\n');
console.log('```json');
console.log(JSON.stringify(settings, null, 2));
console.log('```\n');

console.log('After setup:');
console.log('  1. Refresh your app in browser (Ctrl+R)');
console.log('  2. App should load successfully');
console.log('  3. Check browser console (F12) for any errors\n');

process.exit(0);

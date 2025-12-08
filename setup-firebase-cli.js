#!/usr/bin/env node

/**
 * Simple Firebase CLI helper script
 * This creates the appSettings collection using Firebase tools
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log('To complete setup, choose an option:\n');

console.log('Option 1: Use Firebase Emulator (Local Development)');
console.log('─────────────────────────────────────────────────');
console.log('  1. Install firebase-tools globally:');
console.log('     npm install -g firebase-tools\n');
console.log('  2. Start emulator:');
console.log('     firebase emulator:start\n');
console.log('  3. Access Emulator UI:');
console.log('     http://localhost:4000\n\n');

console.log('Option 2: Use Firebase Console (Production)');
console.log('──────────────────────────────────────────');
console.log(`  1. Go to: https://console.firebase.google.com/project/${projectId}/firestore/data`);
console.log('  2. Click "+ Start collection"');
console.log('  3. Collection ID: appSettings');
console.log('  4. Document ID: default');
console.log('  5. Copy-paste the JSON above\n\n');

console.log('Option 3: Use Firebase CLI with Authentication');
console.log('──────────────────────────────────────────────');
console.log('  1. Install firebase-tools globally:');
console.log('     npm install -g firebase-tools\n');
console.log('  2. Authenticate:');
console.log('     firebase login\n');
console.log('  3. Run this command to upload:');
console.log(`     firebase --project=${projectId} firestore:delete appSettings && firebase --project=${projectId} firestore:set appSettings/default --merge --data='${JSON.stringify(settings)}'`);
console.log('\n');

console.log('Once setup is complete:');
console.log('  1. Refresh your app (Ctrl+R)');
console.log('  2. App should load successfully');
console.log('  3. Check browser console (F12) for any errors\n');

process.exit(0);

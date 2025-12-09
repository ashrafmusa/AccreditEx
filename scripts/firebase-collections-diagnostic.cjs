#!/usr/bin/env node

/**
 * Firebase Collections Diagnostic
 * Helps determine why app won't start
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Collections Diagnostic\n');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
let projectId = null;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_PROJECT_ID\s*=\s*([^\n]+)/);
  if (match) {
    projectId = match[1].trim();
  }
}

if (!projectId) {
  console.log('❌ VITE_PROJECT_ID not found in .env\n');
  process.exit(1);
}

console.log(`Project ID: ${projectId}\n`);
console.log('Firebase Console URL:');
console.log(`https://console.firebase.google.com/project/${projectId}/firestore/databases/-/data\n`);

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('WHY THE APP WON\'T START\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('App Initialization Flow (App.tsx):\n');
console.log('  1. AppInitializer component starts');
console.log('  2. Calls fetchAllAppData()');
console.log('     └─ This calls getAppSettings() from Firestore');
console.log('  3. Waits for appSettings to load');
console.log('  4. Checks: if (isLoading || !appSettings)');
console.log('  5. If appSettings is null → Shows LoadingScreen\n');

console.log('─────────────────────────────────────────────────────────────────\n');
console.log('MOST LIKELY PROBLEM:\n');
console.log('─────────────────────────────────────────────────────────────────\n');

console.log('❌ The "appSettings" collection is MISSING or EMPTY in Firestore\n');

console.log('What happens:');
console.log('  • getAppSettings() tries to read from Firestore');
console.log('  • Collection doesn\'t exist → returns null');
console.log('  • appSettings stays null in Zustand store');
console.log('  • App is stuck on LoadingScreen forever\n');

console.log('─────────────────────────────────────────────────────────────────\n');
console.log('HOW TO FIX IT:\n');
console.log('─────────────────────────────────────────────────────────────────\n');

console.log('STEP 1: Open Firebase Console');
console.log(`  URL: https://console.firebase.google.com/project/${projectId}/firestore\n`);

console.log('STEP 2: Click on "Firestore Database"\n');

console.log('STEP 3: Check if "appSettings" collection exists');
console.log('  • If it EXISTS → Check if it has documents');
console.log('  • If it DOESN\'T EXIST → Create it (see STEP 4)\n');

console.log('STEP 4: Create "appSettings" collection');
console.log('  • Click "+ Start collection"');
console.log('  • Collection ID: appSettings');
console.log('  • Document ID: default');
console.log('  • Add these fields:\n');

const fields = [
  { name: 'appName', type: 'string', value: 'Accreditex' },
  { name: 'logoUrl', type: 'string', value: '' },
  { name: 'primaryColor', type: 'string', value: '#3B82F6' },
  { name: 'defaultLanguage', type: 'string', value: 'en' },
  { name: 'defaultUserRole', type: 'string', value: 'Admin' },
];

fields.forEach(f => {
  console.log(`    ${f.name.padEnd(20)} (${f.type.padEnd(8)}) = "${f.value}"`);
});

console.log('\n  • For nested objects (passwordPolicy, appearance, etc),');
console.log('    create them as "Map" type in Firebase Console\n');

console.log('─────────────────────────────────────────────────────────────────\n');
console.log('REQUIRED FIELD STRUCTURE:\n');
console.log('─────────────────────────────────────────────────────────────────\n');

const defaultSettings = {
  appName: "Accreditex",
  logoUrl: "",
  primaryColor: "#3B82F6",
  defaultLanguage: "en",
  defaultUserRole: "Admin",
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: false
  },
  globeSettings: {
    baseColor: "#1e40af",
    markerColor: "#ef4444",
    glowColor: "#3b82f6",
    scale: 1,
    darkness: 0.5,
    lightIntensity: 1,
    rotationSpeed: 0.1
  },
  appearance: {
    compactMode: false,
    sidebarCollapsed: false,
    showAnimations: true,
    cardStyle: "default"
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    projectUpdates: true,
    trainingDueDates: true,
    auditSchedules: true
  },
  accessibility: {
    fontSize: "medium",
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false
  }
};

console.log(JSON.stringify(defaultSettings, null, 2));

console.log('\n─────────────────────────────────────────────────────────────────\n');
console.log('QUICK VERIFICATION:\n');
console.log('─────────────────────────────────────────────────────────────────\n');

console.log('After creating appSettings in Firebase:\n');
console.log('  1. Refresh your app in browser');
console.log('  2. Open browser DevTools (F12 → Console)');
console.log('  3. Look for any errors about appSettings');
console.log('  4. App should load successfully\n');

console.log('═══════════════════════════════════════════════════════════════\n');

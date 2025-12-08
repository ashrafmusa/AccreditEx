#!/usr/bin/env node

/**
 * Firebase Backend Health Check
 * Tests actual Firebase project connectivity
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Firebase Project Health Check');
console.log('═══════════════════════════════════════════════════════════\n');

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1] : null;
};

const projectId = getEnvVar('VITE_PROJECT_ID');
const authDomain = getEnvVar('VITE_AUTH_DOMAIN');

console.log(`Project ID: ${projectId}`);
console.log(`Auth Domain: ${authDomain}`);
console.log('\n1. Testing Firestore connectivity...');

// Test Firestore endpoint
const firestoreTest = new Promise((resolve) => {
  const req = https.get(`https://firestore.googleapis.com/v1/projects/${projectId}`, 
    { timeout: 5000 },
    (res) => {
      if (res.statusCode === 200) {
        console.log('   ✓ Firestore API is reachable');
        resolve(true);
      } else if (res.statusCode === 403) {
        console.log('   ⚠ Firestore API responds (403) - permissions may be restricted');
        resolve(true);
      } else if (res.statusCode === 404) {
        console.log('   ⚠ Project may not be found - check PROJECT_ID in .env');
        resolve(false);
      } else {
        console.log(`   ⚠ Firestore API responded with status ${res.statusCode}`);
        resolve(true);
      }
    }
  );
  
  req.on('error', (error) => {
    console.log(`   ✗ Cannot reach Firestore: ${error.code}`);
    resolve(false);
  });
  
  req.on('timeout', () => {
    req.destroy();
    console.log('   ✗ Firestore request timed out (5s) - network issue?');
    resolve(false);
  });
});

console.log('\n2. Testing Authentication endpoint...');

// Test Auth endpoint
const authTest = new Promise((resolve) => {
  const req = https.get('https://securetoken.googleapis.com/v1/accounts:signUp?key=' + getEnvVar('VITE_API_KEY'),
    { timeout: 5000 },
    (res) => {
      if (res.statusCode === 400 || res.statusCode === 200) {
        console.log('   ✓ Firebase Auth API is reachable');
        resolve(true);
      } else {
        console.log(`   ⚠ Auth API responded with status ${res.statusCode}`);
        resolve(true);
      }
    }
  );
  
  req.on('error', (error) => {
    console.log(`   ✗ Cannot reach Auth API: ${error.code}`);
    resolve(false);
  });
  
  req.on('timeout', () => {
    req.destroy();
    console.log('   ✗ Auth API request timed out (5s) - network issue?');
    resolve(false);
  });
});

Promise.all([firestoreTest, authTest]).then((results) => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Results');
  console.log('═══════════════════════════════════════════════════════════\n');

  const canReachFirestore = results[0];
  const canReachAuth = results[1];

  if (canReachFirestore && canReachAuth) {
    console.log('✅ Your Firebase project is reachable from this network!');
    console.log('\nIf the app still loads forever, the issue is likely:');
    console.log('  • Missing or incorrect Firestore rules');
    console.log('  • Missing /users collection');
    console.log('  • Missing other required collections');
    console.log('  • Browser console errors blocking initialization');
  } else if (!canReachFirestore || !canReachAuth) {
    console.log('❌ Cannot reach Firebase from this network!');
    console.log('\nPossible causes:');
    console.log('  • Network/firewall blocking googleapis.com');
    console.log('  • VPN/Proxy issues');
    console.log('  • Incorrect .env credentials');
    console.log('  • Firebase project deleted or suspended');
    console.log('\nFix:');
    console.log('  1. Check your internet connection');
    console.log('  2. Verify .env has correct Firebase credentials');
    console.log('  3. Try: npm run dev && visit http://localhost:3001/');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
});

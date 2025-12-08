#!/usr/bin/env node

/**
 * Firebase Diagnostics Script
 * Checks Firebase configuration and connectivity
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('  Firebase Configuration Diagnostics');
console.log('═══════════════════════════════════════════════════════════\n');

// 1. Check .env file
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = [
    'VITE_API_KEY',
    'VITE_AUTH_DOMAIN',
    'VITE_PROJECT_ID',
    'VITE_STORAGE_BUCKET',
    'VITE_MESSAGING_SENDER_ID',
    'VITE_APP_ID'
  ];
  
  let allPresent = true;
  envVars.forEach(variable => {
    if (envContent.includes(`${variable}=`) && !envContent.includes(`${variable}=\n`)) {
      console.log(`   ✓ ${variable} is set`);
    } else {
      console.log(`   ✗ ${variable} is missing or empty`);
      allPresent = false;
    }
  });

  if (!allPresent) {
    console.log('\n   WARNING: Some Firebase environment variables are missing!');
  }
} else {
  console.log('   ✗ .env file not found');
}

// 2. Check Firebase config file
console.log('\n2. Checking Firebase configuration file...');
const firebaseConfigPath = path.join(__dirname, 'src/firebase/firebaseConfig.ts');
if (fs.existsSync(firebaseConfigPath)) {
  console.log('   ✓ firebaseConfig.ts exists');
  const configContent = fs.readFileSync(firebaseConfigPath, 'utf8');
  
  const checks = [
    { name: 'initializeApp', check: configContent.includes('initializeApp') },
    { name: 'getFirestore', check: configContent.includes('getFirestore') },
    { name: 'getAuth', check: configContent.includes('getAuth') },
    { name: 'getStorage', check: configContent.includes('getStorage') },
    { name: 'enableIndexedDbPersistence', check: configContent.includes('enableIndexedDbPersistence') }
  ];
  
  checks.forEach(check => {
    if (check.check) {
      console.log(`   ✓ ${check.name} is configured`);
    } else {
      console.log(`   ✗ ${check.name} is missing`);
    }
  });
} else {
  console.log('   ✗ firebaseConfig.ts not found');
}

// 3. Check Firebase hooks
console.log('\n3. Checking Firebase hooks...');
const hooksPath = path.join(__dirname, 'src/firebase/firebaseHooks.ts');
if (fs.existsSync(hooksPath)) {
  console.log('   ✓ firebaseHooks.ts exists');
  const hooksContent = fs.readFileSync(hooksPath, 'utf8');
  
  if (hooksContent.includes('onAuthStateChanged')) {
    console.log('   ✓ Auth state monitoring is configured');
  } else {
    console.log('   ✗ Auth state monitoring missing');
  }
} else {
  console.log('   ✗ firebaseHooks.ts not found');
}

// 4. Check package.json for Firebase dependencies
console.log('\n4. Checking Firebase dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const firebaseDeps = [
    'firebase'
  ];
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  firebaseDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`   ✓ ${dep} is installed (version: ${allDeps[dep]})`);
    } else {
      console.log(`   ✗ ${dep} is NOT installed`);
    }
  });
} else {
  console.log('   ✗ package.json not found');
}

// 5. Check if node_modules/firebase exists
console.log('\n5. Checking Firebase module installation...');
const firebaseModulePath = path.join(__dirname, 'node_modules/firebase');
if (fs.existsSync(firebaseModulePath)) {
  console.log('   ✓ Firebase modules are installed in node_modules');
  
  const submodules = ['app', 'auth', 'firestore', 'storage'];
  let missingCount = 0;
  submodules.forEach(mod => {
    const modPath = path.join(firebaseModulePath, mod);
    if (fs.existsSync(modPath)) {
      console.log(`   ✓ firebase/${mod} is available`);
    } else {
      console.log(`   ✗ firebase/${mod} is missing`);
      missingCount++;
    }
  });
  
  if (missingCount > 0) {
    console.log(`\n   WARNING: ${missingCount} Firebase module(s) missing - run: npm install`);
  }
} else {
  console.log('   ✗ Firebase modules NOT installed - run: npm install');
}

// 6. Check Vite environment setup
console.log('\n6. Checking Vite environment setup...');
const vitePath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(vitePath)) {
  console.log('   ✓ vite.config.ts exists');
  const viteContent = fs.readFileSync(vitePath, 'utf8');
  if (viteContent.includes('import.meta.env')) {
    console.log('   ✓ Vite environment variables are supported');
  }
} else {
  console.log('   ✗ vite.config.ts not found');
}

// 7. Check for users collection in Firestore config
console.log('\n7. Checking Firestore initialization patterns...');
const appPath = path.join(__dirname, 'src/App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  if (appContent.includes('fetchAllAppData') || appContent.includes('useFirebaseAuth')) {
    console.log('   ✓ App initializes Firebase data fetching');
  } else {
    console.log('   ⚠ App data initialization pattern unclear');
  }
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Diagnostics Complete');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Summary:');
console.log('  All configuration files should be in place and Firebase');
console.log('  dependencies should be installed.');
console.log('\nNext Steps:');
console.log('  1. Visit http://localhost:3001/ in your browser');
console.log('  2. Open browser DevTools (F12)');
console.log('  3. Check Console tab for errors');
console.log('  4. Check Network tab for failed requests');
console.log('\nCommon Issues:');
console.log('  • Loading forever: Check Network tab for stuck requests');
console.log('  • Firebase errors: Verify .env credentials are correct');
console.log('  • White screen: Check Console for JavaScript errors');
console.log('\n');

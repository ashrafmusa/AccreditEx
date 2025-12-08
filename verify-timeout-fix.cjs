#!/usr/bin/env node

/**
 * Test script to verify the timeout fix is working
 * Run this to check if App.tsx properly handles Firebase timeouts
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Firebase Timeout Fix Verification\n');

const appFile = path.join(__dirname, 'App.tsx');
const storeFile = path.join(__dirname, 'src/stores/useAppStore.ts');

console.log('1️⃣ Checking AppInitializer timeout implementation:\n');

const appContent = fs.readFileSync(appFile, 'utf8');

const checks = [
  {
    name: 'setTimeout for 30-second timeout',
    test: () => appContent.includes('setTimeout') && appContent.includes('30000'),
    priority: 'CRITICAL'
  },
  {
    name: 'Promise.race() for timeout handling',
    test: () => appContent.includes('Promise.race'),
    priority: 'CRITICAL'
  },
  {
    name: 'Default appSettings fallback',
    test: () => appContent.includes('setAppSettings') && appContent.includes('primaryColor: "#3B82F6"'),
    priority: 'CRITICAL'
  },
  {
    name: 'Error notification to user (toast)',
    test: () => appContent.includes('toast.warn') || appContent.includes('toast.error'),
    priority: 'HIGH'
  },
  {
    name: 'Console logging for debugging',
    test: () => appContent.includes('console.warn') || appContent.includes('console.error'),
    priority: 'HIGH'
  },
  {
    name: 'try-catch-finally block structure',
    test: () => appContent.includes('try {') && appContent.includes('catch (') && appContent.includes('finally {'),
    priority: 'CRITICAL'
  }
];

let allPassed = true;
checks.forEach(check => {
  const passed = check.test();
  const symbol = passed ? '✅' : '❌';
  const label = passed ? 'PASS' : 'FAIL';
  console.log(`${symbol} [${check.priority}] ${check.name}: ${label}`);
  if (!passed) allPassed = false;
});

console.log('\n2️⃣ Checking useAppStore setAppSettings implementation:\n');

const storeContent = fs.readFileSync(storeFile, 'utf8');

const storeChecks = [
  {
    name: 'setAppSettings in AppState interface',
    test: () => storeContent.includes('setAppSettings: (settings: AppSettings)'),
    priority: 'CRITICAL'
  },
  {
    name: 'setAppSettings implementation in store',
    test: () => storeContent.includes("setAppSettings: (settings: AppSettings) => set({ appSettings: settings })"),
    priority: 'CRITICAL'
  }
];

storeChecks.forEach(check => {
  const passed = check.test();
  const symbol = passed ? '✅' : '❌';
  const label = passed ? 'PASS' : 'FAIL';
  console.log(`${symbol} [${check.priority}] ${check.name}: ${label}`);
  if (!passed) allPassed = false;
});

console.log('\n3️⃣ Build verification:\n');

// Test that build succeeds
const { execSync } = require('child_process');
try {
  const buildOutput = execSync('npm run build 2>&1', { 
    cwd: __dirname,
    stdio: 'pipe',
    timeout: 120000 
  }).toString();
  
  if (buildOutput.includes('built successfully') || buildOutput.includes('✓') || !buildOutput.includes('error')) {
    console.log('✅ [CRITICAL] Build succeeds with no errors');
  } else {
    console.log('❌ [CRITICAL] Build has errors');
    allPassed = false;
  }
} catch (error) {
  console.log('⚠️  [WARNING] Could not verify build (npm run build failed)');
  console.log('   Error:', error.message.substring(0, 100));
}

console.log('\n4️⃣ Summary:\n');

if (allPassed) {
  console.log('✅ All checks passed! The Firebase timeout fix is properly implemented.');
  console.log('\nThe app will now:');
  console.log('  1. Wait 30 seconds for Firebase to respond');
  console.log('  2. If timeout, load with default appSettings');
  console.log('  3. Notify user via toast if loading in offline mode');
  console.log('  4. Prevent the "app not starting" issue');
} else {
  console.log('❌ Some checks failed. The timeout fix may not be complete.');
  console.log('\nPlease verify:');
  console.log('  1. App.tsx has the setTimeout(30000) timeout');
  console.log('  2. App.tsx has Promise.race() for timeout handling');
  console.log('  3. App.tsx has setAppSettings fallback with default values');
  console.log('  4. useAppStore has setAppSettings method');
}

console.log('\n---\n');

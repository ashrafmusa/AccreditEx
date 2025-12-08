#!/usr/bin/env node

/**
 * Test Firebase fallback scenario
 * This script tests what happens when Firebase calls timeout
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Fallback Test\n');

// Read useAppStore.ts to check for fallback logic
const storeFile = path.join(__dirname, 'src/stores/useAppStore.ts');
const storeContent = fs.readFileSync(storeFile, 'utf8');

console.log('1️⃣ Checking fetchAllData() error handling:\n');
const fetchMatch = storeContent.match(/fetchAllData:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},/m);
if (fetchMatch) {
  console.log(fetchMatch[0].substring(0, 500) + '...\n');
  
  if (fetchMatch[0].includes('catch')) {
    console.log('✅ Has try-catch block');
  } else {
    console.log('❌ Missing try-catch block - errors not handled!');
  }
  
  if (fetchMatch[0].includes('console.error') || fetchMatch[0].includes('toast')) {
    console.log('✅ Errors are logged/notified');
  } else {
    console.log('⚠️ Errors are caught but not reported to user');
  }
}

console.log('\n2️⃣ Checking if appSettings has default/fallback value:\n');
const initialState = storeContent.match(/const\s+useAppStore\s*=.*?state:\s*\{[\s\S]*?\n\}/m);
if (initialState) {
  const stateStr = initialState[0];
  if (stateStr.includes('appSettings:') && !stateStr.match(/appSettings:\s*null|appSettings:\s*undefined/)) {
    console.log('✅ appSettings has a default value (may prevent indefinite loading)');
  } else {
    console.log('⚠️ appSettings defaults to null/undefined - app will wait forever if fetch fails');
  }
}

console.log('\n3️⃣ Checking fetchAllData implementation:\n');
const fetchImpl = storeContent.match(/fetchAllData:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?Promise\.all\(\[[\s\S]*?\]\)/m);
if (fetchImpl) {
  console.log('Promise.all() calls:');
  const calls = fetchImpl[0].match(/getAppSettings\(\)|getAppDocuments\(\)|getAppStandards\(\)/g);
  if (calls) {
    calls.forEach(call => console.log(`  - ${call}`));
  }
  console.log('\n⚠️ If ANY of these calls timeout/fail, Promise.all() will reject');
  console.log('   and setIsLoading(false) may not be called!');
}

console.log('\n4️⃣ App.tsx initialization flow:\n');
const appFile = path.join(__dirname, 'App.tsx');
const appContent = fs.readFileSync(appFile, 'utf8');

console.log('Checking:');
const checks = [
  {
    name: 'Promise.all() error handling',
    regex: /Promise\.all\(\[[\s\S]*?\]\)[\s\S]*?catch/
  },
  {
    name: 'LoadingScreen displayed while isLoading=true',
    regex: /if\s*\(\s*isLoading.*?\)/
  },
  {
    name: 'finally block to setIsLoading(false)',
    regex: /finally\s*\{[\s\S]*?setIsLoading\(false\)/
  }
];

checks.forEach(check => {
  if (check.regex.test(appContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name}`);
  }
});

console.log('\n5️⃣ ANALYSIS:\n');

const hasTimeout = fetchMatch && fetchMatch[0].includes('catch');
const hasFallback = initialState && !initialState[0].match(/appSettings:\s*null|appSettings:\s*undefined/);

console.log('Current behavior when Firebase times out:');
console.log(`  - Error handling: ${hasTimeout ? '✅ Yes' : '❌ No'}`);
console.log(`  - Default appSettings: ${hasFallback ? '✅ Yes' : '❌ No'}`);

if (!hasTimeout || !hasFallback) {
  console.log('\n🚨 PROBLEM: App will show LoadingScreen indefinitely if Firebase times out!');
  console.log('\nSOLUTION: Implement timeout handler in AppInitializer.tsx:');
  console.log(`
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Firebase timeout')), 30000)
  );
  
  Promise.race([
    Promise.all([fetchAllAppData(), fetchAllUsers(), fetchAllProjects()]),
    timeoutPromise
  ])
  `);
} else {
  console.log('\n✅ App should handle Firebase timeouts gracefully');
}

console.log('\n---\n');

#!/usr/bin/env node

/**
 * Prepare Complete OHAS Standards for Firebase Import
 * Creates import-ready JSON file for all 240 standards (10 chapters)
 * Usage: node upload-standards-to-firebase.js
 * Then use Firebase CLI: firebase firestore:import ./firebase-import-ready
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_FOLDER = 'firebase-import-ready';
const COLLECTION_FOLDER = path.join(OUTPUT_FOLDER, 'standards');

console.log('\n🔥 PREPARING COMPLETE OHAS STANDARDS FOR FIREBASE IMPORT');
console.log('='.repeat(80));

// Create output folders
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
}
if (!fs.existsSync(COLLECTION_FOLDER)) {
  fs.mkdirSync(COLLECTION_FOLDER);
}

// Read standards file
const standardsPath = path.join(__dirname, '../src/data/standards.json');
const standards = JSON.parse(fs.readFileSync(standardsPath, 'utf8'));

console.log(`\n📊 Total Standards: ${standards.length}`);
console.log(`📊 Total Measures: ${standards.reduce((sum, std) => sum + std.totalMeasures, 0)}`);

// Group by chapter for reporting
const byChapter = standards.reduce((acc, std) => {
  if (!acc[std.chapter]) acc[std.chapter] = [];
  acc[std.chapter].push(std);
  return acc;
}, {});

console.log('\n📚 Chapter Breakdown:');
Object.keys(byChapter).sort().forEach(chapter => {
  console.log(`   ${chapter}: ${byChapter[chapter].length} standards`);
});

console.log('\n⏳ Creating import files...');

// Create individual JSON files for each standard (Firebase format)
let count = 0;
standards.forEach(standard => {
  const filename = `${standard.standardId}.json`;
  const filepath = path.join(COLLECTION_FOLDER, filename);
  fs.writeFileSync(filepath, JSON.stringify(standard, null, 2), 'utf8');
  count++;
  
  if (count % 50 === 0) {
    console.log(`   ✅ Prepared ${count}/${standards.length} standards`);
  }
});

console.log(`   ✅ Prepared ${count}/${standards.length} standards`);

console.log('\n' + '='.repeat(80));
console.log('✅ SUCCESS: All standards prepared for Firebase import!');
console.log('='.repeat(80));
console.log('\n📁 Output folder: ./firebase-import-ready/standards/');
console.log(`📁 Total files: ${count}`);
console.log('\n🚀 TO UPLOAD TO FIREBASE:');
console.log('   1. Make sure you are logged in: firebase login');
console.log('   2. Run: firebase firestore:import ./firebase-import-ready --project accreditex-79c08');
console.log('\n✅ Your application will then have all OHAS standards!\n');


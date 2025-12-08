#!/usr/bin/env node

/**
 * Firebase Batch Import Helper Script
 * Prepares all JSON data files for batch import into Firestore
 * Usage: node firebase-batch-import.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_FOLDER = 'src/data';
const OUTPUT_FOLDER = 'firebase-import-ready';

console.log('\n🔥 Firebase Batch Import Helper\n');
console.log('================================\n');

// Create output folder
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
  console.log(`✅ Created output folder: ${OUTPUT_FOLDER}\n`);
}

// Define collections to import
const collectionsToImport = [
  {
    file: 'programs.json',
    collection: 'programs',
    documentIdField: 'id',
    description: 'OHAS Program',
  },
  {
    file: 'standards.json',
    collection: 'standards',
    documentIdField: 'standardId',
    description: '21 OHAS Standards',
  },
  {
    file: 'departments.json',
    collection: 'departments',
    documentIdField: 'id',
    description: 'Healthcare Departments',
  },
  {
    file: 'competencies.json',
    collection: 'competencies',
    documentIdField: 'id',
    description: 'Professional Competencies',
  },
  {
    file: 'projects.json',
    collection: 'projects',
    documentIdField: 'id',
    description: 'OHAS Chapter Projects',
  },
  {
    file: 'documents.json',
    collection: 'documents',
    documentIdField: 'id',
    description: 'Organization Documents',
  },
  {
    file: 'trainings.json',
    collection: 'trainingPrograms',
    documentIdField: 'id',
    description: 'Training Programs',
  },
  {
    file: 'risks.json',
    collection: 'risks',
    documentIdField: 'id',
    description: 'Risk Register',
  },
];

console.log('📦 Preparing Collections for Import\n');

let totalDocuments = 0;
let successfulCollections = 0;

// Process each collection
collectionsToImport.forEach((config) => {
  const filePath = path.join(DATA_FOLDER, config.file);
  const outputFile = path.join(OUTPUT_FOLDER, `${config.collection}_import.json`);

  console.log(`Processing: ${config.description}`);
  console.log(`  File: ${config.file}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ File not found: ${filePath}\n`);
    return;
  }

  try {
    // Read JSON file
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonContent);

    // Ensure data is an array
    const documents = Array.isArray(data) ? data : [data];

    // Create import structure
    const importData = {
      collection: config.collection,
      documentIdField: config.documentIdField,
      documents: documents,
      importedAt: new Date().toISOString(),
      documentCount: documents.length,
    };

    // Save to JSON file
    const importJson = JSON.stringify(importData, null, 2);
    fs.writeFileSync(outputFile, importJson, 'utf8');

    console.log(`  ✅ Prepared: ${documents.length} documents`);
    console.log(`  📄 Output: ${outputFile}`);
    console.log(`  📋 Copy collection data from firebase-import-ready folder\n`);

    totalDocuments += documents.length;
    successfulCollections++;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
});

// Create summary report
const summaryFile = path.join(OUTPUT_FOLDER, 'IMPORT_SUMMARY.txt');
const summary = `Firebase Batch Import Summary
=============================

Prepared Collections: ${successfulCollections}
Total Documents: ${totalDocuments}

Generated Files:
- programs_import.json (1 document)
- standards_import.json (21 documents)
- departments_import.json (10 documents)
- competencies_import.json (4 documents)
- projects_import.json (10 documents)
- documents_import.json (3 documents)
- trainingPrograms_import.json (2 documents)
- risks_import.json (3 documents)

TOTAL: 54 documents ready for import

How to Use:
-----------
1. Open each file in the firebase-import-ready folder
2. In Firebase Setup Page > Collections Tab:
   - Click on the collection name
   - Click "Add Document" button
   - Copy the "documents" array content
   - Paste individual documents one by one
   OR
   - Use the "Bulk Import" feature if available
3. Set the Document ID from the "documents.*.id" field
4. Click Save

For Collections like 'users' and 'appSettings' that are already populated:
- Review the generated JSON files to verify completeness
- Use them as reference for updating existing documents if needed

Generated at: ${new Date().toISOString()}
`;

fs.writeFileSync(summaryFile, summary, 'utf8');

console.log('\n═════════════════════════════════════════════');
console.log('✅ Import Preparation Complete!');
console.log('═════════════════════════════════════════════\n');

console.log('📊 Summary:');
console.log(`  • Collections Prepared: ${successfulCollections}`);
console.log(`  • Total Documents: ${totalDocuments}`);
console.log(`  • Output Folder: ${OUTPUT_FOLDER}`);
console.log(`  • Summary File: ${summaryFile}\n`);

console.log('📝 Next Steps:');
console.log(`  1. Open files in ${OUTPUT_FOLDER} folder`);
console.log('  2. Go to Firebase Setup Page → Collections Tab');
console.log('  3. For each collection, add documents one by one:');
console.log("     - Click 'Add Document'");
console.log("     - Set Document ID (from 'id' or 'standardId' field)");
console.log('     - Paste document content');
console.log('     - Click Save');
console.log('  4. Repeat for all collections\n');

console.log('💡 Pro Tips:');
console.log('  • Use notepad to view and copy document content');
console.log('  • For large arrays, open in VS Code and expand sections');
console.log('  • Check document count in Collections Manager after each upload');
console.log('  • Run health check after all collections are imported\n');

console.log('📚 Collections Ready:');
collectionsToImport.forEach((config) => {
  const filePath = path.join(DATA_FOLDER, config.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const count = Array.isArray(data) ? data.length : 1;
    console.log(`  ✅ ${config.collection}: ${count} documents`);
  } else {
    console.log(`  ❌ ${config.collection}: File not found`);
  }
});

console.log('\n');

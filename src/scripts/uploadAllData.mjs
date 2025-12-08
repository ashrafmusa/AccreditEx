import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadAllData() {
  const collections = [
    { name: 'competencies', file: 'competencies.json' },
    { name: 'departments', file: 'departments.json' },
    { name: 'standards', file: 'standards.json' },
    { name: 'accreditationPrograms', file: 'programs.json' },
    { name: 'documents', file: 'documents.json' },
    { name: 'trainingPrograms', file: 'trainings.json' },
    { name: 'risks', file: 'risks.json' },
    { name: 'projects', file: 'projects.json' },
  ];

  try {
    for (const { name, file } of collections) {
      try {
        const filePath = path.join(__dirname, '../data', file);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Handle both array and single document formats
        const documents = Array.isArray(fileData) ? fileData : [fileData];

        console.log(`\n📤 Uploading ${name} (${documents.length} documents)...`);

        const batch = writeBatch(db);
        let count = 0;

        documents.forEach(doc => {
          if (doc.id) {
            const ref = firestore_doc(collection(db, name), doc.id);
            batch.set(ref, doc, { merge: true });
            count++;
          }
        });

        if (count > 0) {
          await batch.commit();
          console.log(`✓ ${name}: ${count} documents uploaded`);
        } else {
          console.log(`⚠ ${name}: No documents with valid IDs found`);
        }
      } catch (err) {
        console.error(`✗ Error with ${name}:`, err.message);
      }
    }

    console.log('\n✓ All data upload complete!');
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Fix the import issue
import { doc as firestore_doc } from 'firebase/firestore';

uploadAllData();

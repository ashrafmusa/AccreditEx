import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkFirebaseData() {
  try {
    const collections = ['appSettings', 'users', 'projects', 'standards', 'departments', 'competencies', 'accreditationPrograms', 'documents', 'trainingPrograms', 'risks'];
    
    for (const collName of collections) {
      try {
        const coll = collection(db, collName);
        const snapshot = await getDocs(coll);
        console.log(`\n📚 ${collName}: ${snapshot.size} documents`);
        if (snapshot.size > 0 && snapshot.size <= 5) {
          snapshot.docs.forEach(doc => {
            console.log(`  ├─ ${doc.id}`);
          });
        } else if (snapshot.size > 5) {
          console.log(`  (showing 5 of ${snapshot.size})`);
          snapshot.docs.slice(0, 5).forEach(doc => {
            console.log(`  ├─ ${doc.id}`);
          });
        }
      } catch (err) {
        console.log(`\n📚 ${collName}: Error - ${err.code || err.message}`);
      }
    }
  } catch (error) {
    console.error('Error checking Firebase:', error.message);
  }
  process.exit(0);
}

checkFirebaseData();

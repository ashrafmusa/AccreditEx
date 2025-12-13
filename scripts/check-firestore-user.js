/**
 * Quick Firestore User Check
 * Paste this in browser console while logged in to check if user doc exists
 */

import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase/firebaseConfig';

async function checkCurrentUser() {
  console.log('🔍 Checking current user in Firestore...\n');
  
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('❌ No user is currently logged in');
    return;
  }
  
  console.log('Current Auth User:', {
    uid: currentUser.uid,
    email: currentUser.email
  });
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('\n✅ User document exists in Firestore:');
      console.log('Document ID:', userSnap.id);
      console.log('User Data:', userData);
      
      // Check if required fields exist
      const requiredFields = ['email', 'name', 'role'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        console.log('\n⚠️  Missing required fields:', missingFields);
      } else {
        console.log('\n✅ All required fields present');
      }
    } else {
      console.log('\n❌ User document does NOT exist in Firestore');
      console.log('Expected path: users/' + currentUser.uid);
      console.log('\nThis explains the update failure!');
      console.log('The document must exist before you can update it.');
    }
  } catch (error) {
    console.error('\n❌ Error checking user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the check
checkCurrentUser();

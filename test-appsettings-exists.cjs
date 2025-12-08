#!/usr/bin/env node

/**
 * Quick test to check if appSettings exists in Firebase
 * Run this to diagnose the issue
 */

const fetch = require('node-fetch');

const projectId = 'accreditex-79c08';
const apiKey = 'AIzaSyBPkTWdojLlQBG7E9OPWCXPZ_Zzg31YrLg';

console.log('🔍 Checking if appSettings collection exists in Firebase\n');

const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/appSettings?key=${apiKey}`;

console.log('Sending request to Firebase Firestore API...\n');

fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Firebase Response:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.documents && data.documents.length > 0) {
      console.log('\n✅ appSettings collection EXISTS with documents!');
      console.log('Document:', data.documents[0]);
    } else if (data.error) {
      console.log('\n❌ Error:', data.error);
      if (data.error.code === 404) {
        console.log('Collection not found - you need to create appSettings');
      } else if (data.error.code === 403) {
        console.log('Permission denied - check Firestore security rules');
      }
    } else {
      console.log('\n⚠️  Collection may be empty');
    }
  })
  .catch(error => {
    console.log('❌ Connection Error:', error.message);
    console.log('\nPossible causes:');
    console.log('- Network connectivity issue');
    console.log('- Firebase project suspended');
    console.log('- Firewall blocking googleapis.com');
  });

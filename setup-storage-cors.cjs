const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'accreditex-79c08.firebasestorage.app'
});

const bucket = admin.storage().bucket();

const corsConfiguration = [
  {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://accreditex-79c08.web.app', 'https://accreditex-79c08.firebaseapp.com'],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'X-Requested-With']
  }
];

bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log('✅ CORS configuration applied successfully!');
    console.log('\nYour Firebase Storage now accepts requests from:');
    console.log('  • http://localhost:3000');
    console.log('  • http://localhost:5173');
    console.log('  • https://accreditex-79c08.web.app');
    console.log('  • https://accreditex-79c08.firebaseapp.com');
    console.log('\n✓ PDF uploads should now work!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error applying CORS configuration:', error);
    process.exit(1);
  });

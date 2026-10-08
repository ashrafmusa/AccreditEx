/**
 * Publishes firestore.rules through the Firebase Rules API.
 * Use when `firebase deploy --only firestore:rules` is blocked for a service account.
 *
 * GOOGLE_APPLICATION_CREDENTIALS=<key.json> node scripts/deploy-firestore-rules.cjs
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const projectId = process.env.GCLOUD_PROJECT || 'accreditex-79c08';
admin.initializeApp({ projectId });

(async () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const ruleset = await admin.securityRules().releaseFirestoreRulesetFromSource(source);
  console.log('Published ruleset:', ruleset.name);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

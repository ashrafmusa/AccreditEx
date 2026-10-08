/* Backfills the `organizationId` custom claim from users/{uid}.organizationId.
 * Dry-run by default. Preserves existing claims.
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=... node scripts/migrations/backfill-org-claims.cjs
 *   ... --apply --confirm-project=<projectId>
 */
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || 'accreditex-79c08';
const apply = process.argv.includes('--apply');
const confirm = (process.argv.find((a) => a.startsWith('--confirm-project=')) || '').split('=')[1];

if (apply && confirm !== projectId) {
  console.error(`Refusing to apply: pass --confirm-project=${projectId}`);
  process.exit(1);
}

admin.initializeApp({ projectId });

(async () => {
  const snap = await admin.firestore().collection('users').get();
  const summary = { total: snap.size, alreadySet: 0, noOrg: 0, noAuthUser: 0, toUpdate: 0 };
  for (const d of snap.docs) {
    const orgId = d.data().organizationId;
    if (!orgId) { summary.noOrg++; continue; }
    let user;
    try { user = await admin.auth().getUser(d.id); } catch { summary.noAuthUser++; continue; }
    const claims = user.customClaims || {};
    if (claims.organizationId === orgId) { summary.alreadySet++; continue; }
    summary.toUpdate++;
    console.log(`${apply ? 'SET' : 'WOULD SET'} ${user.email || d.id} -> ${orgId} (claims: ${Object.keys(claims).join(',') || 'none'})`);
    if (apply) await admin.auth().setCustomUserClaims(d.id, { ...claims, organizationId: orgId });
  }
  console.log(JSON.stringify(summary));
  process.exit(0);
})();

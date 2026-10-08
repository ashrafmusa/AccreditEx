/* Removes dummy/test data and keeps only the real users.
 * Dry-run by default.
 *   GOOGLE_APPLICATION_CREDENTIALS=... node scripts/migrations/cleanup-dummy-data.cjs
 *   ... --apply --confirm-project=<projectId> [--include-orgs]
 * Also sets organizationId on departments and activity logs/settings docs that have none.
 */
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || 'accreditex-79c08';
const apply = process.argv.includes('--apply');
const includeOrgs = process.argv.includes('--include-orgs');
const confirm = (process.argv.find((a) => a.startsWith('--confirm-project=')) || '').split('=')[1];
const KEEP_UIDS = new Set(['0is3JQoMjSbnSKUrIdEY5HeYGyu1', 'IWhwStrQQlUngmfxfns554fKrzw1']);
const HOME_ORG = 'org-accreditex';
const ORGS_TO_DELETE = ['e2e-test-org', 'B5eoJOrFuVbEiwbh3hjp', 'qgbO4bTiqy85yu4YUFpy', 'SnBcOsURx5HdLyNEkwpq'];
const ORG_OWNED = ['departments', 'activity_logs', 'settings_audit_logs', 'settings_versions', 'appSettings', 'reportDefinitions', 'comments', 'labOpsData'];

if (apply && confirm !== projectId) {
  console.error(`Refusing to apply: pass --confirm-project=${projectId}`);
  process.exit(1);
}
admin.initializeApp({ projectId });
const db = admin.firestore();
const tag = apply ? 'DELETE' : 'WOULD DELETE';

(async () => {
  const users = await db.collection('users').get();
  const keptDocs = users.docs.filter((d) => KEEP_UIDS.has(d.id));
  if (keptDocs.length !== KEEP_UIDS.size) {
    console.error('Safety stop: expected user docs for both kept UIDs; found', keptDocs.map((d) => d.id));
    process.exit(1);
  }
  const stats = { usersDeleted: 0, authDeleted: 0, demoDeleted: 0, orgsDeleted: 0, stamped: 0 };

  for (const d of users.docs) {
    if (KEEP_UIDS.has(d.id)) continue;
    const x = d.data();
    console.log(`${tag} user ${x.email} (${d.id}) org=${x.organizationId}`);
    stats.usersDeleted++;
    let hasAuth = true;
    try { await admin.auth().getUser(d.id); } catch { hasAuth = false; }
    if (hasAuth) { console.log(`${tag} auth account ${x.email}`); stats.authDeleted++; }
    if (apply) {
      if (hasAuth) await admin.auth().deleteUser(d.id);
      await d.ref.delete();
    }
  }

  const demo = await db.collection('demoRequests').get();
  for (const d of demo.docs) { stats.demoDeleted++; if (apply) await d.ref.delete(); }
  console.log(`${tag} ${demo.size} demoRequests`);

  const orgs = await db.collection('organizations').get();
  for (const d of orgs.docs) {
    if (!ORGS_TO_DELETE.includes(d.id)) continue;
    console.log(`${includeOrgs ? tag : 'SKIP (needs --include-orgs)'} organization ${d.data().name} (${d.id})`);
    if (includeOrgs) { stats.orgsDeleted++; if (apply) await d.ref.delete(); }
  }

  for (const col of ORG_OWNED) {
    const s = await db.collection(col).get();
    for (const d of s.docs) {
      if (d.data().organizationId) continue;
      stats.stamped++;
      if (apply) await d.ref.update({ organizationId: HOME_ORG });
    }
  }
  console.log(`${apply ? 'STAMPED' : 'WOULD STAMP'} ${stats.stamped} docs with organizationId=${HOME_ORG}`);
  console.log(JSON.stringify({ mode: apply ? 'APPLIED' : 'DRY-RUN', ...stats }));
  process.exit(0);
})();

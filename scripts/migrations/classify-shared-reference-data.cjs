const fs = require('node:fs');
const admin = require('firebase-admin');

const COLLECTIONS = ['standards', 'accreditationPrograms', 'competencies'];
const BATCH_SIZE = 400;
const apply = process.argv.includes('--apply');
const confirmation = process.argv.find(arg => arg.startsWith('--confirm-project='));
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

function getProjectId() {
  const configuredProject = process.env.FIREBASE_PROJECT_ID
    || process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT;
  if (configuredProject) return configuredProject;
  if (!credentialsPath) return undefined;
  return JSON.parse(fs.readFileSync(credentialsPath, 'utf8')).project_id;
}

async function main() {
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Set FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS before running.');
  }
  if (apply && confirmation?.slice('--confirm-project='.length) !== projectId) {
    throw new Error('Applying changes requires --confirm-project to exactly match the credential project.');
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });

  const db = admin.firestore();
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} shared reference classification for ${projectId}`);

  for (const collectionName of COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    const candidates = [];
    let alreadyClassified = 0;
    let unresolved = 0;

    for (const document of snapshot.docs) {
      const data = document.data();
      const hasOrganization = typeof data.organizationId === 'string'
        && data.organizationId.length > 0;

      if (hasOrganization) {
        alreadyClassified += 1;
      } else if (data.scope === 'global') {
        alreadyClassified += 1;
      } else if (data.scope == null) {
        candidates.push(document.ref);
      } else {
        unresolved += 1;
      }
    }

    console.log(
      `${collectionName}: total=${snapshot.size}, ` +
      `globalCandidates=${candidates.length}, classified=${alreadyClassified}, ` +
      `unresolved=${unresolved}`,
    );

    if (!apply) continue;

    for (let offset = 0; offset < candidates.length; offset += BATCH_SIZE) {
      const batch = db.batch();
      for (const reference of candidates.slice(offset, offset + BATCH_SIZE)) {
        batch.update(reference, { scope: 'global' });
      }
      await batch.commit();
    }
  }

  if (!apply) {
    console.log('No data changed. Review the counts, then rerun with --apply --confirm-project=<projectId>.');
  }
}

main()
  .catch(error => {
    console.error(`Shared reference classification failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (admin.apps.length) await admin.app().delete();
  });

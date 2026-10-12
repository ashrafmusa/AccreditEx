import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const projectId = 'demo-accreditex-rules';
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    storage: {
      host: '127.0.0.1',
      port: 9199,
      rules: readFileSync(resolve(__dirname, '../storage.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearStorage();
});

async function seedFile(path: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .storage()
      .ref(path)
      .putString('ZGVtbyBmaWxl', 'base64', { contentType: 'application/pdf' });
  });
}

describe('Storage tenant isolation', () => {
  it('keeps legacy program and standard reference files authenticated-readable only', async () => {
    await seedFile('documents/programs/program-1/reference.pdf');
    await seedFile('documents/standards/standard-1/reference.pdf');

    const tenantUser = testEnv.authenticatedContext('tenant-user', {
      role: 'Member',
      organizationId: 'org-a',
    });
    const anonymousUser = testEnv.unauthenticatedContext();

    await assertSucceeds(
      tenantUser
        .storage()
        .ref('documents/programs/program-1/reference.pdf')
        .getDownloadURL(),
    );
    await assertSucceeds(
      tenantUser
        .storage()
        .ref('documents/standards/standard-1/reference.pdf')
        .getDownloadURL(),
    );
    await assertFails(
      anonymousUser
        .storage()
        .ref('documents/programs/program-1/reference.pdf')
        .getDownloadURL(),
    );
  });

  it('denies tenant members access to legacy project documents and reports', async () => {
    await seedFile('documents/projects/project-1/evidence.pdf');
    await seedFile('reports/project-1/report.pdf');

    const tenantUser = testEnv.authenticatedContext('tenant-user', {
      role: 'Admin',
      organizationId: 'org-a',
    });

    await assertFails(
      tenantUser
        .storage()
        .ref('documents/projects/project-1/evidence.pdf')
        .getDownloadURL(),
    );
    await assertFails(
      tenantUser.storage().ref('reports/project-1/report.pdf').getDownloadURL(),
    );
  });

  it('allows a tenant-less migration user to read legacy project documents and reports', async () => {
    await seedFile('documents/projects/project-1/evidence.pdf');
    await seedFile('reports/project-1/report.pdf');

    const migrationUser = testEnv.authenticatedContext('migration-user', {
      role: 'Admin',
    });

    await assertSucceeds(
      migrationUser
        .storage()
        .ref('documents/projects/project-1/evidence.pdf')
        .getDownloadURL(),
    );
    await assertSucceeds(
      migrationUser.storage().ref('reports/project-1/report.pdf').getDownloadURL(),
    );
  });

  it('isolates tenant-prefixed project files and denies cross-tenant admin profile reads', async () => {
    await seedFile('documents/org-a/projects/project-1/evidence.pdf');
    await seedFile('documents/users/user-a/private.pdf');

    const orgAAdmin = testEnv.authenticatedContext('admin-a', {
      role: 'Admin',
      organizationId: 'org-a',
    });
    const orgBAdmin = testEnv.authenticatedContext('admin-b', {
      role: 'Admin',
      organizationId: 'org-b',
    });
    const profileOwner = testEnv.authenticatedContext('user-a', {
      role: 'Member',
      organizationId: 'org-b',
    });

    await assertSucceeds(
      orgAAdmin
        .storage()
        .ref('documents/org-a/projects/project-1/evidence.pdf')
        .getDownloadURL(),
    );
    await assertFails(
      orgBAdmin
        .storage()
        .ref('documents/org-a/projects/project-1/evidence.pdf')
        .getDownloadURL(),
    );
    await assertFails(
      orgBAdmin.storage().ref('documents/users/user-a/private.pdf').getDownloadURL(),
    );
    await assertSucceeds(
      profileOwner.storage().ref('documents/users/user-a/private.pdf').getDownloadURL(),
    );
  });
});

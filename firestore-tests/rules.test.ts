import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  or,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

describe('Firestore tenant and ownership rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-accreditex-rules',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const clientDb = (uid: string, role: string, organizationId = 'org-a') =>
    testEnv.authenticatedContext(uid, { role, organizationId }).firestore();

  it('scopes CAPA reads and writes to the active organization', async () => {
    const tenantDb = clientDb('member-a', 'TeamMember');
    await assertSucceeds(setDoc(doc(tenantDb, 'capaReports/capa-a'), {
      organizationId: 'org-a',
      title: 'Corrective action',
    }));

    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'capaReports/capa-b'), {
        organizationId: 'org-b',
        title: 'Other tenant record',
      });
    });

    await assertFails(getDoc(doc(tenantDb, 'capaReports/capa-b')));
    await assertFails(setDoc(doc(tenantDb, 'capaReports/capa-missing-org'), {
      title: 'Missing tenant',
    }));
  });

  it('lets platform system admins read across organizations but not regular admins', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'capaReports/capa-b'), {
        organizationId: 'org-b',
        title: 'Other tenant record',
      });
    });

    const sysAdminDb = testEnv
      .authenticatedContext('sys', { role: 'Admin', organizationId: 'org-a', systemAdmin: true })
      .firestore();
    await assertSucceeds(getDoc(doc(sysAdminDb, 'capaReports/capa-b')));
    await assertFails(getDoc(doc(clientDb('admin-a', 'Admin'), 'capaReports/capa-b')));
  });

  it('returns only explicitly global or active-tenant reference data', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'standards/global-standard'), {
        scope: 'global',
        standardId: 'GLOBAL-1',
      });
      await setDoc(doc(adminDb, 'standards/org-a-standard'), {
        organizationId: 'org-a',
        standardId: 'ORG-A-1',
      });
      await setDoc(doc(adminDb, 'standards/org-b-standard'), {
        organizationId: 'org-b',
        standardId: 'ORG-B-1',
      });
    });

    const queryForTenant = (organizationId: string) => query(
      collection(clientDb(`user-${organizationId}`, 'TeamMember', organizationId), 'standards'),
      or(
        where('scope', '==', 'global'),
        where('organizationId', '==', organizationId),
      ),
    );

    const tenantA = await assertSucceeds(getDocs(queryForTenant('org-a')));
    const tenantB = await assertSucceeds(getDocs(queryForTenant('org-b')));
    expect(tenantA.docs.map(document => document.id).sort()).toEqual([
      'global-standard',
      'org-a-standard',
    ]);
    expect(tenantB.docs.map(document => document.id).sort()).toEqual([
      'global-standard',
      'org-b-standard',
    ]);

    await assertFails(getDocs(collection(
      clientDb('user-org-a', 'TeamMember', 'org-a'),
      'standards',
    )));
    await assertFails(getDocs(query(
      collection(clientDb('user-org-a', 'TeamMember', 'org-a'), 'standards'),
      where('organizationId', '==', 'org-b'),
    )));
  });

  it('reserves global reference writes for platform super-admins', async () => {
    const tenantAdminDb = clientDb('admin-a', 'Admin');
    await assertSucceeds(setDoc(doc(tenantAdminDb, 'competencies/tenant-competency'), {
      organizationId: 'org-a',
      name: 'Tenant competency',
    }));
    await assertFails(setDoc(doc(tenantAdminDb, 'competencies/global-competency'), {
      scope: 'global',
      name: 'Global competency',
    }));

    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'platformAdmins/admin-a'), {
        email: 'admin@example.test',
      });
    });
    await assertSucceeds(setDoc(doc(tenantAdminDb, 'competencies/global-competency'), {
      scope: 'global',
      name: 'Global competency',
    }));
  });

  it('allows project leads, but not team members, to create change requests', async () => {
    const leadDb = clientDb('lead-a', 'ProjectLead');
    await assertSucceeds(setDoc(doc(leadDb, 'changeRequests/change-a'), {
      organizationId: 'org-a',
      title: 'Controlled change',
    }));

    const memberDb = clientDb('member-a', 'TeamMember');
    await assertFails(setDoc(doc(memberDb, 'changeRequests/change-b'), {
      organizationId: 'org-a',
      title: 'Unauthorized change',
    }));
  });

  it('scopes supplier records to the owning organization', async () => {
    const leadDb = clientDb('lead-a', 'ProjectLead');
    await assertSucceeds(setDoc(doc(leadDb, 'suppliers/sup-a'), {
      organizationId: 'org-a',
      name: 'Supplier A',
    }));
    await assertFails(setDoc(doc(leadDb, 'suppliers/sup-x'), {
      organizationId: 'org-b',
      name: 'Cross-tenant supplier',
    }));

    const otherOrgDb = clientDb('lead-b', 'ProjectLead', 'org-b');
    await assertFails(getDocs(query(
      collection(otherOrgDb, 'suppliers'),
      where('organizationId', '==', 'org-a'),
    )));
    await assertSucceeds(getDocs(query(
      collection(leadDb, 'suppliers'),
      where('organizationId', '==', 'org-a'),
    )));
  });

  it('restricts bulk user-operation logs to admins and their own tenant', async () => {
    const adminDb = clientDb('admin-a', 'Admin');
    await assertSucceeds(setDoc(doc(adminDb, 'bulk_user_operations/op-a'), {
      organizationId: 'org-a',
      createdBy: 'admin-a',
      status: 'pending',
    }));
    await assertFails(setDoc(doc(adminDb, 'bulk_user_operations/op-invalid-owner'), {
      organizationId: 'org-a',
      createdBy: 'someone-else',
      status: 'pending',
    }));

    const memberDb = clientDb('member-a', 'TeamMember');
    await assertFails(getDoc(doc(memberDb, 'bulk_user_operations/op-a')));
  });

  it('allows users to access only their own customization record', async () => {
    const ownerDb = clientDb('user-a', 'TeamMember');
    await assertSucceeds(setDoc(doc(ownerDb, 'userCustomizations/user-a'), {
      userId: 'user-a',
      theme: 'dark',
    }));
    await assertFails(getDoc(doc(ownerDb, 'userCustomizations/user-b')));
    await assertFails(setDoc(doc(ownerDb, 'userCustomizations/user-b'), {
      userId: 'user-b',
      theme: 'light',
    }));
    await assertSucceeds(deleteDoc(doc(ownerDb, 'userCustomizations/user-a')));
  });

  it('allows reading public presets but protects tenant-private presets', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'settings_presets/public'), {
        isPublic: true,
        usageCount: 0,
      });
      await setDoc(doc(adminDb, 'settings_presets/private'), {
        isPublic: false,
        createdBy: 'user-b',
        organizationId: 'org-b',
        usageCount: 0,
      });
    });

    const tenantDb = clientDb('user-a', 'Admin');
    await assertSucceeds(getDoc(doc(tenantDb, 'settings_presets/public')));
    await assertFails(getDoc(doc(tenantDb, 'settings_presets/private')));
    await assertSucceeds(updateDoc(doc(tenantDb, 'settings_presets/public'), {
      usageCount: 1,
    }));
    await assertFails(updateDoc(doc(tenantDb, 'settings_presets/public'), {
      isPublic: false,
    }));
  });

  it('accepts append-only template analytics only for its authenticated author', async () => {
    const userDb = clientDb('user-a', 'TeamMember');
    const usageRef = doc(userDb, 'templateUsage/usage-a');
    await assertSucceeds(setDoc(usageRef, {
      userId: 'user-a',
      organizationId: 'org-a',
      templateId: 'policy-template',
    }));
    await assertFails(setDoc(doc(userDb, 'templateUsage/usage-b'), {
      userId: 'user-b',
      organizationId: 'org-a',
      templateId: 'policy-template',
    }));
    await assertFails(updateDoc(usageRef, { templateId: 'changed-template' }));
  });
});

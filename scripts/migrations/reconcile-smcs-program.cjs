const fs = require("node:fs");
const path = require("node:path");
const { isDeepStrictEqual } = require("node:util");
const admin = require("firebase-admin");

const LEGACY_PROGRAM_ID = "prog-ohap";

function planReconciliation(program, standards, projects, organizationId) {
  if (
    !organizationId ||
    !program?.id ||
    program.id === LEGACY_PROGRAM_ID ||
    (program.status && program.status !== "active")
  ) {
    throw new Error(
      "An organization and an active, non-legacy destination program are required.",
    );
  }
  if (program.scope !== "global" && program.organizationId !== organizationId) {
    throw new Error(
      "The destination program is not shared or owned by the selected organization.",
    );
  }
  const required = new Set(
    require("../../src/data/smcsStandards.json").map(
      (standard) => standard.standardId,
    ),
  );
  const available = new Set(
    standards
      .filter(
        (standard) =>
          standard.programId === program.id &&
          (standard.scope === "global" ||
            standard.organizationId === organizationId),
      )
      .map((standard) => standard.standardId),
  );
  if ([...required].some((id) => !available.has(id))) {
    throw new Error(
      "The destination program does not contain every SMCS dataset standard.",
    );
  }
  return projects
    .filter((project) => {
      if (
        project.organizationId !== organizationId ||
        project.programId !== LEGACY_PROGRAM_ID ||
        !project.name?.startsWith("SMCS —")
      )
        return false;
      const references = [
        ...(project.standardIds || []),
        ...(project.checklist || []).map((item) => item.standardId),
      ];
      if (
        !references.length ||
        references.some((id) => !required.has(id) || !available.has(id))
      ) {
        throw new Error(
          `Project ${project.id} has missing or unexpected standard references; no changes may be applied.`,
        );
      }
      return true;
    })
    .map((project) => ({
      id: project.id,
      from: LEGACY_PROGRAM_ID,
      to: program.id,
    }));
}

async function main() {
  const value = (name) =>
    process.argv
      .find((arg) => arg.startsWith(`--${name}=`))
      ?.slice(name.length + 3);
  const projectId = value("project");
  const organizationId = value("organization");
  const programId = value("program");
  const apply = process.argv.includes("--apply");
  if (!projectId || !organizationId || !programId) {
    throw new Error(
      "Required: --project=<firebase-project> --organization=<organization-id> --program=<destination-id>. Default is dry run.",
    );
  }
  const credentialProject = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? JSON.parse(
        fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
      ).project_id
    : undefined;
  if (credentialProject && credentialProject !== projectId)
    throw new Error("Credential project does not match --project.");
  if (
    apply &&
    (value("confirm-project") !== projectId ||
      !value("backup") ||
      !value("expected-count"))
  ) {
    throw new Error(
      "Apply requires matching --confirm-project, --expected-count, and an absolute --backup path.",
    );
  }
  const backupPath = value("backup");
  if (apply && !path.isAbsolute(backupPath))
    throw new Error("Backup path must be absolute and outside the repository.");
  const repositoryRoot = path.resolve(__dirname, "..", "..");
  if (
    apply &&
    !path.relative(repositoryRoot, path.resolve(backupPath)).startsWith("..")
  ) {
    throw new Error("Backups must not be written inside the repository.");
  }
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
  const db = admin.firestore();
  const [programSnapshot, standardSnapshot, projectSnapshot] =
    await Promise.all([
      db.collection("accreditationPrograms").doc(programId).get(),
      db.collection("standards").where("programId", "==", programId).get(),
      db
        .collection("projects")
        .where("organizationId", "==", organizationId)
        .get(),
    ]);
  if (!programSnapshot.exists)
    throw new Error("Destination program does not exist.");
  const program = { ...programSnapshot.data(), id: programSnapshot.id };
  const projects = projectSnapshot.docs.map((document) => ({
    ...document.data(),
    id: document.id,
  }));
  const plan = planReconciliation(
    program,
    standardSnapshot.docs.map((document) => document.data()),
    projects,
    organizationId,
  );
  console.log(
    JSON.stringify(
      {
        mode: apply ? "APPLY" : "DRY RUN",
        projectId,
        organizationId,
        programId,
        count: plan.length,
        changes: plan,
      },
      null,
      2,
    ),
  );
  if (!apply) {
    console.log(
      "No database writes. Review the plan and obtain approval before applying.",
    );
    return;
  }
  const expectedCount = Number(value("expected-count"));
  if (
    !Number.isInteger(expectedCount) ||
    expectedCount < 1 ||
    expectedCount !== plan.length ||
    plan.length > 400
  ) {
    throw new Error(
      "Candidate count does not match the explicit expected count or exceeds the atomic batch limit.",
    );
  }
  const snapshots = plan.map((change) =>
    projectSnapshot.docs.find((document) => document.id === change.id),
  );
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        projectId,
        organizationId,
        programId,
        createdAt: new Date().toISOString(),
        documents: snapshots.map((document) => ({
          id: document.id,
          updateTime: document.updateTime.toDate().toISOString(),
          data: document.data(),
        })),
      },
      null,
      2,
    ),
    { flag: "wx", mode: 0o600 },
  );
  const batch = db.batch();
  snapshots.forEach((document) =>
    batch.update(
      document.ref,
      { programId },
      { lastUpdateTime: document.updateTime },
    ),
  );
  await batch.commit();
  const verified = await db.getAll(
    ...snapshots.map((document) => document.ref),
  );
  verified.forEach((document, index) => {
    const expected = { ...snapshots[index].data(), programId };
    if (!document.exists || !isDeepStrictEqual(document.data(), expected)) {
      throw new Error(
        `Verification failed for ${document.id}; inspect backup ${backupPath}.`,
      );
    }
  });
  console.log(
    `Verified ${verified.length} project references. Only programId changed. Backup: ${backupPath}`,
  );
}

module.exports = { planReconciliation };
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`SMCS reconciliation failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (admin.apps.length) await admin.app().delete();
    });
}

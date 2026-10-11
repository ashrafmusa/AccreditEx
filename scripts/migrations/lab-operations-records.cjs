/* Emulator-only rehearsal. Production rollout requires separate authorization and review. */
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const { resolve, relative, isAbsolute } = require("node:path");

const kinds = ["iqcResults", "reagentUsageLogs", "calibrations", "maintenanceLogs"];
const masters = ["equipment", "reagents", "iqcAnalytes", "proficiencyTests", "qualityEvents", "capaRecords", "qualityRisks", "competencyRecords"];
const dates = { iqcResults: "measuredAt", reagentUsageLogs: "usageDate", calibrations: "calibrationDate", maintenanceLogs: "scheduledDate" };
const canonical = (value) => JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)))
        : item);
const hash = (value) => createHash("sha256").update(canonical(value)).digest("hex");
const validId = (id) => typeof id === "string" && id.length > 0 && !id.includes("/") && ![".", ".."].includes(id);

async function sourceSnapshot(db, org) {
    if (!validId(org)) throw new Error("An explicit valid organization is required");
    const query = await db.collection("labOpsData").where("organizationId", "==", org).get();
    const source = query.docs.find((d) => d.id === org) || (query.docs.length === 1 ? query.docs[0] : null);
    if (!source) throw new Error("Missing or ambiguous organization-owned source");
    return { sourceId: source.id, organizationId: org, source: source.data() };
}

function plan(backup) {
    const entries = [];
    for (const key of masters) {
        if (backup.source[key] !== undefined && !Array.isArray(backup.source[key])) throw new Error(`Invalid ${key} array`);
        const ids = new Set();
        for (const record of backup.source[key] || []) {
            if (!validId(record.id) || ids.has(record.id)) throw new Error(`Invalid/duplicate ${key} ID; reconcile before migration`);
            ids.add(record.id);
            if (key === "reagents" && (!Number.isFinite(record.quantity) || record.quantity < 0)) throw new Error("Invalid inventory quantity");
        }
    }
    for (const kind of kinds) {
        const seen = new Set();
        if (backup.source[kind] !== undefined && !Array.isArray(backup.source[kind])) throw new Error(`Invalid ${kind} array`);
        for (const record of backup.source[kind] || []) {
            if (!validId(record.id) || seen.has(record.id)) throw new Error(`Invalid/duplicate ${kind} ID; reconcile before migration`);
            seen.add(record.id);
            if (!Number.isFinite(Date.parse(record[dates[kind]]))) throw new Error(`Invalid ${kind} date; reconcile before migration`);
            entries.push({ kind, id: record.id, data: {
                organizationId: backup.organizationId, record,
                sortAt: new Date(record[dates[kind]]).toISOString(),
            } });
        }
    }
    return entries;
}

async function backupLabOperations(db, org, path) {
    const backup = await sourceSnapshot(db, org);
    const entries = plan(backup);
    const output = { ...backup, fingerprint: hash(backup) };
    writeFileSync(path, canonical(output), { flag: "wx", mode: 0o600 });
    return { fingerprint: output.fingerprint, records: entries.length };
}

async function migrateLabOperations(db, org, backup, { chunkSize = 100, stopAfterChunks = Infinity } = {}) {
    if (!validId(org) || backup.organizationId !== org || backup.source.organizationId !== org) throw new Error("Backup tenant mismatch");
    const { fingerprint, ...original } = backup;
    if (hash(original) !== fingerprint) throw new Error("Backup fingerprint mismatch");
    const entries = plan(backup);
    if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 100) throw new Error("Invalid migration chunk size");
    const sourceRef = db.collection("labOpsData").doc(backup.sourceId);
    const root = db.collection("labOpsRecords").doc(org);
    const metadata = { ...backup.source };
    for (const kind of kinds) delete metadata[kind];
    delete metadata.updatedAt;
    delete metadata.organizationId;
    for (const key of masters) metadata[key] = metadata[key] || [];
    const assertSource = (snapshot) => {
        if (!snapshot.exists || hash({ sourceId: snapshot.id, organizationId: org, source: snapshot.data() }) !== fingerprint) {
            throw new Error("Legacy source changed; restore/review the backup before resuming");
        }
    };
    let chunks = 0;
    while (true) {
        const progress = await db.runTransaction(async (tx) => {
            const [source, current] = await Promise.all([tx.get(sourceRef), tx.get(root)]);
            assertSource(source);
            const state = current.data();
            if (state && state.migration?.fingerprint !== fingerprint) throw new Error("Destination belongs to another migration");
            if (state?.ready) return "already-ready";
            const offset = state?.migration?.offset || 0;
            if (!Number.isInteger(offset) || offset < 0 || offset > entries.length) throw new Error("Invalid migration checkpoint");
            const batch = entries.slice(offset, offset + chunkSize);
            const refs = batch.map((entry) => root.collection(entry.kind).doc(entry.id));
            const existing = await Promise.all(refs.map((ref) => tx.get(ref)));
            existing.forEach((snapshot, i) => {
                if (snapshot.exists && canonical(snapshot.data()) !== canonical(batch[i].data)) throw new Error("Destination record conflict");
            });
            batch.forEach((entry, i) => tx.set(refs[i], entry.data));
            const next = offset + batch.length;
            tx.set(root, {
                ...metadata, organizationId: org, ready: false, revision: 0,
                migration: { fingerprint, sourceId: backup.sourceId, offset: next, total: entries.length },
            });
            return next;
        });
        if (progress === "already-ready") return { ready: true, offset: entries.length, total: entries.length };
        if (progress === entries.length) break;
        if (++chunks >= stopAfterChunks) return { ready: false, offset: progress, total: entries.length };
    }
    // Verify exact record sets, not just counts, before activation. Legacy aggregate is never modified.
    for (const kind of kinds) {
        const actual = await root.collection(kind).get();
        const expected = new Map(entries.filter((e) => e.kind === kind).map((e) => [e.id, canonical(e.data)]));
        if (actual.size !== expected.size || actual.docs.some((d) => expected.get(d.id) !== canonical(d.data()))) {
            throw new Error("Destination verification failed");
        }
    }
    await db.runTransaction(async (tx) => {
        const [source, current] = await Promise.all([tx.get(sourceRef), tx.get(root)]);
        assertSource(source);
        if (current.data()?.migration?.fingerprint !== fingerprint) throw new Error("Migration changed");
        if (!current.data().ready) tx.update(root, { ready: true });
    });
    return { ready: true, offset: entries.length, total: entries.length };
}

async function main() {
    const args = process.argv.slice(2);
    const value = (key) => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
    const mode = value("--mode"), org = value("--org"), project = value("--project"), file = value("--backup");
    if (!["dry-run", "backup", "migrate"].includes(mode) || !validId(org)
        || !project?.startsWith("demo-") || !/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")) {
        throw new Error("Only explicit --mode dry-run|backup|migrate --org ID --project demo-ID with a loopback Firestore emulator is supported");
    }
    const { initializeApp } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const db = getFirestore(initializeApp({ projectId: project }));
    if (mode === "dry-run") {
        const backup = await sourceSnapshot(db, org);
        console.log(JSON.stringify({ organizationId: org, records: plan(backup).length, fingerprint: hash(backup), writes: 0 }));
        return;
    }
    if (!file) throw new Error("--backup is required");
    const path = resolve(file);
    const within = relative(process.cwd(), path);
    if (within.startsWith("..") || isAbsolute(within)) throw new Error("Backup must remain inside the project directory");
    console.log(JSON.stringify(mode === "backup"
        ? await backupLabOperations(db, org, path)
        : await migrateLabOperations(db, org, JSON.parse(readFileSync(path, "utf8")))));
}

module.exports = { backupLabOperations, migrateLabOperations, hash, plan };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { deleteApp, initializeApp as initializeClientApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore as getClientFirestore,
} from "firebase/firestore";

const projectId = "demo-accreditex-e2e";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;

if (
  process.env.GCLOUD_PROJECT !== projectId ||
  authHost !== "127.0.0.1:9099" ||
  firestoreHost !== "127.0.0.1:8080"
) {
  throw new Error(
    "E2E runner must execute inside the configured demo Auth and Firestore emulators.",
  );
}

process.env.VITE_USE_FIREBASE_EMULATORS = "true";
process.env.VITE_PROJECT_ID = projectId;
process.env.VITE_API_KEY = "e2e-emulator-api-key";
process.env.VITE_AUTH_DOMAIN = "localhost";
process.env.VITE_STORAGE_BUCKET = `${projectId}.firebasestorage.app`;
process.env.VITE_MESSAGING_SENDER_ID = "000000000000";
process.env.VITE_APP_ID = "1:000000000000:web:e2e";
process.env.VITE_MEASUREMENT_ID = "";

const app = initializeApp({ projectId }, "accreditex-e2e-seed");
const auth = getAuth(app);
const firestore = getFirestore(app);
const users = [
  {
    email: "e2e-admin@accreditex-test.com",
    password: "E2eAdmin123!",
    name: "E2E Admin",
    role: "Admin",
    program: "cbahi",
  },
  {
    email: "e2e-auditor@accreditex-test.com",
    password: "E2eAuditor123!",
    name: "E2E Auditor",
    role: "Auditor",
    program: "ashk",
  },
  {
    email: "e2e-viewer@accreditex-test.com",
    password: "E2eViewer123!",
    name: "E2E Viewer",
    role: "Viewer",
    program: "jci",
  },
  {
    email: "e2e-projectlead@accreditex-test.com",
    password: "E2eProjectLead123!",
    name: "E2E Project Lead",
    role: "ProjectLead",
    program: "cbahi",
  },
];
const organizationId = "org-e2e";

try {
  await firestore.collection("organizations").doc(organizationId).set({
    name: "E2E Test Organization",
    type: "hospital",
    country: "Test",
    isActive: true,
    plan: "professional",
    createdAt: new Date().toISOString(),
  });
  await firestore.collection("appSettings").doc("default").set({
    appName: "AccreditEx E2E",
    primaryColor: "#0EA5E9",
    defaultLanguage: "en",
    passwordPolicy: { minLength: 8 },
    globeSettings: {},
    organizationId,
  });

  for (const user of users) {
    const record = await auth.createUser({
      email: user.email,
      password: user.password,
      displayName: user.name,
    });
    await auth.setCustomUserClaims(record.uid, {
      role: user.role,
      organizationId,
    });
    await firestore.collection("users").doc(record.uid).set({
      id: record.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId,
      isActive: true,
      profile: {
        accreditationProgram: user.program,
        organizationName: "E2E Test Organization",
        organizationType: "hospital",
        country: "Test",
      },
      createdAt: new Date().toISOString(),
    });
  }

  const clientApp = initializeClientApp(
    {
      apiKey: process.env.VITE_API_KEY,
      authDomain: process.env.VITE_AUTH_DOMAIN,
      projectId,
      storageBucket: process.env.VITE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_APP_ID,
    },
    "accreditex-e2e-client-smoke",
  );
  try {
    const clientAuth = getClientAuth(clientApp);
    connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    const credential = await signInWithEmailAndPassword(
      clientAuth,
      users[0].email,
      users[0].password,
    );
    const clientDb = getClientFirestore(clientApp);
    connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
    const profile = await getDoc(doc(clientDb, "users", credential.user.uid));
    if (!profile.exists()) {
      throw new Error("E2E Auth user has no Firestore profile document.");
    }
    console.log("E2E emulator Auth and Firestore profile smoke check passed.");
  } finally {
    await deleteApp(clientApp);
  }

  const cliPath = resolve(
    fileURLToPath(new URL("../../node_modules/@playwright/test/cli.js", import.meta.url)),
  );
  const playwrightArgs = [
    cliPath,
    "test",
    "e2e/tests/full-user-journey.spec.ts",
    "e2e/tests/public-experience.spec.ts",
    "e2e/tests/landing-demo-flow.spec.ts",
    "--project=chromium",
    "--workers=1",
    "--reporter=line",
  ];
  if (process.env.E2E_TEST_GREP) {
    playwrightArgs.push("--grep", process.env.E2E_TEST_GREP);
  }

  const result = spawnSync(process.execPath, playwrightArgs, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  process.exitCode = result.status ?? 1;
} finally {
  await app.delete();
}

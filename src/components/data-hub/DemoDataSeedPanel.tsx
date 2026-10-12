import React, { useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { User } from "@/types";
import {
  buildSyntheticDemoSeed,
  DEMO_SEED_ORGANIZATION_ID,
  downloadDemoSeedBackup,
  getDemoSeedCollectionCounts,
  seedSyntheticDemoData,
} from "@/services/demoDataSeedService";

interface DemoDataSeedPanelProps {
  organizationId: string;
  currentUser: User;
}

const DemoDataSeedPanel: React.FC<DemoDataSeedPanelProps> = ({
  organizationId,
  currentUser,
}) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [seedFinished, setSeedFinished] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seedPreview = useMemo(
    () => buildSyntheticDemoSeed(organizationId, currentUser),
    [organizationId, currentUser],
  );
  const collectionCounts = getDemoSeedCollectionCounts(seedPreview);

  const handleDownloadBackup = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await downloadDemoSeedBackup(organizationId, currentUser);
      setBackupDownloaded(true);
      setMessage(t("demoSeedBackupReady"));
    } catch (cause) {
      const details =
        cause instanceof Error ? cause.message : String(cause);
      setError(`${t("demoSeedFailed")} ${details}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    if (!backupDownloaded || confirmation !== "SEED ACCREDITEX") return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await seedSyntheticDemoData(organizationId, currentUser);
      setSeedFinished(true);
      setMessage(
        t("demoSeedSuccess", {
          created: result.created,
          skipped: result.skipped,
          labOps: result.labOpsRecordsAdded,
        }),
      );
    } catch (cause) {
      const details =
        cause instanceof Error ? cause.message : String(cause);
      setError(`${t("demoSeedFailed")} ${details}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="demo-data-seed-title"
      className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h2
        id="demo-data-seed-title"
        className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary"
      >
        {t("demoSeedTitle")}
      </h2>
      <p className="mt-2 text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
        {t("demoSeedDescription")}
      </p>
      <p className="mt-3 rounded-md bg-white/70 p-3 text-sm font-medium text-amber-900 dark:bg-black/20 dark:text-amber-200">
        {t("demoSeedSafetyNotice")}
      </p>

      <h3 className="mt-5 font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
        {t("demoSeedPreview")}
      </h3>
      <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(collectionCounts)
          .sort(([first], [second]) => first.localeCompare(second))
          .map(([collectionName, count]) => (
            <li
              key={collectionName}
              className="flex justify-between gap-3 text-brand-text-secondary dark:text-dark-brand-text-secondary"
            >
              <span>{collectionName}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={busy}
          className="rounded-lg border border-brand-primary px-4 py-2 font-medium text-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t("processing") : t("demoSeedDownloadBackup")}
        </button>
      </div>

      <label className="mt-5 block text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
        {t("demoSeedConfirmation")}
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={busy}
          autoComplete="off"
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-brand-text-primary dark:border-dark-border dark:bg-dark-brand-background dark:text-dark-brand-text-primary sm:max-w-md"
        />
      </label>
      <button
        type="button"
        onClick={handleSeed}
        disabled={
          busy ||
          !backupDownloaded ||
          confirmation !== "SEED ACCREDITEX" ||
          organizationId !== DEMO_SEED_ORGANIZATION_ID
        }
        className="mt-3 rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? t("processing") : t("demoSeedRun")}
      </button>

      {message && (
        <p role="status" className="mt-4 text-sm text-green-800 dark:text-green-300">
          {message}
        </p>
      )}
      {seedFinished && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg border border-brand-primary px-4 py-2 font-medium text-brand-primary"
        >
          {t("demoSeedRefresh")}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </section>
  );
};

export default DemoDataSeedPanel;

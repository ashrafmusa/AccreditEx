import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { UserRole } from "@/types";
import type { AIAction } from "@/utils/aiActions";

type Status = "idle" | "saving" | "done" | "error";

export default function AIActionCard({ action }: { action: AIAction }) {
  const addRisk = useAppStore((s) => s.addRisk);
  const currentUser = useUserStore((s) => s.currentUser);
  const [status, setStatus] = useState<Status>("idle");

  const canWrite =
    !!currentUser &&
    currentUser.role !== UserRole.Viewer &&
    currentUser.role !== UserRole.Auditor;

  const confirm = async () => {
    setStatus("saving");
    try {
      await addRisk({
        title: action.title,
        description: action.description,
        likelihood: action.likelihood,
        impact: action.impact,
        mitigationPlan: action.mitigationPlan,
        category: action.category,
        ownerId: currentUser?.id ?? null,
        status: "Open",
        createdAt: new Date().toISOString(),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-2 rounded-md border border-sky-300 dark:border-sky-700 bg-white dark:bg-gray-800 p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">
        Suggested risk: {action.title}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
        Likelihood {action.likelihood}/5 · Impact {action.impact}/5
      </p>
      {action.mitigationPlan && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          Mitigation: {action.mitigationPlan}
        </p>
      )}
      {status === "done" ? (
        <p className="mt-2 text-xs font-medium text-green-600">
          Added to the Risk Register.
        </p>
      ) : canWrite ? (
        <button
          type="button"
          onClick={confirm}
          disabled={status === "saving"}
          className="mt-2 rounded bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {status === "saving" ? "Adding…" : "Add to Risk Register"}
        </button>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          Your role can't create risks.
        </p>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-red-600">
          Could not save. Please try again.
        </p>
      )}
    </div>
  );
}

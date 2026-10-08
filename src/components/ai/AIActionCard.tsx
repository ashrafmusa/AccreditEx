import React, { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useUserStore } from "@/stores/useUserStore";
import { UserRole } from "@/types";
import type { AIAction, CreateCapaAction, CreateRiskAction } from "@/utils/aiActions";

type Status = "idle" | "saving" | "done" | "error";

export default function AIActionCard({ action }: { action: AIAction }) {
  return action.type === "create_capa" ? (
    <CapaCard action={action} />
  ) : (
    <RiskCard action={action} />
  );
}

function CapaCard({ action }: { action: CreateCapaAction }) {
  const projects = useProjectStore((s) => s.projects);
  const createCAPA = useProjectStore((s) => s.createCAPA);
  const currentUser = useUserStore((s) => s.currentUser);
  const [status, setStatus] = useState<Status>("idle");
  const active = projects;
  const guess = action.projectName?.toLowerCase();
  const [projectId, setProjectId] = useState<string>(
    () =>
      active.find((p) => guess && p.name?.toLowerCase().includes(guess))?.id ||
      "",
  );

  const canWrite =
    !!currentUser &&
    currentUser.role !== UserRole.Viewer &&
    currentUser.role !== UserRole.Auditor;

  const confirm = async () => {
    if (!projectId) return;
    setStatus("saving");
    try {
      const now = new Date().toISOString();
      await createCAPA(projectId, {
        checklistItemId: `ai-capa-${Date.now()}`,
        title: action.title,
        description: action.title,
        rootCause: action.rootCause,
        correctiveAction: action.correctiveAction,
        preventiveAction: action.preventiveAction,
        status: "Open",
        assignedTo: currentUser?.id || "",
        dueDate: new Date(
          Date.now() + action.dueInDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
        pdcaStage: "Plan",
        pdcaHistory: [],
        createdAt: now,
        updatedAt: now,
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-2 rounded-md border border-sky-300 dark:border-sky-700 bg-white dark:bg-gray-800 p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">
        Suggested CAPA: {action.title}
      </p>
      {action.rootCause && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
          Root cause: {action.rootCause}
        </p>
      )}
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
        Corrective: {action.correctiveAction}
      </p>
      {action.preventiveAction && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
          Preventive: {action.preventiveAction}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">Due in {action.dueInDays} days</p>
      {status === "done" ? (
        <p className="mt-2 text-xs font-medium text-green-600">
          CAPA created.
        </p>
      ) : canWrite ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Project"
            className="max-w-[12rem] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs"
          >
            <option value="">Select project…</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={confirm}
            disabled={!projectId || status === "saving"}
            className="rounded bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            {status === "saving" ? "Creating…" : "Create CAPA"}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          Your role can't create CAPAs.
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

function RiskCard({ action }: { action: CreateRiskAction }) {
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

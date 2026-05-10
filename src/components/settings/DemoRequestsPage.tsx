/**
 * DemoRequestsPage — Platform super-admin only
 *
 * Lists all demo requests submitted from the landing page.
 * Supports status updates (new → contacted → scheduled → completed → closed),
 * inline notes, and basic stats.
 */

import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  XMarkIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  listDemoRequests,
  updateDemoRequestStatus,
  type DemoRequest,
  type DemoRequestStatus,
} from "@/services/demoRequestService";
import { useEffect, useState } from "react";

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DemoRequestStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  new: {
    label: "New",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
  closed: {
    label: "Closed",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

const STATUSES = Object.keys(STATUS_CONFIG) as DemoRequestStatus[];

function StatusBadge({ status }: { status: DemoRequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────

function EditModal({
  request,
  onClose,
  onSaved,
}: {
  request: DemoRequest;
  onClose: () => void;
  onSaved: (id: string, status: DemoRequestStatus, notes: string) => void;
}) {
  const [status, setStatus] = useState<DemoRequestStatus>(request.status);
  const [notes, setNotes] = useState(request.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateDemoRequestStatus(request.id, status, notes);
      onSaved(request.id, status, notes);
      onClose();
    } catch {
      // no-op — keep modal open
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-1">
          Update Request
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {request.name} · {request.email}
        </p>

        {/* Status */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={[
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                  status === s
                    ? `border-brand-primary ${cfg.bg} ${cfg.text}`
                    : "border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300",
                ].join(" ")}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Internal notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add notes visible only to your team..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none mb-4"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 transition-all disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DemoRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<DemoRequestStatus | "all">(
    "all",
  );
  const [editing, setEditing] = useState<DemoRequest | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listDemoRequests();
      setRequests(data);
    } catch {
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = requests.filter((r) => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.organization ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = STATUSES.reduce(
    (acc, s) => {
      acc[s] = requests.filter((r) => r.status === s).length;
      return acc;
    },
    {} as Record<DemoRequestStatus, number>,
  );

  function handleSaved(id: string, status: DemoRequestStatus, notes: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, notes } : r)),
    );
  }

  const formatDate = (ts: { toDate?: () => Date } | undefined) => {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            Demo Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {requests.length} total · {stats.new ?? 0} new
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() =>
                setFilterStatus((prev) => (prev === s ? "all" : s))
              }
              className={[
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                filterStatus === s
                  ? `border-brand-primary ${cfg.bg}`
                  : "border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700",
              ].join(" ")}
            >
              <span
                className={`text-2xl font-bold ${filterStatus === s ? cfg.text : "text-brand-text-primary dark:text-dark-brand-text-primary"}`}
              >
                {stats[s] ?? 0}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {r.name}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      {r.email}
                    </span>
                    {r.organization && (
                      <span className="flex items-center gap-1">
                        <BuildingOffice2Icon className="w-3.5 h-3.5" />
                        {r.organization}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      {formatDate(
                        r.createdAt as Parameters<typeof formatDate>[0],
                      )}
                    </span>
                  </div>
                  {r.message && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {r.message}
                    </p>
                  )}
                  {r.notes && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
                      📝 {r.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(r)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 text-sm font-medium transition-colors"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          request={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

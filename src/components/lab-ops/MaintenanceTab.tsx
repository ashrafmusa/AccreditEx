/**
 * Maintenance Log Tab
 * View/add preventive, corrective, and emergency maintenance work orders
 */
import React, { useState, useMemo } from "react";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type {
  MaintenanceLog,
  MaintenanceType,
  MaintenanceStatus,
} from "@/types/labOps";
import {
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_STATUS_LABELS,
} from "@/types/labOps";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
} from "@/components/icons";

const statusColor: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const typeColor: Record<MaintenanceType, string> = {
  preventive: "text-blue-600",
  corrective: "text-orange-600",
  emergency: "text-red-600",
};

const MaintenanceTab: React.FC = () => {
  const {
    maintenanceLogs,
    equipment,
    addMaintenanceLog,
    updateMaintenanceLog,
  } = useLabOpsStore();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<MaintenanceType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | "all">(
    "all",
  );
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<MaintenanceLog>>({
    type: "preventive",
    status: "scheduled",
  });

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = maintenanceLogs;
    if (filterType !== "all") list = list.filter((m) => m.type === filterType);
    if (filterStatus !== "all")
      list = list.filter((m) => m.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.equipmentName.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.workOrderNumber || "").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  }, [maintenanceLogs, filterType, filterStatus, search]);

  // Summary stats
  const scheduled = maintenanceLogs.filter(
    (m) => m.status === "scheduled",
  ).length;
  const inProgress = maintenanceLogs.filter(
    (m) => m.status === "in_progress",
  ).length;
  const completed = maintenanceLogs.filter(
    (m) => m.status === "completed",
  ).length;
  const overdue = maintenanceLogs.filter(
    (m) => m.status === "scheduled" && m.scheduledDate < today,
  ).length;

  const handleAdd = () => {
    if (!form.equipmentId || !form.description || !form.scheduledDate) return;
    const equip = equipment.find((e) => e.id === form.equipmentId);
    const now = new Date().toISOString();
    const log: MaintenanceLog = {
      id: `ml-${Date.now()}`,
      equipmentId: form.equipmentId || "",
      equipmentName: equip?.name || "",
      type: form.type || "preventive",
      status: form.status || "scheduled",
      performedBy: form.performedBy || "",
      scheduledDate: form.scheduledDate || today,
      description: form.description || "",
      vendorName: form.vendorName,
      workOrderNumber: form.workOrderNumber,
      createdAt: now,
      updatedAt: now,
    };
    addMaintenanceLog(log);
    setShowAdd(false);
    setForm({ type: "preventive", status: "scheduled" });
  };

  const handleMarkComplete = (log: MaintenanceLog) => {
    updateMaintenanceLog({
      ...log,
      status: "completed",
      completedDate: today,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
          Maintenance Logs
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> New Work Order
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{scheduled}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Scheduled
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{inProgress}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            In Progress
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{completed}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Completed
          </p>
        </Card>
        <Card className="p-3 text-center border-red-200">
          <p className="text-2xl font-bold text-red-600">{overdue}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Overdue
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work orders…"
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as MaintenanceType | "all")
          }
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Types</option>
          {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as MaintenanceStatus | "all")
          }
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          {Object.entries(MAINTENANCE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            New Work Order
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Equipment *
              </label>
              <select
                value={form.equipmentId || ""}
                onChange={(e) =>
                  setForm({ ...form, equipmentId: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">— Select —</option>
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as MaintenanceType })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={form.scheduledDate || ""}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Performed By
              </label>
              <input
                value={form.performedBy || ""}
                onChange={(e) =>
                  setForm({ ...form, performedBy: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Description *
              </label>
              <input
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Vendor
              </label>
              <input
                value={form.vendorName || ""}
                onChange={(e) =>
                  setForm({ ...form, vendorName: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Work Order #
              </label>
              <input
                value={form.workOrderNumber || ""}
                onChange={(e) =>
                  setForm({ ...form, workOrderNumber: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Create
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium">Equipment</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Scheduled</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const isOD = m.status === "scheduled" && m.scheduledDate < today;
              return (
                <tr
                  key={m.id}
                  className={`border-b border-gray-100 dark:border-gray-700 ${isOD ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium dark:text-dark-brand-text-primary">
                      {m.equipmentName}
                    </p>
                    {m.workOrderNumber && (
                      <p className="text-xs text-gray-500">
                        WO: {m.workOrderNumber}
                      </p>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-xs font-medium ${typeColor[m.type]}`}
                  >
                    {MAINTENANCE_TYPE_LABELS[m.type]}
                  </td>
                  <td className="px-3 py-2.5 text-xs max-w-[250px] truncate dark:text-dark-brand-text-secondary">
                    {m.description}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-xs ${isOD ? "text-red-600 font-bold" : ""}`}
                  >
                    {m.scheduledDate}
                    {isOD && (
                      <ExclamationTriangleIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[isOD && m.status === "scheduled" ? "overdue" : m.status]}`}
                    >
                      {isOD && m.status === "scheduled"
                        ? "Overdue"
                        : MAINTENANCE_STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {m.status !== "completed" && m.status !== "cancelled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkComplete(m)}
                        className="text-xs"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                        Complete
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No maintenance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceTab;

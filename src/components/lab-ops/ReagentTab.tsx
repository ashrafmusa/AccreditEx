/**
 * Reagent Tracking Tab
 * Inventory management with expiry alerts, low-stock tracking, usage logging
 */
import React, { useState, useMemo } from "react";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type { Reagent, ReagentStatus, ReagentUsageLog } from "@/types/labOps";
import { REAGENT_STATUS_LABELS } from "@/types/labOps";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@/components/icons";

const statusColor: Record<ReagentStatus, string> = {
  in_stock:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  low_stock:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  expired: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  depleted: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  quarantine:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const ReagentTab: React.FC = () => {
  const {
    reagents,
    reagentUsageLogs,
    addReagent,
    updateReagent,
    removeReagent,
    addReagentUsage,
    equipment,
  } = useLabOpsStore();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReagentStatus | "all">(
    "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  const [form, setForm] = useState<Partial<Reagent>>({ status: "in_stock" });
  const [usageForm, setUsageForm] = useState<Partial<ReagentUsageLog>>({});

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = reagents;
    if (filterStatus !== "all")
      list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.lotNumber.toLowerCase().includes(q) ||
          r.manufacturer.toLowerCase().includes(q) ||
          r.labSection.toLowerCase().includes(q),
      );
    }
    return list;
  }, [reagents, filterStatus, search]);

  const selected = useMemo(
    () => reagents.find((r) => r.id === selectedId),
    [reagents, selectedId],
  );
  const selectedUsages = useMemo(
    () =>
      reagentUsageLogs
        .filter((u) => u.reagentId === selectedId)
        .sort((a, b) => b.usageDate.localeCompare(a.usageDate)),
    [reagentUsageLogs, selectedId],
  );

  const isExpiringSoon = (dateStr: string) => {
    const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  };
  const isExpired = (dateStr: string) => dateStr < today;

  // Summary cards
  const totalInStock = reagents.filter((r) => r.status === "in_stock").length;
  const lowStock = reagents.filter((r) => r.status === "low_stock").length;
  const expired = reagents.filter((r) => r.status === "expired").length;
  const expiringSoon = reagents.filter(
    (r) => r.status !== "expired" && isExpiringSoon(r.expirationDate),
  ).length;

  const handleAdd = () => {
    if (!form.name || !form.lotNumber) return;
    const now = new Date().toISOString();
    const reagent: Reagent = {
      id: `rg-${Date.now()}`,
      name: form.name || "",
      manufacturer: form.manufacturer || "",
      catalogNumber: form.catalogNumber || "",
      lotNumber: form.lotNumber || "",
      expirationDate: form.expirationDate || "",
      receivedDate: form.receivedDate || today,
      quantity: form.quantity || 0,
      unit: form.unit || "units",
      reorderLevel: form.reorderLevel || 10,
      storageConditions: form.storageConditions || "Room Temperature",
      labSection: form.labSection || "",
      status: form.status || "in_stock",
      createdAt: now,
      updatedAt: now,
    };
    addReagent(reagent);
    setShowAdd(false);
    setForm({ status: "in_stock" });
  };

  const handleLogUsage = () => {
    if (!selectedId || !usageForm.quantityUsed || !usageForm.usedBy) return;
    const usage: ReagentUsageLog = {
      id: `ru-${Date.now()}`,
      reagentId: selectedId,
      reagentName: selected?.name || "",
      usedBy: usageForm.usedBy || "",
      usageDate: usageForm.usageDate || new Date().toISOString(),
      quantityUsed: usageForm.quantityUsed || 0,
      unit: selected?.unit || "units",
      notes: usageForm.notes,
    };
    addReagentUsage(usage);
    // Update reagent quantity
    if (selected) {
      const newQty = Math.max(0, selected.quantity - usage.quantityUsed);
      updateReagent({
        ...selected,
        quantity: newQty,
        status:
          newQty <= 0
            ? "depleted"
            : newQty <= selected.reorderLevel
              ? "low_stock"
              : selected.status,
        updatedAt: new Date().toISOString(),
      });
    }
    setShowUsage(false);
    setUsageForm({});
  };

  // ── Detail View ─────────

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            ← Back
          </Button>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            {selected.name}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}
          >
            {REAGENT_STATUS_LABELS[selected.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Manufacturer / Catalog #
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.manufacturer}
            </p>
            <p className="text-xs text-gray-500">{selected.catalogNumber}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Lot Number
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.lotNumber}
            </p>
          </Card>
          <Card
            className={`p-3 ${selected.quantity <= selected.reorderLevel ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
          >
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Quantity / Reorder Level
            </p>
            <p className="text-xl font-bold dark:text-dark-brand-text-primary">
              {selected.quantity}{" "}
              <span className="text-sm font-normal">{selected.unit}</span>
            </p>
            <p className="text-xs text-gray-500">
              Reorder at: {selected.reorderLevel} {selected.unit}
            </p>
          </Card>
          <Card
            className={`p-3 ${isExpired(selected.expirationDate) ? "border-red-300 bg-red-50 dark:bg-red-900/20" : isExpiringSoon(selected.expirationDate) ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
          >
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Expiration Date
            </p>
            <p
              className={`text-xl font-bold ${isExpired(selected.expirationDate) ? "text-red-600" : ""}`}
            >
              {selected.expirationDate}
            </p>
            {isExpired(selected.expirationDate) && (
              <p className="text-xs text-red-600 font-medium">EXPIRED</p>
            )}
            {isExpiringSoon(selected.expirationDate) &&
              !isExpired(selected.expirationDate) && (
                <p className="text-xs text-yellow-600 font-medium">
                  Expiring Soon
                </p>
              )}
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Storage
            </p>
            <p className="text-sm dark:text-dark-brand-text-primary">
              {selected.storageConditions}
            </p>
            {selected.storageTemperature && (
              <p className="text-xs text-gray-500">
                {selected.storageTemperature}
              </p>
            )}
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Lab Section
            </p>
            <p className="text-sm dark:text-dark-brand-text-primary">
              {selected.labSection}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Received / Opened
            </p>
            <p className="text-sm dark:text-dark-brand-text-primary">
              {selected.receivedDate}
            </p>
            {selected.openedDate && (
              <p className="text-xs text-gray-500">
                Opened: {selected.openedDate}
              </p>
            )}
          </Card>
        </div>

        {/* Usage log */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold dark:text-dark-brand-text-primary">
              Usage Log
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUsage(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" /> Log Usage
            </Button>
          </div>
          {showUsage && (
            <Card className="p-3 mb-3 bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Quantity Used *
                  </label>
                  <input
                    type="number"
                    value={usageForm.quantityUsed || ""}
                    onChange={(e) =>
                      setUsageForm({
                        ...usageForm,
                        quantityUsed: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Used By *
                  </label>
                  <input
                    value={usageForm.usedBy || ""}
                    onChange={(e) =>
                      setUsageForm({ ...usageForm, usedBy: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Notes
                  </label>
                  <input
                    value={usageForm.notes || ""}
                    onChange={(e) =>
                      setUsageForm({ ...usageForm, notes: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUsage(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleLogUsage}>
                  Save
                </Button>
              </div>
            </Card>
          )}
          {selectedUsages.length === 0 ? (
            <p className="text-sm text-gray-400">No usage logged</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-2 py-1.5 text-left font-medium">Date</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Qty Used
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">By</th>
                  <th className="px-2 py-1.5 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {selectedUsages.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-2 py-1.5">
                      {new Date(u.usageDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1.5 font-medium">
                      {u.quantityUsed} {u.unit}
                    </td>
                    <td className="px-2 py-1.5">{u.usedBy}</td>
                    <td className="px-2 py-1.5 text-gray-500">
                      {u.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    );
  }

  // ── List View ─────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
          Reagent Inventory
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> Add Reagent
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{totalInStock}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            In Stock
          </p>
        </Card>
        <Card className="p-3 text-center border-yellow-200">
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Low Stock
          </p>
        </Card>
        <Card className="p-3 text-center border-orange-200">
          <p className="text-2xl font-bold text-orange-600">{expiringSoon}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Expiring ≤30d
          </p>
        </Card>
        <Card className="p-3 text-center border-red-200">
          <p className="text-2xl font-bold text-red-600">{expired}</p>
          <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
            Expired
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
            placeholder="Search reagents…"
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as ReagentStatus | "all")
          }
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          {Object.entries(REAGENT_STATUS_LABELS).map(([k, v]) => (
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
            New Reagent
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Name *
              </label>
              <input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Lot Number *
              </label>
              <input
                value={form.lotNumber || ""}
                onChange={(e) =>
                  setForm({ ...form, lotNumber: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Manufacturer
              </label>
              <input
                value={form.manufacturer || ""}
                onChange={(e) =>
                  setForm({ ...form, manufacturer: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Catalog #
              </label>
              <input
                value={form.catalogNumber || ""}
                onChange={(e) =>
                  setForm({ ...form, catalogNumber: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Expiration Date
              </label>
              <input
                type="date"
                value={form.expirationDate || ""}
                onChange={(e) =>
                  setForm({ ...form, expirationDate: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Quantity
              </label>
              <input
                type="number"
                value={form.quantity || ""}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Unit
              </label>
              <input
                value={form.unit || ""}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="mL, vials, tests…"
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Lab Section
              </label>
              <input
                value={form.labSection || ""}
                onChange={(e) =>
                  setForm({ ...form, labSection: e.target.value })
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
              Add Reagent
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Lot #</th>
              <th className="px-3 py-2 font-medium">Section</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Expires</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className="px-3 py-2.5">
                  <p className="font-medium dark:text-dark-brand-text-primary">
                    {r.name}
                  </p>
                  <p className="text-xs text-gray-500">{r.manufacturer}</p>
                </td>
                <td className="px-3 py-2.5 text-xs font-mono">{r.lotNumber}</td>
                <td className="px-3 py-2.5 text-xs">{r.labSection}</td>
                <td
                  className={`px-3 py-2.5 text-xs font-medium ${r.quantity <= r.reorderLevel ? "text-yellow-600" : ""}`}
                >
                  {r.quantity} {r.unit}
                </td>
                <td
                  className={`px-3 py-2.5 text-xs ${isExpired(r.expirationDate) ? "text-red-600 font-bold" : isExpiringSoon(r.expirationDate) ? "text-yellow-600" : ""}`}
                >
                  {r.expirationDate}
                  {isExpired(r.expirationDate) && (
                    <ExclamationTriangleIcon className="h-3 w-3 inline ml-1" />
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}
                  >
                    {REAGENT_STATUS_LABELS[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReagentTab;

/**
 * Equipment Management Tab
 * Full CRUD for lab equipment with status badges, calibration/maintenance due dates
 */
import React, { useState, useMemo } from "react";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type {
  Equipment,
  EquipmentStatus,
  EquipmentCategory,
  CalibrationRecord,
  CalibrationResult,
} from "@/types/labOps";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  CALIBRATION_RESULT_LABELS,
} from "@/types/labOps";
import { Button, Card } from "@/components/ui";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SearchIcon,
} from "@/components/icons";

const statusColor: Record<EquipmentStatus, string> = {
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  maintenance:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  calibration_due:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  decommissioned:
    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const calColor: Record<CalibrationResult, string> = {
  pass: "text-green-600",
  fail: "text-red-600",
  adjusted: "text-yellow-600",
};

const EquipmentTab: React.FC = () => {
  const {
    equipment,
    calibrations,
    addEquipment,
    updateEquipment,
    removeEquipment,
    addCalibration,
  } = useLabOpsStore();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | "all">(
    "all",
  );
  const [filterCategory, setFilterCategory] = useState<
    EquipmentCategory | "all"
  >("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCalForm, setShowCalForm] = useState(false);

  // Add form state
  const [form, setForm] = useState<Partial<Equipment>>({
    category: "analyzer",
    status: "active",
    calibrationIntervalDays: 90,
    maintenanceIntervalDays: 90,
  });

  // Cal form state
  const [calForm, setCalForm] = useState<Partial<CalibrationRecord>>({
    result: "pass",
  });

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = equipment;
    if (filterStatus !== "all")
      list = list.filter((e) => e.status === filterStatus);
    if (filterCategory !== "all")
      list = list.filter((e) => e.category === filterCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.serialNumber.toLowerCase().includes(q) ||
          e.manufacturer.toLowerCase().includes(q) ||
          e.labSection.toLowerCase().includes(q),
      );
    }
    return list;
  }, [equipment, filterStatus, filterCategory, search]);

  const selected = useMemo(
    () => equipment.find((e) => e.id === selectedId),
    [equipment, selectedId],
  );

  const selectedCals = useMemo(
    () =>
      calibrations
        .filter((c) => c.equipmentId === selectedId)
        .sort((a, b) => b.calibrationDate.localeCompare(a.calibrationDate)),
    [calibrations, selectedId],
  );

  const isDueSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 14;
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    return dateStr < today;
  };

  const handleAdd = () => {
    if (!form.name || !form.manufacturer || !form.serialNumber) return;
    const now = new Date().toISOString();
    const eq: Equipment = {
      id: `eq-${Date.now()}`,
      name: form.name || "",
      manufacturer: form.manufacturer || "",
      model: form.model || "",
      serialNumber: form.serialNumber || "",
      assetTag: form.assetTag,
      category: form.category || "other",
      labSection: form.labSection || "",
      location: form.location || "",
      status: form.status || "active",
      purchaseDate: form.purchaseDate || today,
      calibrationIntervalDays: form.calibrationIntervalDays || 90,
      maintenanceIntervalDays: form.maintenanceIntervalDays || 90,
      createdAt: now,
      updatedAt: now,
    };
    addEquipment(eq);
    setShowAddForm(false);
    setForm({
      category: "analyzer",
      status: "active",
      calibrationIntervalDays: 90,
      maintenanceIntervalDays: 90,
    });
  };

  const handleAddCal = () => {
    if (!selectedId || !calForm.calibrationDate || !calForm.calibratedBy)
      return;
    const cal: CalibrationRecord = {
      id: `cal-${Date.now()}`,
      equipmentId: selectedId,
      equipmentName: selected?.name || "",
      calibratedBy: calForm.calibratedBy || "",
      calibrationDate: calForm.calibrationDate || "",
      nextDueDate: calForm.nextDueDate || "",
      result: calForm.result || "pass",
      tolerance: calForm.tolerance,
      measuredValue: calForm.measuredValue,
      expectedValue: calForm.expectedValue,
      vendor: calForm.vendor,
      notes: calForm.notes,
      createdAt: new Date().toISOString(),
    };
    addCalibration(cal);
    // Update equipment calibration dates
    if (selected) {
      updateEquipment({
        ...selected,
        lastCalibrationDate: cal.calibrationDate,
        nextCalibrationDue: cal.nextDueDate,
        status:
          selected.status === "calibration_due" ? "active" : selected.status,
        updatedAt: new Date().toISOString(),
      });
    }
    setShowCalForm(false);
    setCalForm({ result: "pass" });
  };

  // ── Detail View ──────────────────────

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
            {EQUIPMENT_STATUS_LABELS[selected.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Manufacturer / Model
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.manufacturer} {selected.model}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Serial / Asset Tag
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.serialNumber}
            </p>
            {selected.assetTag && (
              <p className="text-xs text-gray-500">{selected.assetTag}</p>
            )}
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Lab Section / Location
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.labSection}
            </p>
            <p className="text-xs text-gray-500">{selected.location}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Category
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {EQUIPMENT_CATEGORY_LABELS[selected.category]}
            </p>
          </Card>
        </div>

        {/* Calibration & Maintenance dates */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`p-3 ${isOverdue(selected.nextCalibrationDue) ? "border-red-300 bg-red-50 dark:bg-red-900/20" : isDueSoon(selected.nextCalibrationDue) ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
          >
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Calibration
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              Last: {selected.lastCalibrationDate || "—"}
            </p>
            <p
              className={`text-sm ${isOverdue(selected.nextCalibrationDue) ? "text-red-600 font-bold" : ""}`}
            >
              Next: {selected.nextCalibrationDue || "—"}
              {isOverdue(selected.nextCalibrationDue) && " ⚠ OVERDUE"}
            </p>
          </Card>
          <Card
            className={`p-3 ${isOverdue(selected.nextMaintenanceDue) ? "border-red-300 bg-red-50 dark:bg-red-900/20" : isDueSoon(selected.nextMaintenanceDue) ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
          >
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              Maintenance
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              Last: {selected.lastMaintenanceDate || "—"}
            </p>
            <p
              className={`text-sm ${isOverdue(selected.nextMaintenanceDue) ? "text-red-600 font-bold" : ""}`}
            >
              Next: {selected.nextMaintenanceDue || "—"}
              {isOverdue(selected.nextMaintenanceDue) && " ⚠ OVERDUE"}
            </p>
          </Card>
        </div>

        {/* Calibration history */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold dark:text-dark-brand-text-primary">
              Calibration History
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCalForm(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" /> Record Calibration
            </Button>
          </div>
          {showCalForm && (
            <Card className="p-3 mb-3 bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={calForm.calibrationDate || ""}
                    onChange={(e) =>
                      setCalForm({
                        ...calForm,
                        calibrationDate: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Next Due
                  </label>
                  <input
                    type="date"
                    value={calForm.nextDueDate || ""}
                    onChange={(e) =>
                      setCalForm({ ...calForm, nextDueDate: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Result *
                  </label>
                  <select
                    value={calForm.result}
                    onChange={(e) =>
                      setCalForm({
                        ...calForm,
                        result: e.target.value as CalibrationResult,
                      })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.entries(CALIBRATION_RESULT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Performed By *
                  </label>
                  <input
                    value={calForm.calibratedBy || ""}
                    onChange={(e) =>
                      setCalForm({ ...calForm, calibratedBy: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Vendor
                  </label>
                  <input
                    value={calForm.vendor || ""}
                    onChange={(e) =>
                      setCalForm({ ...calForm, vendor: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    Notes
                  </label>
                  <input
                    value={calForm.notes || ""}
                    onChange={(e) =>
                      setCalForm({ ...calForm, notes: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalForm(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddCal}>
                  Save
                </Button>
              </div>
            </Card>
          )}
          {selectedCals.length === 0 ? (
            <p className="text-sm text-gray-400">No calibration records yet</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-2 py-1.5 text-left font-medium">Date</th>
                  <th className="px-2 py-1.5 text-left font-medium">Result</th>
                  <th className="px-2 py-1.5 text-left font-medium">By</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Next Due
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {selectedCals.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-2 py-1.5">{c.calibrationDate}</td>
                    <td
                      className={`px-2 py-1.5 font-medium ${calColor[c.result]}`}
                    >
                      {CALIBRATION_RESULT_LABELS[c.result]}
                    </td>
                    <td className="px-2 py-1.5">{c.calibratedBy}</td>
                    <td className="px-2 py-1.5">{c.nextDueDate}</td>
                    <td className="px-2 py-1.5 text-gray-500 max-w-[200px] truncate">
                      {c.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {selected.notes && (
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
              Notes
            </p>
            <p className="text-sm dark:text-dark-brand-text-primary">
              {selected.notes}
            </p>
          </Card>
        )}
      </div>
    );
  }

  // ── List View ────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
          Equipment Inventory
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment…"
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as EquipmentStatus | "all")
          }
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          {Object.entries(EQUIPMENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as EquipmentCategory | "all")
          }
          className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Categories</option>
          {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
            New Equipment
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
                Manufacturer *
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
                Model
              </label>
              <input
                value={form.model || ""}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Serial Number *
              </label>
              <input
                value={form.serialNumber || ""}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as EquipmentCategory,
                  })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
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
                placeholder="Chemistry, Hematology…"
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Location
              </label>
              <input
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                Purchase Date
              </label>
              <input
                type="date"
                value={form.purchaseDate || ""}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              Add Equipment
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
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Section</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Next Cal</th>
              <th className="px-3 py-2 font-medium">Next PM</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((eq) => (
              <tr
                key={eq.id}
                onClick={() => setSelectedId(eq.id)}
                className="border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className="px-3 py-2.5">
                  <p className="font-medium dark:text-dark-brand-text-primary">
                    {eq.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {eq.manufacturer} {eq.model}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-xs">
                  {EQUIPMENT_CATEGORY_LABELS[eq.category]}
                </td>
                <td className="px-3 py-2.5 text-xs">{eq.labSection}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[eq.status]}`}
                  >
                    {EQUIPMENT_STATUS_LABELS[eq.status]}
                  </span>
                </td>
                <td
                  className={`px-3 py-2.5 text-xs ${isOverdue(eq.nextCalibrationDue) ? "text-red-600 font-bold" : isDueSoon(eq.nextCalibrationDue) ? "text-yellow-600 font-medium" : ""}`}
                >
                  {eq.nextCalibrationDue || "—"}
                  {isOverdue(eq.nextCalibrationDue) && (
                    <ExclamationTriangleIcon className="h-3 w-3 inline ml-1" />
                  )}
                </td>
                <td
                  className={`px-3 py-2.5 text-xs ${isOverdue(eq.nextMaintenanceDue) ? "text-red-600 font-bold" : isDueSoon(eq.nextMaintenanceDue) ? "text-yellow-600 font-medium" : ""}`}
                >
                  {eq.nextMaintenanceDue || "—"}
                  {isOverdue(eq.nextMaintenanceDue) && (
                    <ExclamationTriangleIcon className="h-3 w-3 inline ml-1" />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No equipment found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EquipmentTab;

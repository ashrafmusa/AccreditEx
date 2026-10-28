/**
 * Equipment Management Tab
 * Full CRUD for lab equipment with status badges, calibration/maintenance due dates
 * Enhancement 4.4: QR code generation + risk scoring + expanded asset categories
 */
import {
  ExclamationTriangleIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
  XMarkIcon,
} from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useLabOpsStore } from "@/stores/useLabOpsStore";
import type {
  AssetRiskLevel,
  CalibrationRecord,
  CalibrationResult,
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
} from "@/types/labOps";
import {
  CALIBRATION_RESULT_LABELS,
  computeAssetRiskLevel,
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS_LABELS,
} from "@/types/labOps";
import QRCode from "qrcode";
import LabLogPager from "./LabLogPager";
import React, { useCallback, useMemo, useRef, useState } from "react";

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
  const { t } = useTranslation();
  const toast = useToast();
  const pendingCalibration = useRef<CalibrationRecord | null>(null);
  const [calibrationLimit, setCalibrationLimit] = useState(25);
  const {
    equipment,
    calibrations,
    addEquipment,
    updateEquipment,
    decommissionEquipment,
    restoreEquipment,
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
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showCalForm, setShowCalForm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showTempForm, setShowTempForm] = useState(false);
  const [tempForm, setTempForm] = useState({
    tempCelsius: "",
    humidityPct: "",
    recordedBy: "",
    correctiveAction: "",
  });

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

  const handleShowQr = useCallback(async (eq: Equipment) => {
    const label = [eq.name, eq.serialNumber, eq.assetTag]
      .filter(Boolean)
      .join(" | ");
    try {
      const url = await QRCode.toDataURL(label, { width: 256, margin: 2 });
      setQrDataUrl(url);
      setShowQrModal(true);
    } catch {
      // ignore QR generation errors
    }
  }, []);

  const riskBadgeClass: Record<AssetRiskLevel, string> = {
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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

  const handleDecommission = () => {
    if (!window.confirm(`${selected?.name}\n\n${t("confirmDecommissionEquipment")}`)) return;
    if (selected) decommissionEquipment(selected.id);
  };

  const handleRestore = () => {
    if (!selected || !window.confirm(`${selected.name}\n\n${t("confirmRestoreEquipment")}`)) return;
    restoreEquipment(selected.id);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    const name = form.name?.trim();
    const manufacturer = form.manufacturer?.trim();
    const serialNumber = form.serialNumber?.trim();
    const calibrationIntervalDays = Number(form.calibrationIntervalDays);
    const maintenanceIntervalDays = Number(form.maintenanceIntervalDays);
    if (!name || !manufacturer || !serialNumber) {
      toast.error(t("labOpsEquipmentRequiredFields"));
      return;
    }
    if (
      !Number.isInteger(calibrationIntervalDays) ||
      calibrationIntervalDays < 1 ||
      !Number.isInteger(maintenanceIntervalDays) ||
      maintenanceIntervalDays < 1
    ) {
      toast.error(t("labOpsEquipmentInvalidIntervals"));
      return;
    }

    setSavingEdit(true);
    try {
      await updateEquipment({
        ...selected,
        ...form,
        id: selected.id,
        createdAt: selected.createdAt,
        name,
        manufacturer,
        model: form.model?.trim() || "",
        serialNumber,
        assetTag: form.assetTag?.trim() || undefined,
        labSection: form.labSection?.trim() || "",
        location: form.location?.trim() || "",
        calibrationIntervalDays,
        maintenanceIntervalDays,
        sopDocumentId: form.sopDocumentId?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      toast.success(t("labOpsEquipmentUpdated"));
    } catch {
      toast.error(t("labOpsRecordSaveFailed"));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddCal = async () => {
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
    try {
      pendingCalibration.current = pendingCalibration.current || cal;
      await addCalibration(pendingCalibration.current);
      pendingCalibration.current = null;
    } catch {
      toast.error(t("labOpsRecordSaveFailed"));
      return;
    }
    setShowCalForm(false);
    setCalForm({ result: "pass" });
  };

  // ── Detail View ──────────────────────

  if (selected) {
    const riskLevel = computeAssetRiskLevel(selected);
    return (
      <div className="space-y-4">
        {/* QR Code Modal */}
        {showQrModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full">
                <h3 className="font-semibold text-lg dark:text-dark-brand-text-primary">
                  {selected.name}
                </h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Asset QR Code"
                  className="w-48 h-48 rounded"
                />
              )}
              <p className="text-xs text-gray-500 text-center">
                {selected.serialNumber}
                {selected.assetTag && <> · {selected.assetTag}</>}
              </p>
              <a
                href={qrDataUrl}
                download={`qr-${selected.serialNumber || selected.id}.png`}
                className="text-sm text-brand-primary underline"
              >
                Download PNG
              </a>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedId(null);
              setIsEditing(false);
            }}
          >
            {t("back")}
          </Button>
          <h2 className="text-xl font-bold dark:text-dark-brand-text-primary">
            {selected.name}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}
          >
            {EQUIPMENT_STATUS_LABELS[selected.status]}
          </span>
          {/* Risk badge — Enhancement 4.4 */}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${riskBadgeClass[riskLevel]}`}
          >
            {riskLevel} risk
          </span>
          {/* QR Code button — Enhancement 4.4 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowQr(selected)}
            className="ml-auto flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" /> QR Code
          </Button>
          {!isEditing && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setForm({ ...selected });
                  setIsEditing(true);
                }}
              >
                {t("editEquipment")}
              </Button>
              {selected.status === "decommissioned" ? (
                <Button variant="secondary" size="sm" onClick={handleRestore}>
                  {t("restoreEquipment")}
                </Button>
              ) : (
                <Button variant="danger" size="sm" onClick={handleDecommission}>
                  {t("decommissionEquipment")}
                </Button>
              )}
            </>
          )}
        </div>

        {isEditing ? (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 dark:text-dark-brand-text-primary">
              {t("editEquipment")}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("nameRequired")}
                <input
                  required
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("manufacturerRequired")}
                <input
                  required
                  value={form.manufacturer || ""}
                  onChange={(e) =>
                    setForm({ ...form, manufacturer: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("model")}
                <input
                  value={form.model || ""}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("serialNumberRequired")}
                <input
                  required
                  value={form.serialNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, serialNumber: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("assetTag")}
                <input
                  value={form.assetTag || ""}
                  onChange={(e) =>
                    setForm({ ...form, assetTag: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("category")}
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as EquipmentCategory,
                    })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("labSection")}
                <input
                  value={form.labSection || ""}
                  onChange={(e) =>
                    setForm({ ...form, labSection: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("location")}
                <input
                  value={form.location || ""}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("purchaseDate")}
                <input
                  type="date"
                  value={form.purchaseDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("installationDate")}
                <input
                  type="date"
                  value={form.installationDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, installationDate: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("warrantyExpiry")}
                <input
                  type="date"
                  value={form.warrantyExpiry || ""}
                  onChange={(e) =>
                    setForm({ ...form, warrantyExpiry: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("calibrationIntervalDays")}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.calibrationIntervalDays ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      calibrationIntervalDays:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("nextCalibrationDue")}
                <input
                  type="date"
                  value={form.nextCalibrationDue || ""}
                  onChange={(e) =>
                    setForm({ ...form, nextCalibrationDue: e.target.value || undefined })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("maintenanceIntervalDays")}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maintenanceIntervalDays ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maintenanceIntervalDays:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("nextMaintenanceDue")}
                <input
                  type="date"
                  value={form.nextMaintenanceDue || ""}
                  onChange={(e) =>
                    setForm({ ...form, nextMaintenanceDue: e.target.value || undefined })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium dark:text-dark-brand-text-primary">
                {t("sopDocumentId")}
                <input
                  value={form.sopDocumentId || ""}
                  onChange={(e) =>
                    setForm({ ...form, sopDocumentId: e.target.value })
                  }
                  className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </label>
            </div>
            <label className="block mt-3 text-xs font-medium dark:text-dark-brand-text-primary">
              {t("notes")}
              <textarea
                rows={3}
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </label>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={savingEdit}
                onClick={() => setIsEditing(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={savingEdit}
                onClick={() => void handleSaveEdit()}
              >
                {t("save")}
              </Button>
            </div>
          </Card>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("manufacturerModel")}
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.manufacturer} {selected.model}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("serialAssetTag")}
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
              {t("labSectionLocation")}
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {selected.labSection}
            </p>
            <p className="text-xs text-gray-500">{selected.location}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("category")}
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {EQUIPMENT_CATEGORY_LABELS[selected.category]}
            </p>
          </Card>
        </div>
        )}

        {/* Calibration & Maintenance dates */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`p-3 ${isOverdue(selected.nextCalibrationDue) ? "border-red-300 bg-red-50 dark:bg-red-900/20" : isDueSoon(selected.nextCalibrationDue) ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
          >
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("calibration")}
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {t("last")} {selected.lastCalibrationDate || t("noDataDash")}
            </p>
            <p
              className={`text-sm ${isOverdue(selected.nextCalibrationDue) ? "text-red-600 font-bold" : ""}`}
            >
              {t("next")} {selected.nextCalibrationDue || t("noDataDash")}
              {isOverdue(selected.nextCalibrationDue) && ` ${t("overdue")}`}
            </p>
          </Card>
          <Card
            className={`p-3 ${isOverdue(selected.nextMaintenanceDue) ? "border-red-300 bg-red-50 dark:bg-red-900/20" : isDueSoon(selected.nextMaintenanceDue) ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
          >
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("maintenance")}
            </p>
            <p className="font-medium dark:text-dark-brand-text-primary">
              {t("last")} {selected.lastMaintenanceDate || t("noDataDash")}
            </p>
            <p
              className={`text-sm ${isOverdue(selected.nextMaintenanceDue) ? "text-red-600 font-bold" : ""}`}
            >
              {t("next")} {selected.nextMaintenanceDue || t("noDataDash")}
              {isOverdue(selected.nextMaintenanceDue) && ` ${t("overdue")}`}
            </p>
          </Card>
        </div>

        {/* Daily Temperature & Environmental Monitoring Log (CAP COM.30550 / ISO 15189) */}
        <Card className="p-4 border-l-4 border-l-sky-500">
          {(() => {
            const defaultMin =
              selected.targetTempMin ??
              (selected.category === "refrigerator"
                ? 2
                : selected.category === "freezer"
                  ? -25
                  : selected.category === "incubator"
                    ? selected.labSection.toLowerCase().includes("blood")
                      ? 20
                      : 35
                    : 18);
            const defaultMax =
              selected.targetTempMax ??
              (selected.category === "refrigerator"
                ? 8
                : selected.category === "freezer"
                  ? -15
                  : selected.category === "incubator"
                    ? selected.labSection.toLowerCase().includes("blood")
                      ? 24
                      : 37
                    : 25);
            const tempLogs = selected.temperatureLogs || [];
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm dark:text-dark-brand-text-primary">
                      Daily Temperature &amp; Cold-Chain Log (CAP COM.30550)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Acceptable Range:{" "}
                      <strong>
                        {defaultMin}&deg;C to {defaultMax}&deg;C
                      </strong>{" "}
                      &middot; {tempLogs.length} readings recorded
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTempForm((v) => !v)}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> Log Temperature
                  </Button>
                </div>

                {showTempForm && (
                  <div className="mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block font-medium mb-1">
                        Temperature (&deg;C) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tempForm.tempCelsius}
                        onChange={(e) =>
                          setTempForm({
                            ...tempForm,
                            tempCelsius: e.target.value,
                          })
                        }
                        placeholder={`${defaultMin} to ${defaultMax}`}
                        className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">
                        Humidity (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={tempForm.humidityPct}
                        onChange={(e) =>
                          setTempForm({
                            ...tempForm,
                            humidityPct: e.target.value,
                          })
                        }
                        placeholder="e.g. 45"
                        className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">
                        Recorded By *
                      </label>
                      <input
                        value={tempForm.recordedBy}
                        onChange={(e) =>
                          setTempForm({
                            ...tempForm,
                            recordedBy: e.target.value,
                          })
                        }
                        placeholder="Technologist name"
                        className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">
                        Excursion Action (if out of range)
                      </label>
                      <input
                        value={tempForm.correctiveAction}
                        onChange={(e) =>
                          setTempForm({
                            ...tempForm,
                            correctiveAction: e.target.value,
                          })
                        }
                        placeholder="Thermostat adjusted / moved"
                        className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTempForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          const tVal = parseFloat(tempForm.tempCelsius);
                          if (
                            !Number.isFinite(tVal) ||
                            !tempForm.recordedBy.trim()
                          )
                            return;
                          const inRange =
                            tVal >= defaultMin && tVal <= defaultMax;
                          const newEntry = {
                            id: `tmp-${Date.now()}`,
                            recordedAt: new Date().toISOString(),
                            recordedBy: tempForm.recordedBy.trim(),
                            tempCelsius: tVal,
                            humidityPct: tempForm.humidityPct
                              ? parseFloat(tempForm.humidityPct)
                              : undefined,
                            inRange,
                            correctiveAction:
                              tempForm.correctiveAction.trim() || undefined,
                          };
                          await updateEquipment({
                            ...selected,
                            temperatureLogs: [newEntry, ...tempLogs],
                            updatedAt: new Date().toISOString(),
                          });
                          setShowTempForm(false);
                          setTempForm({
                            tempCelsius: "",
                            humidityPct: "",
                            recordedBy: "",
                            correctiveAction: "",
                          });
                          if (!inRange) {
                            toast.warning(
                              `Temperature Excursion Alert: ${tVal}°C is outside [${defaultMin}°C .. ${defaultMax}°C]`,
                            );
                          } else {
                            toast.success(`Logged ${tVal}°C (Within Range)`);
                          }
                        }}
                      >
                        Save Reading
                      </Button>
                    </div>
                  </div>
                )}

                {tempLogs.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                        <th className="px-2 py-1.5 font-medium">Timestamp</th>
                        <th className="px-2 py-1.5 font-medium">Temp</th>
                        <th className="px-2 py-1.5 font-medium">Humidity</th>
                        <th className="px-2 py-1.5 font-medium">Status</th>
                        <th className="px-2 py-1.5 font-medium">By / Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempLogs.slice(0, 6).map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="px-2 py-1.5">
                            {new Date(log.recordedAt).toLocaleString()}
                          </td>
                          <td
                            className={`px-2 py-1.5 font-mono font-bold ${
                              log.inRange ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {log.tempCelsius}&deg;C
                          </td>
                          <td className="px-2 py-1.5">
                            {log.humidityPct ? `${log.humidityPct}%` : "—"}
                          </td>
                          <td className="px-2 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                log.inRange
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                            >
                              {log.inRange ? "In Range" : "EXCURSION"}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            {log.recordedBy}
                            {log.correctiveAction && (
                              <span className="text-gray-500">
                                {" "}
                                — {log.correctiveAction}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            );
          })()}
        </Card>

        {/* Calibration history */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold dark:text-dark-brand-text-primary">
              {t("calibrationHistory")}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCalForm(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" /> {t("recordCalibration")}
            </Button>
          </div>
          {showCalForm && (
            <Card className="p-3 mb-3 bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                    {t("dateRequired")}
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
                    {t("nextDue")}
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
                    {t("resultRequired")}
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
                    {t("performedByRequired")}
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
                    {t("vendor")}
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
                    {t("notes")}
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
                  {t("save")}
                </Button>
              </div>
            </Card>
          )}
          {selectedCals.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noCalibrationRecords")}</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-2 py-1.5 text-left font-medium">
                    {t("thDate")}
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    {t("thResult")}
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    {t("thBy")}
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    {t("thNextDue")}
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    {t("thNotes")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedCals.slice(0, calibrationLimit).map((c) => (
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
          <LabLogPager visible={calibrationLimit} total={selectedCals.length} onMore={() => setCalibrationLimit((n) => n + 25)} />
        </Card>

        {selected.notes && (
          <Card className="p-3">
            <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
              {t("notes")}
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
          {t("equipmentInventory")}
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" /> {t("addEquipment")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchEquipment")}
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
          <option value="all">{t("allStatuses")}</option>
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
          <option value="all">{t("allCategoriesEquip")}</option>
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
            {t("newEquipment")}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("nameRequired")}
              </label>
              <input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("manufacturerRequired")}
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
                {t("model")}
              </label>
              <input
                value={form.model || ""}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("serialNumberRequired")}
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
                {t("category")}
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
                {t("labSection")}
              </label>
              <input
                value={form.labSection || ""}
                onChange={(e) =>
                  setForm({ ...form, labSection: e.target.value })
                }
                placeholder={t("chemistryHematology")}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("location")}
              </label>
              <input
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-2 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-dark-brand-text-primary">
                {t("purchaseDate")}
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
              {t("addEquipment")}
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-3 py-2 font-medium">{t("thName")}</th>
              <th className="px-3 py-2 font-medium">{t("thCategory")}</th>
              <th className="px-3 py-2 font-medium">{t("thSection")}</th>
              <th className="px-3 py-2 font-medium">{t("thStatus")}</th>
              <th className="px-3 py-2 font-medium">Risk</th>
              <th className="px-3 py-2 font-medium">{t("thNextCal")}</th>
              <th className="px-3 py-2 font-medium">{t("thNextPM")}</th>
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
                <td className="px-3 py-2.5">
                  {/* Risk badge — Enhancement 4.4 */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${riskBadgeClass[computeAssetRiskLevel(eq)]}`}
                  >
                    {computeAssetRiskLevel(eq)}
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
                  {t("noEquipmentFound")}
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

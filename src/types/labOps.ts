/**
 * Lab Operations Module Types
 * Equipment management, calibration, maintenance, reagent tracking, proficiency testing
 */

// ── Tab Navigation ───────────────────────────────────────

export type LabOpsTab =
    | "equipment"
    | "maintenance"
    | "qcDashboard"
    | "reagents"
    | "proficiency";

// ── Equipment ────────────────────────────────────────────

export type EquipmentStatus =
    | "active"
    | "inactive"
    | "maintenance"
    | "calibration_due"
    | "decommissioned";

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    maintenance: "Under Maintenance",
    calibration_due: "Calibration Due",
    decommissioned: "Decommissioned",
};

export type EquipmentCategory =
    | "analyzer"
    | "centrifuge"
    | "microscope"
    | "incubator"
    | "refrigerator"
    | "freezer"
    | "water_bath"
    | "pipette"
    | "balance"
    | "safety_cabinet"
    | "other";

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
    analyzer: "Analyzer",
    centrifuge: "Centrifuge",
    microscope: "Microscope",
    incubator: "Incubator",
    refrigerator: "Refrigerator / Fridge",
    freezer: "Freezer",
    water_bath: "Water Bath",
    pipette: "Pipette / Dispenser",
    balance: "Balance / Scale",
    safety_cabinet: "Biosafety Cabinet",
    other: "Other",
};

export interface Equipment {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    assetTag?: string;
    category: EquipmentCategory;
    labSection: string; // Chemistry, Hematology, etc.
    location: string;
    status: EquipmentStatus;
    purchaseDate: string;
    installationDate?: string;
    warrantyExpiry?: string;
    lastCalibrationDate?: string;
    nextCalibrationDue?: string;
    calibrationIntervalDays: number;
    lastMaintenanceDate?: string;
    nextMaintenanceDue?: string;
    maintenanceIntervalDays: number;
    sopDocumentId?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Calibration ──────────────────────────────────────────

export type CalibrationResult = "pass" | "fail" | "adjusted";

export const CALIBRATION_RESULT_LABELS: Record<CalibrationResult, string> = {
    pass: "Pass",
    fail: "Fail",
    adjusted: "Adjusted & Pass",
};

export interface CalibrationRecord {
    id: string;
    equipmentId: string;
    equipmentName: string;
    calibratedBy: string;
    calibrationDate: string;
    nextDueDate: string;
    result: CalibrationResult;
    tolerance?: string;
    measuredValue?: string;
    expectedValue?: string;
    certificateDocId?: string;
    vendor?: string;
    notes?: string;
    createdAt: string;
}

// ── Maintenance ──────────────────────────────────────────

export type MaintenanceType = "preventive" | "corrective" | "emergency";

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
    preventive: "Preventive",
    corrective: "Corrective",
    emergency: "Emergency",
};

export type MaintenanceStatus =
    | "scheduled"
    | "in_progress"
    | "completed"
    | "overdue"
    | "cancelled";

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
    scheduled: "Scheduled",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
    cancelled: "Cancelled",
};

export interface MaintenanceLog {
    id: string;
    equipmentId: string;
    equipmentName: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    performedBy: string;
    scheduledDate: string;
    completedDate?: string;
    nextScheduled?: string;
    description: string;
    findings?: string;
    partsReplaced?: string[];
    downtimeHours?: number;
    cost?: number;
    vendorName?: string;
    workOrderNumber?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Reagent Tracking ─────────────────────────────────────

export type ReagentStatus =
    | "in_stock"
    | "low_stock"
    | "expired"
    | "depleted"
    | "quarantine";

export const REAGENT_STATUS_LABELS: Record<ReagentStatus, string> = {
    in_stock: "In Stock",
    low_stock: "Low Stock",
    expired: "Expired",
    depleted: "Depleted",
    quarantine: "Quarantine",
};

export interface Reagent {
    id: string;
    name: string;
    manufacturer: string;
    catalogNumber: string;
    lotNumber: string;
    expirationDate: string;
    receivedDate: string;
    openedDate?: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    storageConditions: string;
    storageTemperature?: string;
    labSection: string;
    status: ReagentStatus;
    associatedTests?: string[];
    associatedEquipmentId?: string;
    msdsDocId?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReagentUsageLog {
    id: string;
    reagentId: string;
    reagentName: string;
    usedBy: string;
    usageDate: string;
    quantityUsed: number;
    unit: string;
    equipmentId?: string;
    testCode?: string;
    notes?: string;
}

// ── Proficiency Testing ──────────────────────────────────

export type PTStatus =
    | "enrolled"
    | "sample_received"
    | "testing"
    | "submitted"
    | "reviewed"
    | "acceptable"
    | "unacceptable";

export const PT_STATUS_LABELS: Record<PTStatus, string> = {
    enrolled: "Enrolled",
    sample_received: "Sample Received",
    testing: "In Testing",
    submitted: "Submitted",
    reviewed: "Under Review",
    acceptable: "Acceptable",
    unacceptable: "Unacceptable",
};

export interface ProficiencyTest {
    id: string;
    program: string; // e.g., "CAP Surveys", "AABB PT"
    provider: string; // e.g., "CAP", "AABB", "API"
    surveyId: string;
    eventId?: string;
    analyteName: string;
    analyteCode?: string;
    labSection: string;
    enrollmentDate: string;
    sampleReceivedDate?: string;
    resultSubmittedDate?: string;
    reportDate?: string;
    submittedValue?: number;
    submittedUnit?: string;
    peerMean?: number;
    peerSD?: number;
    sdIndex?: number; // Standard Deviation Index
    score?: number;
    status: PTStatus;
    acceptable: boolean;
    correctiveActionRequired: boolean;
    correctiveActionId?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Seed Data ────────────────────────────────────────────

export const SEED_EQUIPMENT: Equipment[] = [
    {
        id: "eq-001",
        name: "Beckman AU5800 Chemistry Analyzer",
        manufacturer: "Beckman Coulter",
        model: "AU5800",
        serialNumber: "AU5800-2024-0123",
        assetTag: "LAB-0001",
        category: "analyzer",
        labSection: "Chemistry",
        location: "Main Lab — Bay 1",
        status: "active",
        purchaseDate: "2022-03-15",
        installationDate: "2022-04-01",
        warrantyExpiry: "2027-03-15",
        lastCalibrationDate: "2025-05-10",
        nextCalibrationDue: "2025-08-10",
        calibrationIntervalDays: 90,
        lastMaintenanceDate: "2025-04-20",
        nextMaintenanceDue: "2025-07-20",
        maintenanceIntervalDays: 90,
        notes: "Primary high-throughput chemistry analyzer",
        createdAt: "2022-04-01T00:00:00Z",
        updatedAt: "2025-05-10T00:00:00Z",
    },
    {
        id: "eq-002",
        name: "Sysmex XN-3100 Hematology",
        manufacturer: "Sysmex",
        model: "XN-3100",
        serialNumber: "XN3100-2023-0456",
        assetTag: "LAB-0002",
        category: "analyzer",
        labSection: "Hematology",
        location: "Main Lab — Bay 2",
        status: "active",
        purchaseDate: "2023-01-10",
        installationDate: "2023-02-01",
        warrantyExpiry: "2026-01-10",
        lastCalibrationDate: "2025-06-01",
        nextCalibrationDue: "2025-09-01",
        calibrationIntervalDays: 90,
        lastMaintenanceDate: "2025-05-15",
        nextMaintenanceDue: "2025-08-15",
        maintenanceIntervalDays: 90,
        createdAt: "2023-02-01T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
    {
        id: "eq-003",
        name: "Thermo Scientific Sorvall ST 40R",
        manufacturer: "Thermo Scientific",
        model: "Sorvall ST 40R",
        serialNumber: "TSS40R-2021-0789",
        assetTag: "LAB-0003",
        category: "centrifuge",
        labSection: "Chemistry",
        location: "Main Lab — Prep Area",
        status: "calibration_due",
        purchaseDate: "2021-06-20",
        lastCalibrationDate: "2025-01-15",
        nextCalibrationDue: "2025-07-15",
        calibrationIntervalDays: 180,
        lastMaintenanceDate: "2025-03-01",
        nextMaintenanceDue: "2025-09-01",
        maintenanceIntervalDays: 180,
        createdAt: "2021-06-20T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
    },
    {
        id: "eq-004",
        name: "Eppendorf Research Plus Pipette Set",
        manufacturer: "Eppendorf",
        model: "Research Plus 8-pack",
        serialNumber: "EPP-RP-2024-SET1",
        assetTag: "LAB-0010",
        category: "pipette",
        labSection: "Microbiology",
        location: "Micro Lab — Bench 3",
        status: "active",
        purchaseDate: "2024-01-05",
        lastCalibrationDate: "2025-04-01",
        nextCalibrationDue: "2025-10-01",
        calibrationIntervalDays: 180,
        lastMaintenanceDate: "2025-04-01",
        nextMaintenanceDue: "2025-10-01",
        maintenanceIntervalDays: 180,
        createdAt: "2024-01-05T00:00:00Z",
        updatedAt: "2025-04-01T00:00:00Z",
    },
    {
        id: "eq-005",
        name: "Helmer i.Series Platelet Incubator",
        manufacturer: "Helmer Scientific",
        model: "i.C111",
        serialNumber: "HIC111-2022-0234",
        category: "incubator",
        labSection: "Blood Bank",
        location: "Blood Bank — Room B12",
        status: "active",
        purchaseDate: "2022-09-01",
        lastCalibrationDate: "2025-05-20",
        nextCalibrationDue: "2025-11-20",
        calibrationIntervalDays: 180,
        lastMaintenanceDate: "2025-03-10",
        nextMaintenanceDue: "2025-09-10",
        maintenanceIntervalDays: 180,
        createdAt: "2022-09-01T00:00:00Z",
        updatedAt: "2025-05-20T00:00:00Z",
    },
    {
        id: "eq-006",
        name: "bioMérieux VITEK 2 Compact",
        manufacturer: "bioMérieux",
        model: "VITEK 2 Compact",
        serialNumber: "V2C-2023-0567",
        assetTag: "LAB-0006",
        category: "analyzer",
        labSection: "Microbiology",
        location: "Micro Lab — Bay 1",
        status: "maintenance",
        purchaseDate: "2023-05-15",
        lastCalibrationDate: "2025-04-10",
        nextCalibrationDue: "2025-07-10",
        calibrationIntervalDays: 90,
        lastMaintenanceDate: "2025-06-15",
        nextMaintenanceDue: "2025-06-20",
        maintenanceIntervalDays: 90,
        notes: "Scheduled PM in progress — expected back 06/20",
        createdAt: "2023-05-15T00:00:00Z",
        updatedAt: "2025-06-15T00:00:00Z",
    },
];

export const SEED_MAINTENANCE_LOGS: MaintenanceLog[] = [
    {
        id: "ml-001",
        equipmentId: "eq-001",
        equipmentName: "Beckman AU5800 Chemistry Analyzer",
        type: "preventive",
        status: "completed",
        performedBy: "Beckman Coulter FSE",
        scheduledDate: "2025-04-20",
        completedDate: "2025-04-20",
        nextScheduled: "2025-07-20",
        description: "Quarterly preventive maintenance — reagent probes, ISE module, wash stations",
        findings: "All within tolerance. Replaced ISE membrane.",
        partsReplaced: ["ISE membrane", "Sample probe O-ring"],
        downtimeHours: 4,
        vendorName: "Beckman Coulter",
        workOrderNumber: "WO-2025-0412",
        createdAt: "2025-04-20T08:00:00Z",
        updatedAt: "2025-04-20T12:00:00Z",
    },
    {
        id: "ml-002",
        equipmentId: "eq-002",
        equipmentName: "Sysmex XN-3100 Hematology",
        type: "preventive",
        status: "completed",
        performedBy: "Sysmex FSE",
        scheduledDate: "2025-05-15",
        completedDate: "2025-05-15",
        nextScheduled: "2025-08-15",
        description: "Quarterly PM — sheath flow, laser optics, piercer needle",
        findings: "Laser alignment within spec. Replaced piercer needle.",
        partsReplaced: ["Piercer needle"],
        downtimeHours: 3,
        vendorName: "Sysmex America",
        workOrderNumber: "WO-2025-0515",
        createdAt: "2025-05-15T08:00:00Z",
        updatedAt: "2025-05-15T11:00:00Z",
    },
    {
        id: "ml-003",
        equipmentId: "eq-006",
        equipmentName: "bioMérieux VITEK 2 Compact",
        type: "corrective",
        status: "in_progress",
        performedBy: "bioMérieux FSE",
        scheduledDate: "2025-06-15",
        description: "Card reader intermittent failures — replacement of optical reader assembly",
        downtimeHours: 8,
        vendorName: "bioMérieux",
        workOrderNumber: "WO-2025-0615",
        createdAt: "2025-06-15T09:00:00Z",
        updatedAt: "2025-06-15T09:00:00Z",
    },
    {
        id: "ml-004",
        equipmentId: "eq-003",
        equipmentName: "Thermo Scientific Sorvall ST 40R",
        type: "preventive",
        status: "scheduled",
        performedBy: "In-house",
        scheduledDate: "2025-09-01",
        description: "Semi-annual PM — rotor inspection, speed verification, temp validation",
        createdAt: "2025-06-01T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
];

export const SEED_CALIBRATION_RECORDS: CalibrationRecord[] = [
    {
        id: "cal-001",
        equipmentId: "eq-001",
        equipmentName: "Beckman AU5800 Chemistry Analyzer",
        calibratedBy: "Lab Supervisor",
        calibrationDate: "2025-05-10",
        nextDueDate: "2025-08-10",
        result: "pass",
        notes: "All 60 analytes within ±5% of target. ISE Na/K/Cl within specs.",
        createdAt: "2025-05-10T08:00:00Z",
    },
    {
        id: "cal-002",
        equipmentId: "eq-002",
        equipmentName: "Sysmex XN-3100 Hematology",
        calibratedBy: "Sysmex FSE",
        calibrationDate: "2025-06-01",
        nextDueDate: "2025-09-01",
        result: "pass",
        notes: "CBC 5-part diff calibration verified with XN-CHECK L1/L2/L3",
        createdAt: "2025-06-01T08:00:00Z",
    },
    {
        id: "cal-003",
        equipmentId: "eq-004",
        equipmentName: "Eppendorf Research Plus Pipette Set",
        calibratedBy: "External – Pipette.com",
        calibrationDate: "2025-04-01",
        nextDueDate: "2025-10-01",
        result: "adjusted",
        tolerance: "±1.0% @ 100μL",
        measuredValue: "101.2μL",
        expectedValue: "100.0μL",
        vendor: "Pipette.com",
        notes: "P100 adjusted from 101.2→100.0. Certificate in Calibration folder.",
        createdAt: "2025-04-01T10:00:00Z",
    },
];

export const SEED_REAGENTS: Reagent[] = [
    {
        id: "rg-001",
        name: "Glucose Reagent R1/R2",
        manufacturer: "Beckman Coulter",
        catalogNumber: "OSR6121",
        lotNumber: "LOT-2025-G-4567",
        expirationDate: "2025-12-31",
        receivedDate: "2025-03-01",
        openedDate: "2025-05-15",
        quantity: 450,
        unit: "mL",
        reorderLevel: 200,
        storageConditions: "Refrigerated 2-8°C",
        storageTemperature: "2-8°C",
        labSection: "Chemistry",
        status: "in_stock",
        associatedTests: ["GLU", "OGTT"],
        associatedEquipmentId: "eq-001",
        createdAt: "2025-03-01T00:00:00Z",
        updatedAt: "2025-05-15T00:00:00Z",
    },
    {
        id: "rg-002",
        name: "XN-CHECK Hematology Control Level 2",
        manufacturer: "Sysmex",
        catalogNumber: "XN-CHK-L2",
        lotNumber: "LOT-2025-H-0102",
        expirationDate: "2025-09-30",
        receivedDate: "2025-02-15",
        openedDate: "2025-06-01",
        quantity: 8,
        unit: "vials",
        reorderLevel: 5,
        storageConditions: "Refrigerated 2-8°C",
        labSection: "Hematology",
        status: "in_stock",
        associatedEquipmentId: "eq-002",
        createdAt: "2025-02-15T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
    {
        id: "rg-003",
        name: "Troponin I High Sensitive Reagent",
        manufacturer: "Beckman Coulter",
        catalogNumber: "B13935",
        lotNumber: "LOT-2025-T-0890",
        expirationDate: "2025-07-15",
        receivedDate: "2025-01-20",
        openedDate: "2025-04-10",
        quantity: 50,
        unit: "tests",
        reorderLevel: 100,
        storageConditions: "Refrigerated 2-8°C",
        labSection: "Chemistry",
        status: "low_stock",
        associatedTests: ["TNIH"],
        associatedEquipmentId: "eq-001",
        createdAt: "2025-01-20T00:00:00Z",
        updatedAt: "2025-06-10T00:00:00Z",
    },
    {
        id: "rg-004",
        name: "Blood Culture Media FA Plus",
        manufacturer: "bioMérieux",
        catalogNumber: "259791",
        lotNumber: "LOT-2024-BC-1234",
        expirationDate: "2025-06-01",
        receivedDate: "2024-08-15",
        quantity: 0,
        unit: "bottles",
        reorderLevel: 50,
        storageConditions: "Room Temperature",
        labSection: "Microbiology",
        status: "expired",
        createdAt: "2024-08-15T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
];

export const SEED_PROFICIENCY_TESTS: ProficiencyTest[] = [
    {
        id: "pt-001",
        program: "CAP Chemistry Survey",
        provider: "CAP",
        surveyId: "C-A 2025",
        eventId: "C-A 2025-01",
        analyteName: "Glucose",
        analyteCode: "GLU",
        labSection: "Chemistry",
        enrollmentDate: "2024-12-01",
        sampleReceivedDate: "2025-02-10",
        resultSubmittedDate: "2025-02-14",
        reportDate: "2025-04-01",
        submittedValue: 105.2,
        submittedUnit: "mg/dL",
        peerMean: 104.8,
        peerSD: 3.2,
        sdIndex: 0.125,
        score: 100,
        status: "acceptable",
        acceptable: true,
        correctiveActionRequired: false,
        createdAt: "2024-12-01T00:00:00Z",
        updatedAt: "2025-04-01T00:00:00Z",
    },
    {
        id: "pt-002",
        program: "CAP Hematology Survey",
        provider: "CAP",
        surveyId: "H-A 2025",
        analyteName: "WBC",
        labSection: "Hematology",
        enrollmentDate: "2024-12-01",
        sampleReceivedDate: "2025-03-05",
        resultSubmittedDate: "2025-03-08",
        reportDate: "2025-05-01",
        submittedValue: 7.8,
        submittedUnit: "×10³/μL",
        peerMean: 7.65,
        peerSD: 0.42,
        sdIndex: 0.357,
        score: 100,
        status: "acceptable",
        acceptable: true,
        correctiveActionRequired: false,
        createdAt: "2024-12-01T00:00:00Z",
        updatedAt: "2025-05-01T00:00:00Z",
    },
    {
        id: "pt-003",
        program: "CAP Chemistry Survey",
        provider: "CAP",
        surveyId: "C-B 2025",
        eventId: "C-B 2025-01",
        analyteName: "HbA1c",
        analyteCode: "A1C",
        labSection: "Chemistry",
        enrollmentDate: "2024-12-01",
        sampleReceivedDate: "2025-05-12",
        status: "testing",
        acceptable: false,
        correctiveActionRequired: false,
        createdAt: "2024-12-01T00:00:00Z",
        updatedAt: "2025-05-12T00:00:00Z",
    },
    {
        id: "pt-004",
        program: "CAP Microbiology Survey",
        provider: "CAP",
        surveyId: "MB-A 2025",
        analyteName: "Culture ID / Susceptibility",
        labSection: "Microbiology",
        enrollmentDate: "2024-12-01",
        sampleReceivedDate: "2025-04-20",
        resultSubmittedDate: "2025-04-28",
        reportDate: "2025-06-01",
        score: 80,
        status: "unacceptable",
        acceptable: false,
        correctiveActionRequired: true,
        notes:
            "Incorrect susceptibility interpretation for ESBL-producing E. coli. CAPA initiated.",
        createdAt: "2024-12-01T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
];

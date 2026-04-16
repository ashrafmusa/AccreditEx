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
    | "proficiency"
    | "qualityManagement"
    | "iqcWestgard"
    | "competencyMatrix";

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
    supplierId?: string;
    supplierName?: string;
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
    qualityFlag?: "normal" | "under_investigation" | "blocked";
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
        supplierId: "sup-001",
        supplierName: "Gulf Medical Supplies",
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
        qualityFlag: "normal",
        createdAt: "2025-03-01T00:00:00Z",
        updatedAt: "2025-05-15T00:00:00Z",
    },
    {
        id: "rg-002",
        name: "XN-CHECK Hematology Control Level 2",
        manufacturer: "Sysmex",
        supplierId: "sup-002",
        supplierName: "Arabian Diagnostics Trading",
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
        qualityFlag: "normal",
        createdAt: "2025-02-15T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
    {
        id: "rg-003",
        name: "Troponin I High Sensitive Reagent",
        manufacturer: "Beckman Coulter",
        supplierId: "sup-001",
        supplierName: "Gulf Medical Supplies",
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
        qualityFlag: "normal",
        createdAt: "2025-01-20T00:00:00Z",
        updatedAt: "2025-06-10T00:00:00Z",
    },
    {
        id: "rg-004",
        name: "Blood Culture Media FA Plus",
        manufacturer: "bioMérieux",
        supplierId: "sup-003",
        supplierName: "MicroLab Partners",
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
        qualityFlag: "blocked",
        createdAt: "2024-08-15T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
    },
];

export const SEED_COMPETENCY_RECORDS: CompetencyRecord[] = [
    {
        id: "comp-001",
        staffId: "staff-101",
        staffName: "A. Hassan",
        analyteCode: "GLU-L1",
        analyteName: "Glucose",
        labSection: "Chemistry",
        level: 1,
        status: "authorized",
        authorizedUntil: "2026-12-31",
        lastAssessedDate: "2026-01-10",
        assessor: "Dr. M. Khan",
        createdAt: "2026-01-10T00:00:00Z",
        updatedAt: "2026-01-10T00:00:00Z",
    },
    {
        id: "comp-002",
        staffId: "staff-102",
        staffName: "S. Al-Farsi",
        analyteCode: "GLU-L1",
        analyteName: "Glucose",
        labSection: "Chemistry",
        level: 1,
        status: "authorized",
        authorizedUntil: "2026-12-31",
        lastAssessedDate: "2026-01-12",
        assessor: "Dr. M. Khan",
        createdAt: "2026-01-12T00:00:00Z",
        updatedAt: "2026-01-12T00:00:00Z",
    },
    {
        id: "comp-003",
        staffId: "staff-103",
        staffName: "M. Al-Rashidi",
        analyteCode: "GLU-L1",
        analyteName: "Glucose",
        labSection: "Chemistry",
        level: 1,
        status: "expired",
        authorizedUntil: "2025-12-31",
        lastAssessedDate: "2025-01-10",
        assessor: "Dr. M. Khan",
        notes: "Reassessment pending annual competency renewal.",
        createdAt: "2025-01-10T00:00:00Z",
        updatedAt: "2026-01-05T00:00:00Z",
    },
    {
        id: "comp-004",
        staffId: "staff-104",
        staffName: "H. Al-Kindi",
        analyteCode: "WBC-L2",
        analyteName: "WBC",
        labSection: "Hematology",
        level: 2,
        status: "authorized",
        authorizedUntil: "2026-10-31",
        lastAssessedDate: "2026-02-01",
        assessor: "Dr. F. Noor",
        createdAt: "2026-02-01T00:00:00Z",
        updatedAt: "2026-02-01T00:00:00Z",
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

// ── Quality Events & CAPA (LQMS Core) ───────────────────

export type QualityEventSource =
    | "internal_qc"
    | "proficiency_testing"
    | "customer_complaint"
    | "audit_finding"
    | "incident";

export const QUALITY_EVENT_SOURCE_LABELS: Record<QualityEventSource, string> = {
    internal_qc: "Internal QC",
    proficiency_testing: "Proficiency Testing",
    customer_complaint: "Customer Complaint",
    audit_finding: "Audit Finding",
    incident: "Incident",
};

export type QualityEventSeverity = "low" | "medium" | "high" | "critical";

export const QUALITY_EVENT_SEVERITY_LABELS: Record<QualityEventSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
};

export type QualityEventStatus =
    | "open"
    | "investigating"
    | "capa_assigned"
    | "implemented"
    | "verified"
    | "closed";

export const QUALITY_EVENT_STATUS_LABELS: Record<QualityEventStatus, string> = {
    open: "Open",
    investigating: "Investigating",
    capa_assigned: "CAPA Assigned",
    implemented: "Implemented",
    verified: "Verified",
    closed: "Closed",
};

export type RecurrenceRisk = "low" | "medium" | "high";

export interface QualityEvent {
    id: string;
    eventDate: string;
    labSection: string;
    source: QualityEventSource;
    title: string;
    description: string;
    severity: QualityEventSeverity;
    status: QualityEventStatus;
    immediateContainment?: string;
    rootCause?: string;
    capaId?: string;
    recurrenceRisk?: RecurrenceRisk;
    createdAt: string;
    updatedAt: string;
}

export type CAPAStatus = "open" | "in_progress" | "effectiveness_check" | "closed" | "overdue";

export const CAPA_STATUS_LABELS: Record<CAPAStatus, string> = {
    open: "Open",
    in_progress: "In Progress",
    effectiveness_check: "Effectiveness Check",
    closed: "Closed",
    overdue: "Overdue",
};

export interface CAPARecord {
    id: string;
    title: string;
    sourceEventId?: string;
    owner: string;
    dueDate: string;
    status: CAPAStatus;
    actionPlan: string;
    effectivenessCriteria?: string;
    completedDate?: string;
    verifiedDate?: string;
    createdAt: string;
    updatedAt: string;
}

export type QualityRiskStatus = "open" | "mitigated" | "accepted" | "closed";

export const QUALITY_RISK_STATUS_LABELS: Record<QualityRiskStatus, string> = {
    open: "Open",
    mitigated: "Mitigated",
    accepted: "Accepted",
    closed: "Closed",
};

export type QualityRiskLevel = "low" | "medium" | "high" | "critical";

export const QUALITY_RISK_LEVEL_LABELS: Record<QualityRiskLevel, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
};

export interface QualityRiskRecord {
    id: string;
    sourceEventId?: string;
    relatedCapaId?: string;
    relatedSupplierId?: string;
    relatedSupplierName?: string;
    relatedReagentLot?: string;
    title: string;
    hazard: string;
    potentialHarm: string;
    labSection: string;
    owner: string;
    likelihood: 1 | 2 | 3 | 4 | 5;
    impact: 1 | 2 | 3 | 4 | 5;
    riskScore: number;
    riskLevel: QualityRiskLevel;
    status: QualityRiskStatus;
    mitigationPlan?: string;
    reviewDate?: string;
    createdAt: string;
    updatedAt: string;
}

export const SEED_QUALITY_EVENTS: QualityEvent[] = [
    {
        id: "qe-001",
        eventDate: "2025-06-01",
        labSection: "Microbiology",
        source: "proficiency_testing",
        title: "Unacceptable PT performance in susceptibility interpretation",
        description:
            "Incorrect interpretation reported for ESBL-producing E. coli in CAP PT event.",
        severity: "high",
        status: "capa_assigned",
        immediateContainment:
            "Second-person review mandated for all AST interpretations until remediation completed.",
        rootCause: "Decision-tree update gap and competency drift on CLSI breakpoint revisions.",
        capaId: "capa-001",
        recurrenceRisk: "medium",
        createdAt: "2025-06-01T00:00:00Z",
        updatedAt: "2025-06-02T00:00:00Z",
    },
    {
        id: "qe-002",
        eventDate: "2025-05-18",
        labSection: "Chemistry",
        source: "internal_qc",
        title: "Westgard 1-3s breach for Troponin control",
        description:
            "Control level 2 exceeded +3SD on Beckman AU5800 during morning run.",
        severity: "critical",
        status: "implemented",
        immediateContainment:
            "Patient reporting paused, rerun performed with fresh calibration and reagent lot verification.",
        rootCause: "Reagent stability degradation after prolonged open-vial use.",
        capaId: "capa-002",
        recurrenceRisk: "low",
        createdAt: "2025-05-18T00:00:00Z",
        updatedAt: "2025-05-20T00:00:00Z",
    },
    {
        id: "qe-003",
        eventDate: "2025-04-28",
        labSection: "Specimen Reception",
        source: "incident",
        title: "Mislabeled sample detected at accessioning",
        description:
            "Two outpatient samples had swapped identifiers before processing.",
        severity: "high",
        status: "closed",
        immediateContainment:
            "All affected specimens quarantined and recollection initiated.",
        rootCause: "Manual handwritten labels without barcode verification at collection point.",
        recurrenceRisk: "low",
        createdAt: "2025-04-28T00:00:00Z",
        updatedAt: "2025-05-10T00:00:00Z",
    },
];

export const SEED_CAPA_RECORDS: CAPARecord[] = [
    {
        id: "capa-001",
        title: "PT AST interpretation remediation plan",
        sourceEventId: "qe-001",
        owner: "Microbiology Supervisor",
        dueDate: "2025-07-15",
        status: "in_progress",
        actionPlan:
            "Retrain all microbiology staff on updated CLSI breakpoints and implement dual-review for 30 days.",
        effectivenessCriteria:
            "No AST interpretation discordance >2% for 2 consecutive monthly audits.",
        createdAt: "2025-06-02T00:00:00Z",
        updatedAt: "2025-06-10T00:00:00Z",
    },
    {
        id: "capa-002",
        title: "Troponin QC stability CAPA",
        sourceEventId: "qe-002",
        owner: "Chemistry Lead",
        dueDate: "2025-06-25",
        status: "effectiveness_check",
        actionPlan:
            "Reduce open-vial duration, add reagent open-date validation in daily checklist, and enforce lot-change verification.",
        effectivenessCriteria:
            "Zero Westgard 1-3s events for Troponin controls across 4 weeks post-change.",
        completedDate: "2025-06-18",
        createdAt: "2025-05-20T00:00:00Z",
        updatedAt: "2025-06-20T00:00:00Z",
    },
];

export const SEED_QUALITY_RISKS: QualityRiskRecord[] = [
    {
        id: "qr-001",
        sourceEventId: "qe-001",
        relatedCapaId: "capa-001",
        title: "AST interpretation drift risk",
        hazard: "Outdated breakpoint interpretation for resistant organisms",
        potentialHarm: "Inappropriate antimicrobial therapy and delayed effective treatment",
        labSection: "Microbiology",
        owner: "Microbiology Supervisor",
        likelihood: 3,
        impact: 4,
        riskScore: 12,
        riskLevel: "high",
        status: "open",
        mitigationPlan:
            "Implement double-review and competency reassessment until monthly discordance is below threshold.",
        reviewDate: "2025-07-15",
        createdAt: "2025-06-02T00:00:00Z",
        updatedAt: "2025-06-10T00:00:00Z",
    },
    {
        id: "qr-002",
        sourceEventId: "qe-002",
        relatedCapaId: "capa-002",
        title: "Troponin false result risk",
        hazard: "Control instability from reagent handling and open-vial exposure",
        potentialHarm: "Incorrect clinical decision based on inaccurate troponin result",
        labSection: "Chemistry",
        owner: "Chemistry Lead",
        likelihood: 2,
        impact: 5,
        riskScore: 10,
        riskLevel: "high",
        status: "mitigated",
        mitigationPlan:
            "Enforce vial open-date limits and lot-change verification checklist with weekly review.",
        reviewDate: "2025-06-30",
        createdAt: "2025-05-20T00:00:00Z",
        updatedAt: "2025-06-20T00:00:00Z",
    },
];

// IQC / Westgard rules
export type WestgardRule = "1_2s" | "1_3s" | "2_2s" | "R_4s" | "4_1s" | "10_x";

export const WESTGARD_RULE_LABELS: Record<WestgardRule, string> = {
    "1_2s": "1_2s Warning",
    "1_3s": "1_3s Reject",
    "2_2s": "2_2s Reject",
    "R_4s": "R_4s Reject",
    "4_1s": "4_1s Reject",
    "10_x": "10_x Reject",
};

export const WESTGARD_REJECT_RULES = new Set<WestgardRule>([
    "1_3s",
    "2_2s",
    "R_4s",
    "4_1s",
    "10_x",
]);

export type IQCLevel = 1 | 2 | 3;

export interface IQCAnalyte {
    id: string;
    analyteCode: string;
    analyteName: string;
    labSection: string;
    equipmentId: string;
    equipmentName: string;
    controlMaterial: string;
    controlLot: string;
    level: IQCLevel;
    targetMean: number;
    targetSD: number;
    unit: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IQCResult {
    id: string;
    analyteId: string;
    analyteName: string;
    analyteCode: string;
    labSection: string;
    equipmentId: string;
    level: IQCLevel;
    measuredValue: number;
    sdFromMean: number;
    measuredAt: string;
    measuredBy: string;
    reagentLot?: string;
    violatedRules: WestgardRule[];
    rejected: boolean;
    operatorAuthorizationStatus?: "authorized" | "expired" | "missing";
    operatorCompetencyRecordId?: string;
    linkedQualityEventId?: string;
    linkedRiskRecordId?: string;
    linkedCapaId?: string;
    note?: string;
    createdAt: string;
}

export type CompetencyStatus = "authorized" | "expired" | "revoked";

export const COMPETENCY_STATUS_LABELS: Record<CompetencyStatus, string> = {
    authorized: "Authorized",
    expired: "Expired",
    revoked: "Revoked",
};

export interface CompetencyRecord {
    id: string;
    staffId?: string;
    staffName: string;
    analyteCode: string;
    analyteName: string;
    labSection: string;
    level?: IQCLevel;
    status: CompetencyStatus;
    authorizedUntil: string;
    lastAssessedDate: string;
    assessor: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CompetencyGate {
    authorized: boolean;
    status: "authorized" | "expired" | "missing";
    record?: CompetencyRecord;
}

function normalizeNameForMatch(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function normalizeAnalyteCodeForMatch(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function getAnalyteBaseCode(value: string): string {
    const normalized = normalizeAnalyteCodeForMatch(value);
    return normalized.replace(/l[123]$/, "");
}

export function checkCompetencyAuthorization(
    records: CompetencyRecord[],
    staffName: string,
    analyteCode: string,
    asOfDateIso?: string,
): CompetencyGate {
    const normalizedStaff = normalizeNameForMatch(staffName);
    const normalizedAnalyte = normalizeAnalyteCodeForMatch(analyteCode);
    if (!normalizedStaff || !normalizedAnalyte) {
        return { authorized: false, status: "missing" };
    }

    const analyteBaseCode = getAnalyteBaseCode(analyteCode);

    const matched = records.find(
        (r) =>
            normalizeNameForMatch(r.staffName) === normalizedStaff &&
            (
                normalizeAnalyteCodeForMatch(r.analyteCode) === normalizedAnalyte ||
                getAnalyteBaseCode(r.analyteCode) === analyteBaseCode
            ),
    );

    if (!matched) {
        return { authorized: false, status: "missing" };
    }

    const asOf = asOfDateIso ? new Date(asOfDateIso) : new Date();
    const authorizedUntil = new Date(matched.authorizedUntil);
    const isCurrent = matched.status === "authorized" && authorizedUntil >= asOf;

    return {
        authorized: isCurrent,
        status: isCurrent ? "authorized" : "expired",
        record: matched,
    };
}

export function applyWestgardRules(history: IQCResult[], z: number): WestgardRule[] {
    const violations: WestgardRule[] = [];

    if (Math.abs(z) > 2) violations.push("1_2s");
    if (Math.abs(z) > 3) violations.push("1_3s");

    const recent = [z, ...history.slice(0, 11).map((r) => r.sdFromMean)];

    if (recent.length >= 2) {
        const [a, b] = recent;
        if ((a > 2 && b > 2) || (a < -2 && b < -2)) violations.push("2_2s");
        if ((a > 2 && b < -2) || (a < -2 && b > 2)) violations.push("R_4s");
    }

    if (recent.length >= 4) {
        const f4 = recent.slice(0, 4);
        if (f4.every((v) => v > 1) || f4.every((v) => v < -1)) violations.push("4_1s");
    }

    if (recent.length >= 10) {
        const f10 = recent.slice(0, 10);
        if (f10.every((v) => v > 0) || f10.every((v) => v < 0)) violations.push("10_x");
    }

    return violations;
}

export const SEED_IQC_ANALYTES: IQCAnalyte[] = [
    {
        id: "iqca-001",
        analyteCode: "GLU-L1",
        analyteName: "Glucose",
        labSection: "Chemistry",
        equipmentId: "eq-001",
        equipmentName: "Beckman AU5800",
        controlMaterial: "Lyphochek Chemistry Control",
        controlLot: "LOT-2026-LC-001",
        level: 1,
        targetMean: 98.5,
        targetSD: 2.8,
        unit: "mg/dL",
        active: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "iqca-002",
        analyteCode: "GLU-L2",
        analyteName: "Glucose",
        labSection: "Chemistry",
        equipmentId: "eq-001",
        equipmentName: "Beckman AU5800",
        controlMaterial: "Lyphochek Chemistry Control",
        controlLot: "LOT-2026-LC-001",
        level: 2,
        targetMean: 262.0,
        targetSD: 6.5,
        unit: "mg/dL",
        active: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "iqca-003",
        analyteCode: "WBC-L2",
        analyteName: "WBC",
        labSection: "Hematology",
        equipmentId: "eq-002",
        equipmentName: "Sysmex XN-3100",
        controlMaterial: "XN-CHECK Level 2",
        controlLot: "LOT-2025-H-0102",
        level: 2,
        targetMean: 7.8,
        targetSD: 0.35,
        unit: "x10^3/uL",
        active: true,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
    },
];

function sr(
    id: string,
    analyteId: string,
    analyteName: string,
    analyteCode: string,
    labSection: string,
    equipmentId: string,
    level: IQCLevel,
    measuredValue: number,
    sdFromMean: number,
    measuredAt: string,
    measuredBy: string,
    reagentLot: string,
    violatedRules: WestgardRule[],
    rejected: boolean,
): IQCResult {
    return {
        id,
        analyteId,
        analyteName,
        analyteCode,
        labSection,
        equipmentId,
        level,
        measuredValue,
        sdFromMean,
        measuredAt,
        measuredBy,
        reagentLot,
        violatedRules,
        rejected,
        createdAt: measuredAt,
    };
}

export const SEED_IQC_RESULTS: IQCResult[] = [
    sr("iqcr-001", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 97.2, -0.46, "2026-03-10T07:30:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-002", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 99.8, 0.46, "2026-03-11T07:30:00Z", "S. Al-Farsi", "LOT-2026-G-01", [], false),
    sr("iqcr-003", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 98.1, -0.14, "2026-03-12T07:30:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-004", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 100.4, 0.68, "2026-03-13T07:30:00Z", "M. Al-Rashidi", "LOT-2026-G-01", [], false),
    sr("iqcr-005", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 97.9, -0.21, "2026-03-14T07:30:00Z", "S. Al-Farsi", "LOT-2026-G-01", [], false),
    sr("iqcr-006", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 96.5, -0.71, "2026-03-15T07:30:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-007", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 98.8, 0.11, "2026-03-16T07:30:00Z", "M. Al-Rashidi", "LOT-2026-G-01", [], false),
    sr("iqcr-008", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 99.2, 0.25, "2026-03-17T07:30:00Z", "S. Al-Farsi", "LOT-2026-G-01", [], false),
    sr("iqcr-009", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 97.5, -0.36, "2026-03-18T07:30:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-010", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 100.1, 0.57, "2026-03-19T07:30:00Z", "M. Al-Rashidi", "LOT-2026-G-01", [], false),
    sr("iqcr-011", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 101.5, 1.07, "2026-03-20T07:30:00Z", "S. Al-Farsi", "LOT-2026-G-01", [], false),
    sr("iqcr-012", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 102.8, 1.54, "2026-03-21T07:30:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-013", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 104.3, 2.07, "2026-03-22T07:30:00Z", "M. Al-Rashidi", "LOT-2026-G-01", ["1_2s"], false),
    sr("iqcr-014", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 107.4, 3.18, "2026-03-23T07:30:00Z", "S. Al-Farsi", "LOT-2026-G-01", ["1_2s", "1_3s", "2_2s", "4_1s"], true),
    sr("iqcr-015", "iqca-001", "Glucose", "GLU-L1", "Chemistry", "eq-001", 1, 99.5, 0.36, "2026-03-24T07:30:00Z", "A. Hassan", "LOT-2026-G-02", [], false),

    sr("iqcr-016", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 261.2, -0.12, "2026-03-14T08:00:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-017", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 263.5, 0.23, "2026-03-15T08:00:00Z", "S. Al-Farsi", "LOT-2026-G-01", [], false),
    sr("iqcr-018", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 260.8, -0.18, "2026-03-16T08:00:00Z", "M. Al-Rashidi", "LOT-2026-G-01", [], false),
    sr("iqcr-019", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 264.3, 0.35, "2026-03-17T08:00:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-020", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 261.5, -0.08, "2026-03-18T08:00:00Z", "S. Al-Farsi", "LOT-2026-G-01", [], false),
    sr("iqcr-021", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 262.9, 0.14, "2026-03-19T08:00:00Z", "M. Al-Rashidi", "LOT-2026-G-01", [], false),
    sr("iqcr-022", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 265.1, 0.48, "2026-03-20T08:00:00Z", "A. Hassan", "LOT-2026-G-01", [], false),
    sr("iqcr-023", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 275.2, 2.03, "2026-03-21T08:00:00Z", "S. Al-Farsi", "LOT-2026-G-01", ["1_2s"], false),
    sr("iqcr-024", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 276.8, 2.28, "2026-03-22T08:00:00Z", "M. Al-Rashidi", "LOT-2026-G-01", ["1_2s", "2_2s"], true),
    sr("iqcr-025", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 263.5, 0.23, "2026-03-23T08:00:00Z", "A. Hassan", "LOT-2026-G-02", [], false),
    sr("iqcr-026", "iqca-002", "Glucose", "GLU-L2", "Chemistry", "eq-001", 2, 261.8, -0.03, "2026-03-24T08:00:00Z", "S. Al-Farsi", "LOT-2026-G-02", [], false),

    sr("iqcr-027", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.95, 0.43, "2026-03-12T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0102", [], false),
    sr("iqcr-028", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.92, 0.34, "2026-03-13T08:30:00Z", "H. Al-Kindi", "LOT-2025-H-0102", [], false),
    sr("iqcr-029", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.88, 0.23, "2026-03-14T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0102", [], false),
    sr("iqcr-030", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.85, 0.14, "2026-03-15T08:30:00Z", "H. Al-Kindi", "LOT-2025-H-0102", [], false),
    sr("iqcr-031", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.83, 0.09, "2026-03-16T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0102", [], false),
    sr("iqcr-032", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.9, 0.29, "2026-03-17T08:30:00Z", "H. Al-Kindi", "LOT-2025-H-0102", [], false),
    sr("iqcr-033", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 8.17, 1.06, "2026-03-18T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0102", [], false),
    sr("iqcr-034", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 8.21, 1.17, "2026-03-19T08:30:00Z", "H. Al-Kindi", "LOT-2025-H-0102", [], false),
    sr("iqcr-035", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 8.25, 1.29, "2026-03-20T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0102", [], false),
    sr("iqcr-036", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 8.28, 1.37, "2026-03-21T08:30:00Z", "H. Al-Kindi", "LOT-2025-H-0102", ["4_1s", "10_x"], true),
    sr("iqcr-037", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.72, -0.23, "2026-03-22T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0103", [], false),
    sr("iqcr-038", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.8, 0.0, "2026-03-23T08:30:00Z", "H. Al-Kindi", "LOT-2025-H-0103", [], false),
    sr("iqcr-039", "iqca-003", "WBC", "WBC-L2", "Hematology", "eq-002", 2, 7.75, -0.14, "2026-03-24T08:30:00Z", "N. Al-Balushi", "LOT-2025-H-0103", [], false),
];

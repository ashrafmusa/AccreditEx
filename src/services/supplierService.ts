/**
 * Supplier Service
 * Handles all Supplier Quality Management operations with Firestore
 */

import { db } from '@/firebase/firebaseConfig';
import { handleError } from '@/services/errorHandling';
import { logger } from '@/services/logger';
import {
    NonConformance,
    RiskLevel,
    Supplier,
    SupplierAudit,
    SupplierMetrics,
    VendorScorecard
} from '@/types/supplier';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    QueryConstraint,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';

const SUPPLIERS_COLLECTION = 'suppliers';
const SUPPLIER_AUDITS_COLLECTION = 'supplierAudits';
const NON_CONFORMANCES_COLLECTION = 'nonConformances';
const CORRECTION_PLANS_COLLECTION = 'correctionPlans';

/**
 * Fetch all suppliers with optional filters
 */
export async function getSuppliers(filters?: {
    status?: string;
    riskLevel?: RiskLevel;
    search?: string;
}): Promise<Supplier[]> {
    try {
        const constraints: QueryConstraint[] = [];

        if (filters?.status) {
            constraints.push(where('status', '==', filters.status));
        }
        if (filters?.riskLevel) {
            constraints.push(where('riskLevel', '==', filters.riskLevel));
        }

        const q = query(
            collection(db, SUPPLIERS_COLLECTION),
            orderBy('updatedAt', 'desc'),
            ...constraints
        );

        const snapshot = await getDocs(q);
        let suppliers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            lastAuditDate: doc.data().lastAuditDate?.toDate(),
            nextAuditDate: doc.data().nextAuditDate?.toDate(),
        } as Supplier));

        // Apply search filter if provided
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            suppliers = suppliers.filter(
                s =>
                    s.name.toLowerCase().includes(searchLower) ||
                    s.email.toLowerCase().includes(searchLower) ||
                    s.contactPerson.toLowerCase().includes(searchLower)
            );
        }

        return suppliers;
    } catch (error) {
        const appError = handleError(error, 'Failed to fetch suppliers');
        logger.error('getSuppliers error:', appError);
        throw appError;
    }
}

/**
 * Fetch single supplier by ID
 */
export async function getSupplier(supplierId: string): Promise<Supplier | null> {
    try {
        const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastAuditDate: data.lastAuditDate?.toDate(),
            nextAuditDate: data.nextAuditDate?.toDate(),
        } as Supplier;
    } catch (error) {
        const appError = handleError(error, 'Failed to fetch supplier');
        logger.error('getSupplier error:', appError);
        throw appError;
    }
}

/**
 * Create new supplier
 */
export async function createSupplier(supplierData: Omit<Supplier, 'id'>, userId: string): Promise<Supplier> {
    try {
        const newSupplierRef = doc(collection(db, SUPPLIERS_COLLECTION));
        const now = new Date();

        const supplier: Supplier = {
            ...supplierData,
            id: newSupplierRef.id,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
        };

        await setDoc(newSupplierRef, {
            ...supplier,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            lastAuditDate: supplier.lastAuditDate ? Timestamp.fromDate(supplier.lastAuditDate) : null,
            nextAuditDate: supplier.nextAuditDate ? Timestamp.fromDate(supplier.nextAuditDate) : null,
        });

        logger.info(`Supplier created: ${supplier.id}`);
        return supplier;
    } catch (error) {
        const appError = handleError(error, 'Failed to create supplier');
        logger.error('createSupplier error:', appError);
        throw appError;
    }
}

/**
 * Update supplier
 */
export async function updateSupplier(supplier: Supplier, userId: string): Promise<void> {
    try {
        const docRef = doc(db, SUPPLIERS_COLLECTION, supplier.id);
        const now = new Date();

        await updateDoc(docRef, {
            ...supplier,
            updatedAt: Timestamp.fromDate(now),
            updatedBy: userId,
            lastAuditDate: supplier.lastAuditDate ? Timestamp.fromDate(supplier.lastAuditDate) : null,
            nextAuditDate: supplier.nextAuditDate ? Timestamp.fromDate(supplier.nextAuditDate) : null,
        });

        logger.info(`Supplier updated: ${supplier.id}`);
    } catch (error) {
        const appError = handleError(error, 'Failed to update supplier');
        logger.error('updateSupplier error:', appError);
        throw appError;
    }
}

/**
 * Update supplier scorecard
 */
export async function updateSupplierScorecard(
    supplierId: string,
    scorecard: VendorScorecard,
    userId: string
): Promise<void> {
    try {
        const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);

        // Update scorecard with new history entry
        const updatedScorecard = {
            ...scorecard,
            history: [
                ...(scorecard.history || []),
                {
                    date: new Date(),
                    overallScore: scorecard.overallScore,
                    qualityScore: scorecard.qualityScore,
                    deliveryScore: scorecard.deliveryScore,
                    responsiveness: scorecard.responsiveness,
                    complianceScore: scorecard.complianceScore,
                    evaluatedBy: userId,
                },
            ],
        };

        await updateDoc(docRef, {
            scorecard: updatedScorecard,
            updatedAt: Timestamp.fromDate(new Date()),
            updatedBy: userId,
        });

        logger.info(`Supplier scorecard updated: ${supplierId}`);
    } catch (error) {
        const appError = handleError(error, 'Failed to update scorecard');
        logger.error('updateSupplierScorecard error:', appError);
        throw appError;
    }
}

/**
 * Delete supplier
 */
export async function deleteSupplier(supplierId: string): Promise<void> {
    try {
        const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
        await deleteDoc(docRef);
        logger.info(`Supplier deleted: ${supplierId}`);
    } catch (error) {
        const appError = handleError(error, 'Failed to delete supplier');
        logger.error('deleteSupplier error:', appError);
        throw appError;
    }
}

/**
 * Create supplier audit
 */
export async function createSupplierAudit(
    supplierId: string,
    audit: Omit<SupplierAudit, 'id'>,
    userId: string
): Promise<SupplierAudit> {
    try {
        const newAuditRef = doc(collection(db, SUPPLIER_AUDITS_COLLECTION));
        const auditData: SupplierAudit = {
            ...audit,
            id: newAuditRef.id,
        };

        await setDoc(newAuditRef, {
            ...auditData,
            supplierId,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
            scheduledDate: Timestamp.fromDate(audit.scheduledDate),
            actualDate: audit.actualDate ? Timestamp.fromDate(audit.actualDate) : null,
            completionDate: audit.completionDate ? Timestamp.fromDate(audit.completionDate) : null,
            correctionDeadline: audit.correctionDeadline ? Timestamp.fromDate(audit.correctionDeadline) : null,
        });

        // Update supplier's lastAuditDate if audit is completed
        if (audit.status === 'completed') {
            const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
            await updateDoc(supplierRef, {
                lastAuditDate: Timestamp.fromDate(new Date()),
                updatedBy: userId,
            });
        }

        logger.info(`Supplier audit created: ${auditData.id}`);
        return auditData;
    } catch (error) {
        const appError = handleError(error, 'Failed to create supplier audit');
        logger.error('createSupplierAudit error:', appError);
        throw appError;
    }
}

/**
 * Get supplier audits
 */
export async function getSupplierAudits(supplierId: string): Promise<SupplierAudit[]> {
    try {
        const q = query(
            collection(db, SUPPLIER_AUDITS_COLLECTION),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                scheduledDate: data.scheduledDate?.toDate(),
                actualDate: data.actualDate?.toDate(),
                completionDate: data.completionDate?.toDate(),
                correctionDeadline: data.correctionDeadline?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as SupplierAudit;
        });
    } catch (error) {
        const appError = handleError(error, 'Failed to fetch supplier audits');
        logger.error('getSupplierAudits error:', appError);
        throw appError;
    }
}

/**
 * Create non-conformance
 */
export async function createNonConformance(
    supplierId: string,
    nonConformance: Omit<NonConformance, 'id'>,
    userId: string
): Promise<NonConformance> {
    try {
        const newNCRef = doc(collection(db, NON_CONFORMANCES_COLLECTION));
        const ncData: NonConformance = {
            ...nonConformance,
            id: newNCRef.id,
        };

        await setDoc(newNCRef, {
            ...ncData,
            supplierId,
            reportedDate: Timestamp.fromDate(nonConformance.reportedDate),
            dueDate: nonConformance.dueDate ? Timestamp.fromDate(nonConformance.dueDate) : null,
        });

        logger.info(`Non-conformance created: ${ncData.id}`);
        return ncData;
    } catch (error) {
        const appError = handleError(error, 'Failed to create non-conformance');
        logger.error('createNonConformance error:', appError);
        throw appError;
    }
}

/**
 * Calculate supplier metrics
 */
export async function getSupplierMetrics(): Promise<SupplierMetrics> {
    try {
        const suppliers = await getSuppliers();

        const metrics: SupplierMetrics = {
            totalSuppliers: suppliers.length,
            approvedCount: suppliers.filter(s => s.status === 'approved').length,
            probationCount: suppliers.filter(s => s.status === 'probation').length,
            suspendedCount: suppliers.filter(s => s.status === 'suspended').length,
            pendingAuditsCount: suppliers.filter(s => new Date(s.nextAuditDate || new Date()) < new Date()).length,
            overdueCorrectionPlans: 0, // Would calculate from correctionPlans collection
            averageRiskLevel: calculateAverageRiskLevel(suppliers),
            averageScorecard: suppliers.reduce((sum, s) => sum + s.scorecard.overallScore, 0) / suppliers.length || 0,
            suppliersWithExpiringCertifications: suppliers.filter(
                s =>
                    s.certifications &&
                    s.certifications.some(c => {
                        const daysUntilExpiry = (new Date(c.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                        return daysUntilExpiry < 90 && daysUntilExpiry > 0;
                    })
            ).length,
        };

        return metrics;
    } catch (error) {
        const appError = handleError(error, 'Failed to calculate supplier metrics');
        logger.error('getSupplierMetrics error:', appError);
        throw appError;
    }
}

/**
 * Helper to calculate average risk level
 */
function calculateAverageRiskLevel(suppliers: Supplier[]): RiskLevel {
    if (suppliers.length === 0) return 'low';

    const riskMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const averageRiskScore = suppliers.reduce((sum, s) => sum + riskMap[s.riskLevel], 0) / suppliers.length;

    if (averageRiskScore < 1.75) return 'low';
    if (averageRiskScore < 2.5) return 'medium';
    if (averageRiskScore < 3.5) return 'high';
    return 'critical';
}

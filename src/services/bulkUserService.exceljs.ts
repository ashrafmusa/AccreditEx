import { BulkUserOperation, User, UserRole } from '@/types';
import { collection, addDoc, updateDoc, doc, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import ExcelJS from 'exceljs';

const COLLECTION_NAME = 'bulk_user_operations';

export const createBulkOperation = async (
    type: BulkUserOperation['type'],
    totalUsers: number,
    createdBy: string
): Promise<string> => {
    const operation: Omit<BulkUserOperation, 'id'> = {
        type,
        status: 'pending',
        totalUsers,
        processedUsers: 0,
        failedUsers: 0,
        errors: [],
        createdBy,
        createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...operation,
        createdAtTimestamp: Timestamp.now(),
    });

    return docRef.id;
};

export const updateBulkOperation = async (
    operationId: string,
    updates: Partial<BulkUserOperation>
): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, operationId);
    await updateDoc(docRef, updates);
};

export const getBulkOperations = async (userId?: string): Promise<BulkUserOperation[]> => {
    let q = query(collection(db, COLLECTION_NAME));

    if (userId) {
        q = query(collection(db, COLLECTION_NAME), where('createdBy', '==', userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as BulkUserOperation[];
};

/**
 * Export users to Excel using ExcelJS (secure alternative to xlsx)
 * @param users - Array of users to export
 * @returns Blob containing the Excel file
 */
export const exportUsersToExcel = async (users: User[]): Promise<Blob> => {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Define columns with headers and data keys
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 20 },
        { header: 'Job Title', key: 'jobTitle', width: 25 },
        { header: 'Hire Date', key: 'hireDate', width: 15 },
        { header: 'Department ID', key: 'departmentId', width: 20 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // Brand color
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add user data
    users.forEach(user => {
        worksheet.addRow({
            name: user.name,
            email: user.email,
            role: user.role,
            jobTitle: user.jobTitle || '',
            hireDate: user.hireDate || '',
            departmentId: user.departmentId || '',
        });
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    // Generate Excel file as buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};

/**
 * Import users from Excel file using ExcelJS (secure alternative to xlsx)
 * @param file - Excel file to import
 * @returns Promise resolving to array of partial user objects
 */
export const importUsersFromExcel = async (file: File): Promise<Partial<User>[]> => {
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Create workbook and load the Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        // Get the first worksheet
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            throw new Error('No worksheet found in Excel file');
        }

        const users: Partial<User>[] = [];

        // Iterate through rows (skip header row)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const user: Partial<User> = {
                name: row.getCell(1).value as string || '',
                email: row.getCell(2).value as string || '',
                role: (row.getCell(3).value as string || 'TeamMember') as UserRole,
                jobTitle: row.getCell(4).value as string || '',
                hireDate: row.getCell(5).value as string || '',
                departmentId: row.getCell(6).value as string || undefined,
            };

            // Only add if name and email are present
            if (user.name && user.email) {
                users.push(user);
            }
        });

        return users;
    } catch (error) {
        console.error('Excel import error:', error);
        throw new Error(`Failed to import Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Validate user data
 * @param user - Partial user object to validate
 * @returns Object with validation result and errors
 */
export const validateUserData = (user: Partial<User>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!user.name || user.name.trim().length === 0) {
        errors.push('Name is required');
    }

    if (!user.email || user.email.trim().length === 0) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push('Invalid email format');
    }

    if (!user.role) {
        errors.push('Role is required');
    } else if (!['Admin', 'ProjectLead', 'TeamMember', 'Auditor', 'Viewer'].includes(user.role)) {
        errors.push('Invalid role');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Get user import template with sample data
 * @returns Array of sample user objects
 */
export const getUserImportTemplate = (): Partial<User>[] => {
    return [
        {
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'TeamMember' as UserRole,
            jobTitle: 'Quality Manager',
            hireDate: '2024-01-15',
            departmentId: 'dept-001',
        },
        {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'ProjectLead' as UserRole,
            jobTitle: 'Senior Auditor',
            hireDate: '2023-06-20',
            departmentId: 'dept-002',
        },
        {
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            role: 'Auditor' as UserRole,
            jobTitle: 'Compliance Specialist',
            hireDate: '2024-03-10',
            departmentId: 'dept-001',
        },
    ];
};

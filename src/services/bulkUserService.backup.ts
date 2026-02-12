import { BulkUserOperation, User, UserRole } from '@/types';
import { collection, addDoc, updateDoc, doc, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import * as XLSX from 'xlsx';

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

// Export users to Excel
export const exportUsersToExcel = (users: User[]): Blob => {
    const data = users.map(user => ({
        Name: user.name,
        Email: user.email,
        Role: user.role,
        'Job Title': user.jobTitle || '',
        'Hire Date': user.hireDate || '',
        'Department ID': user.departmentId || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Import users from Excel
export const importUsersFromExcel = async (file: File): Promise<Partial<User>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const users: Partial<User>[] = jsonData.map((row: any) => ({
                    name: row.Name || row.name,
                    email: row.Email || row.email,
                    role: (row.Role || row.role || 'TeamMember') as UserRole,
                    jobTitle: row['Job Title'] || row.jobTitle || '',
                    hireDate: row['Hire Date'] || row.hireDate || '',
                    departmentId: row['Department ID'] || row.departmentId || undefined,
                }));

                resolve(users);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

// Validate user data
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
    } else if (!Object.values(UserRole).includes(user.role as UserRole)) {
        errors.push('Invalid role');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

// Get user import template
export const getUserImportTemplate = (): Blob => {
    const templateData = [
        {
            Name: 'John Doe',
            Email: 'john.doe@example.com',
            Role: 'TeamMember',
            'Job Title': 'Quality Manager',
            'Hire Date': '2024-01-15',
            'Department ID': 'dept-001',
        },
        {
            Name: 'Jane Smith',
            Email: 'jane.smith@example.com',
            Role: 'ProjectLead',
            'Job Title': 'Senior Auditor',
            'Hire Date': '2023-06-20',
            'Department ID': 'dept-002',
        },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users Template');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

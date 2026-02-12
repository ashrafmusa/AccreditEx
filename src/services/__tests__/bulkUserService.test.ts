import ExcelJS from 'exceljs';
import {
    exportUsersToExcel,
    importUsersFromExcel,
    validateUserData,
    getUserImportTemplate,
    createBulkOperation,
    updateBulkOperation,
    getBulkOperations,
} from '../bulkUserService';
import { User, UserRole } from '@/types';
import { addDoc, updateDoc, getDocs, doc, Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    },
}));

jest.mock('../../firebase/firebaseConfig', () => ({
    db: {},
}));

// Helper function to create a test file from a buffer with arrayBuffer support
function createTestFile(buffer: Buffer | ArrayBuffer, filename: string, mimeType: string): File {
    // Convert Buffer to ArrayBuffer if needed
    const arrayBuffer = buffer instanceof Buffer
        ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
        : buffer;

    const blob = new Blob([arrayBuffer], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    // Add arrayBuffer method for Node.js environment
    (file as any).arrayBuffer = async () => arrayBuffer;

    return file;
}

describe('bulkUserService', () => {
    describe('exportUsersToExcel', () => {
        const sampleUsers: User[] = [
            {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'Admin' as UserRole,
                jobTitle: 'Quality Manager',
                hireDate: '2024-01-15',
                departmentId: 'dept-001',
                createdAt: '2024-01-01',
            },
            {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'TeamMember' as UserRole,
                jobTitle: 'Specialist',
                hireDate: '2024-02-20',
                departmentId: 'dept-002',
                createdAt: '2024-01-01',
            },
        ];

        test('should export users to Excel blob', async () => {
            const blob = await exportUsersToExcel(sampleUsers);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            expect(blob.size).toBeGreaterThan(0);
        });

        test('should create Excel with correct columns', async () => {
            const blob = await exportUsersToExcel(sampleUsers);
            const arrayBuffer = await blob.arrayBuffer();

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            expect(worksheet).toBeDefined();

            // Check header row
            const headerRow = worksheet.getRow(1);
            expect(headerRow.getCell(1).value).toBe('Name');
            expect(headerRow.getCell(2).value).toBe('Email');
            expect(headerRow.getCell(3).value).toBe('Role');
            expect(headerRow.getCell(4).value).toBe('Job Title');
            expect(headerRow.getCell(5).value).toBe('Hire Date');
            expect(headerRow.getCell(6).value).toBe('Department ID');
        });

        test('should include all user data in Excel', async () => {
            const blob = await exportUsersToExcel(sampleUsers);
            const arrayBuffer = await blob.arrayBuffer();

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];

            // Check first user data (row 2)
            const row1 = worksheet.getRow(2);
            expect(row1.getCell(1).value).toBe('John Doe');
            expect(row1.getCell(2).value).toBe('john@example.com');
            expect(row1.getCell(3).value).toBe('Admin');

            // Check second user data (row 3)
            const row2 = worksheet.getRow(3);
            expect(row2.getCell(1).value).toBe('Jane Smith');
            expect(row2.getCell(2).value).toBe('jane@example.com');
            expect(row2.getCell(3).value).toBe('TeamMember');
        });

        test('should apply professional styling to header', async () => {
            const blob = await exportUsersToExcel(sampleUsers);
            const arrayBuffer = await blob.arrayBuffer();

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            const headerRow = worksheet.getRow(1);

            // Check header styling
            expect(headerRow.font?.bold).toBe(true);
            expect(headerRow.font?.color?.argb).toBe('FFFFFFFF');
            expect(headerRow.fill?.type).toBe('pattern');
        });

        test('should handle empty user array', async () => {
            const blob = await exportUsersToExcel([]);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.size).toBeGreaterThan(0); // Still has headers

            const arrayBuffer = await blob.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            expect(worksheet.rowCount).toBe(1); // Only header row
        });

        test('should handle large number of users', async () => {
            const largeUserArray: User[] = Array.from({ length: 1000 }, (_, i) => ({
                id: `user-${i}`,
                name: `User ${i}`,
                email: `user${i}@example.com`,
                role: 'TeamMember' as UserRole,
                jobTitle: 'Specialist',
                hireDate: '2024-01-01',
                departmentId: 'dept-001',
                createdAt: '2024-01-01',
            }));

            const blob = await exportUsersToExcel(largeUserArray);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.size).toBeGreaterThan(0);

            const arrayBuffer = await blob.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            expect(worksheet.rowCount).toBe(1001); // 1000 users + 1 header
        });

        test('should handle users with missing optional fields', async () => {
            const usersWithMissingFields: User[] = [
                {
                    id: '1',
                    name: 'Minimal User',
                    email: 'minimal@example.com',
                    role: 'Viewer' as UserRole,
                    createdAt: '2024-01-01',
                },
            ];

            const blob = await exportUsersToExcel(usersWithMissingFields);
            const arrayBuffer = await blob.arrayBuffer();

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            const row = worksheet.getRow(2);

            expect(row.getCell(1).value).toBe('Minimal User');
            expect(row.getCell(4).value).toBe(''); // jobTitle should be empty
            expect(row.getCell(5).value).toBe(''); // hireDate should be empty
        });
    });

    describe('importUsersFromExcel', () => {
        test('should import users from valid Excel file', async () => {
            // Create a sample Excel file
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'Name', key: 'name' },
                { header: 'Email', key: 'email' },
                { header: 'Role', key: 'role' },
                { header: 'Job Title', key: 'jobTitle' },
                { header: 'Hire Date', key: 'hireDate' },
                { header: 'Department ID', key: 'departmentId' },
            ];

            worksheet.addRow({
                name: 'Test User',
                email: 'test@example.com',
                role: 'Admin',
                jobTitle: 'Manager',
                hireDate: '2024-01-01',
                departmentId: 'dept-001',
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const file = createTestFile(
                Buffer.from(buffer),
                'test.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            const users = await importUsersFromExcel(file);

            expect(users).toHaveLength(1);
            expect(users[0]).toMatchObject({
                name: 'Test User',
                email: 'test@example.com',
                role: 'Admin',
                jobTitle: 'Manager',
            });
        });

        test('should import multiple users from Excel', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'Name', key: 'name' },
                { header: 'Email', key: 'email' },
                { header: 'Role', key: 'role' },
                { header: 'Job Title', key: 'jobTitle' },
                { header: 'Hire Date', key: 'hireDate' },
                { header: 'Department ID', key: 'departmentId' },
            ];

            worksheet.addRow({
                name: 'User 1',
                email: 'user1@example.com',
                role: 'Admin',
                jobTitle: 'Manager',
                hireDate: '2024-01-01',
                departmentId: 'dept-001',
            });

            worksheet.addRow({
                name: 'User 2',
                email: 'user2@example.com',
                role: 'TeamMember',
                jobTitle: 'Specialist',
                hireDate: '2024-02-01',
                departmentId: 'dept-002',
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const file = createTestFile(
                Buffer.from(buffer),
                'test.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            const users = await importUsersFromExcel(file);

            expect(users).toHaveLength(2);
            expect(users[0].name).toBe('User 1');
            expect(users[1].name).toBe('User 2');
        });

        test('should skip rows with missing name or email', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'Name', key: 'name' },
                { header: 'Email', key: 'email' },
                { header: 'Role', key: 'role' },
                { header: 'Job Title', key: 'jobTitle' },
                { header: 'Hire Date', key: 'hireDate' },
                { header: 'Department ID', key: 'departmentId' },
            ];

            worksheet.addRow({
                name: 'Valid User',
                email: 'valid@example.com',
                role: 'TeamMember',
            });

            worksheet.addRow({
                name: '', // Missing name
                email: 'nousername@example.com',
                role: 'TeamMember',
            });

            worksheet.addRow({
                name: 'No Email',
                email: '', // Missing email
                role: 'TeamMember',
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const file = createTestFile(
                Buffer.from(buffer),
                'test.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            const users = await importUsersFromExcel(file);

            expect(users).toHaveLength(1); // Only the valid user
            expect(users[0].name).toBe('Valid User');
        });

        test('should handle empty Excel file', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'Name', key: 'name' },
                { header: 'Email', key: 'email' },
                { header: 'Role', key: 'role' },
            ];

            const buffer = await workbook.xlsx.writeBuffer();
            const file = createTestFile(
                Buffer.from(buffer),
                'test.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            const users = await importUsersFromExcel(file);

            expect(users).toHaveLength(0);
        });

        test('should throw error for invalid Excel file', async () => {
            const file = createTestFile(
                Buffer.from('invalid content'),
                'test.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            await expect(importUsersFromExcel(file)).rejects.toThrow('Failed to import Excel file');
        });

        test('should default role to TeamMember if not provided', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'Name', key: 'name' },
                { header: 'Email', key: 'email' },
                { header: 'Role', key: 'role' },
            ];

            worksheet.addRow({
                name: 'No Role User',
                email: 'norole@example.com',
                role: '', // Empty role
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const file = createTestFile(
                Buffer.from(buffer),
                'test.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            const users = await importUsersFromExcel(file);

            expect(users[0].role).toBe('TeamMember');
        });
    });

    describe('validateUserData', () => {
        test('should validate correct user data', () => {
            const user = {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'Admin' as UserRole,
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject user without name', () => {
            const user = {
                name: '',
                email: 'john@example.com',
                role: 'Admin' as UserRole,
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Name is required');
        });

        test('should reject user without email', () => {
            const user = {
                name: 'John Doe',
                email: '',
                role: 'Admin' as UserRole,
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Email is required');
        });

        test('should reject user with invalid email format', () => {
            const user = {
                name: 'John Doe',
                email: 'invalid-email',
                role: 'Admin' as UserRole,
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid email format');
        });

        test('should reject user without role', () => {
            const user = {
                name: 'John Doe',
                email: 'john@example.com',
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Role is required');
        });

        test('should reject user with invalid role', () => {
            const user = {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'InvalidRole' as UserRole,
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid role');
        });

        test('should accept all valid roles', () => {
            const validRoles: UserRole[] = ['Admin', 'ProjectLead', 'TeamMember', 'Auditor', 'Viewer'];

            validRoles.forEach(role => {
                const user = {
                    name: 'John Doe',
                    email: 'john@example.com',
                    role,
                };

                const result = validateUserData(user);
                expect(result.valid).toBe(true);
            });
        });

        test('should collect multiple validation errors', () => {
            const user = {
                name: '',
                email: 'invalid-email',
            };

            const result = validateUserData(user);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe('getUserImportTemplate', () => {
        test('should return template with sample users', () => {
            const template = getUserImportTemplate();

            expect(template).toBeInstanceOf(Array);
            expect(template.length).toBeGreaterThan(0);
        });

        test('should have users with all required fields', () => {
            const template = getUserImportTemplate();

            template.forEach(user => {
                expect(user.name).toBeDefined();
                expect(user.email).toBeDefined();
                expect(user.role).toBeDefined();
            });
        });

        test('should have valid email formats in template', () => {
            const template = getUserImportTemplate();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            template.forEach(user => {
                expect(user.email).toMatch(emailRegex);
            });
        });

        test('should have valid roles in template', () => {
            const template = getUserImportTemplate();
            const validRoles = ['Admin', 'ProjectLead', 'TeamMember', 'Auditor', 'Viewer'];

            template.forEach(user => {
                expect(validRoles).toContain(user.role);
            });
        });

        test('should include optional fields in template', () => {
            const template = getUserImportTemplate();

            template.forEach(user => {
                expect(user).toHaveProperty('jobTitle');
                expect(user).toHaveProperty('hireDate');
                expect(user).toHaveProperty('departmentId');
            });
        });
    });

    describe('createBulkOperation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should create bulk operation and return ID', async () => {
            const mockDocRef = { id: 'op-123' };
            (addDoc as jest.Mock).mockResolvedValue(mockDocRef as any);

            const operationId = await createBulkOperation('import', 100, 'user-123');

            expect(operationId).toBe('op-123');
            expect(addDoc).toHaveBeenCalledTimes(1);
        });

        test('should create operation with correct initial data', async () => {
            const mockDocRef = { id: 'op-123' };
            (addDoc as jest.Mock).mockResolvedValue(mockDocRef as any);

            await createBulkOperation('export', 50, 'user-456');

            const callArgs = (addDoc as jest.Mock).mock.calls[0];
            const operationData = callArgs[1];

            expect(operationData).toMatchObject({
                type: 'export',
                status: 'pending',
                totalUsers: 50,
                processedUsers: 0,
                failedUsers: 0,
                errors: [],
                createdBy: 'user-456',
            });
            expect(operationData.createdAt).toBeDefined();
        });
    });

    describe('updateBulkOperation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should update bulk operation', async () => {
            (updateDoc as jest.Mock).mockResolvedValue(undefined);

            await updateBulkOperation('op-123', {
                status: 'completed',
                processedUsers: 100,
            });

            expect(updateDoc).toHaveBeenCalledTimes(1);
        });

        test('should call updateDoc with correct parameters', async () => {
            (updateDoc as jest.Mock).mockResolvedValue(undefined);
            (doc as jest.Mock).mockReturnValue('mock-doc-ref');

            const updates = {
                status: 'failed' as const,
                processedUsers: 50,
                failedUsers: 10,
            };

            await updateBulkOperation('op-456', updates);

            expect(updateDoc).toHaveBeenCalledTimes(1);
            expect(updateDoc).toHaveBeenCalledWith(
                'mock-doc-ref',
                updates
            );
        });
    });

    describe('getBulkOperations', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should get all bulk operations when no userId provided', async () => {
            const mockDocs = [
                { id: 'op-1', data: () => ({ type: 'import', status: 'completed' }) },
                { id: 'op-2', data: () => ({ type: 'export', status: 'pending' }) },
            ];

            (getDocs as jest.Mock).mockResolvedValue({
                docs: mockDocs,
            } as any);

            const operations = await getBulkOperations();

            expect(operations).toHaveLength(2);
            expect(operations[0].id).toBe('op-1');
            expect(operations[1].id).toBe('op-2');
        });

        test('should filter operations by userId when provided', async () => {
            const mockDocs = [
                { id: 'op-1', data: () => ({ type: 'import', createdBy: 'user-123' }) },
            ];

            (getDocs as jest.Mock).mockResolvedValue({
                docs: mockDocs,
            } as any);

            const operations = await getBulkOperations('user-123');

            expect(operations).toHaveLength(1);
            expect(getDocs).toHaveBeenCalledTimes(1);
        });

        test('should return empty array when no operations found', async () => {
            (getDocs as jest.Mock).mockResolvedValue({
                docs: [],
            } as any);

            const operations = await getBulkOperations();

            expect(operations).toHaveLength(0);
        });
    });
});

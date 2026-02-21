// This is a mock backend service using localStorage to simulate a database.
// In a real application, this would make API calls to a server.

import {
    Project, User, AppDocument, Standard, AccreditationProgram, Department,
    TrainingProgram, CertificateData, UserTrainingStatus, Competency, Risk,
    IncidentReport, AuditPlan, Audit, CustomCalendarEvent, AppSettings, Notification,
    Comment, DesignControlItem, CAPAReport, MockSurvey, MockSurveyResult, ComplianceStatus,
    ProjectStatus, AIQualityBriefing, PDCACycle
} from '@/types';
import { initialData } from './initialData';
import { aiService } from '@/services/ai';
import { storageService } from '@/services/storageService';
import { cloudinaryService } from '@/services/cloudinaryService';

class BackendService {
    private isInitialized = false;

    private _getAllData(): typeof initialData {
        const data = localStorage.getItem('accreditex-data');
        return data ? JSON.parse(data) : initialData;
    }

    private _saveAllData(data: typeof initialData) {
        localStorage.setItem('accreditex-data', JSON.stringify(data));
    }

    async initialize() {
        if (!localStorage.getItem('accreditex-data')) {
            console.log("Seeding initial data into localStorage...");
            this._saveAllData(initialData);
        }
        this.isInitialized = true;
    }

    // A utility to get all data at once for stores
    async getAllData() {
        return this._getAllData();
    }

    // Notifications
    async getNotifications(userId: string): Promise<Notification[]> {
        const data = this._getAllData();
        return data.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
        const data = this._getAllData();
        const notification = data.notifications.find(n => n.id === notificationId && n.userId === userId);
        if (notification) {
            notification.read = true;
            this._saveAllData(data);
        }
    }

    async markAllNotificationsAsRead(userId: string): Promise<void> {
        const data = this._getAllData();
        data.notifications.forEach(n => {
            if (n.userId === userId) {
                n.read = true;
            }
        });
        this._saveAllData(data);
    }

    // Projects
    async getProjects(): Promise<Project[]> {
        const data = this._getAllData();
        return data.projects;
    }

    async createProject(projectData: any): Promise<Project> {
        const data = this._getAllData();
        const lead = data.users.find(u => u.id === projectData.leadId);
        if (!lead) throw new Error("Project lead not found");

        const standardsForProgram = data.standards.filter(s => s.programId === projectData.programId);

        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: projectData.name,
            description: projectData.description,
            programId: projectData.programId,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            projectLead: lead,
            status: ProjectStatus.NotStarted,
            progress: 0,
            checklist: standardsForProgram.map(s => ({
                id: `item-${Date.now()}-${s.standardId}`,
                item: s.description,
                standardId: s.standardId,
                status: ComplianceStatus.NonCompliant,
                assignedTo: '',
                dueDate: '',
                actionPlan: '',
                notes: '',
                evidenceFiles: [],
                comments: [],
            })),
            activityLog: [{ id: `log-${Date.now()}`, timestamp: new Date().toISOString(), user: lead.name, action: { en: 'Project Created', ar: 'تم إنشاء المشروع' } }],
            mockSurveys: [],
            capaReports: [],
            designControls: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
        };
        data.projects.push(newProject);
        this._saveAllData(data);
        return newProject;
    }

    async updateProject(updatedProject: Project): Promise<Project> {
        const data = this._getAllData();
        const index = data.projects.findIndex(p => p.id === updatedProject.id);
        if (index > -1) {
            data.projects[index] = updatedProject;
            this._saveAllData(data);
            return updatedProject;
        }
        throw new Error("Project not found");
    }

    async deleteProject(projectId: string): Promise<void> {
        let data = this._getAllData();
        data.projects = data.projects.filter(p => p.id !== projectId);
        this._saveAllData(data);
    }

    async finalizeProject(projectId: string, userId: string): Promise<Project> {
        const data = this._getAllData();
        const user = data.users.find(u => u.id === userId);
        const project = data.projects.find(p => p.id === projectId);

        if (!user) {
            throw new Error("User not found");
        }
        if (project) {
            project.status = ProjectStatus.Finalized;
            project.finalizedBy = user.name;
            project.finalizationDate = new Date().toISOString();
            this._saveAllData(data);
            return project;
        }
        throw new Error("Project not found");
    }

    async updateDesignControls(projectId: string, designControls: DesignControlItem[]): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            project.designControls = designControls;
            this._saveAllData(data);
            return project;
        }
        throw new Error("Project not found");
    }

    async generateProjectReport(project: Project, reportType: string, userName: string, fileUrl?: string): Promise<AppDocument> {
        // Mock report generation
        const content = `<h1>${reportType === 'complianceSummary' ? 'Compliance Summary' : 'Report'} for ${project.name}</h1><p>Generated on ${new Date().toLocaleDateString()}.</p>`;
        const newReport: AppDocument = {
            id: `doc-report-${Date.now()}`,
            name: { en: `${project.name} - Compliance Summary`, ar: `ملخص الامتثال - ${project.name}` },
            type: 'Report',
            isControlled: false, // Or true if it should be controlled
            status: 'Approved',
            content: { en: content, ar: content },
            fileUrl, // Add fileUrl if provided
            currentVersion: 1,
            versionHistory: [{ version: 1, date: new Date().toISOString(), uploadedBy: userName, content: { en: content, ar: content } }],
            uploadedAt: new Date().toISOString(),
        };
        return newReport;
    }

    async addComment(projectId: string, checklistItemId: string, comment: Omit<Comment, 'id'>): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            const item = project.checklist.find(i => i.id === checklistItemId);
            if (item) {
                if (!item.comments) item.comments = [];
                item.comments.push({ ...comment, id: `comment-${Date.now()}` });
                this._saveAllData(data);
                return project;
            }
        }
        throw new Error("Project or item not found");
    }

    async addCapaReport(projectId: string, capaData: Omit<CAPAReport, 'id'>): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            if (!project.capaReports) project.capaReports = [];
            project.capaReports.push({ ...capaData, id: `capa-${Date.now()}` });
            this._saveAllData(data);
            return project;
        }
        throw new Error("Project not found");
    }

    async uploadEvidenceDocument(projectId: string, checklistItemId: string, docData: any, userName: string): Promise<{ updatedProject: Project, newDocument: AppDocument }> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);

        // 1. Upload file if present
        let fileUrl = docData.fileUrl;
        if (docData.uploadedFile) {
            fileUrl = await cloudinaryService.uploadFile(
                docData.uploadedFile,
                `doc-evidence-${Date.now()}`,
                (progress) => console.log('Upload progress:', progress)
            );
        }

        // 2. Create new document
        const newDoc: AppDocument = {
            id: `doc-evidence-${Date.now()}`,
            name: docData.name,
            type: 'Evidence',
            isControlled: false,
            status: 'Approved',
            content: { en: `File: ${docData.name.en}`, ar: `ملف: ${docData.name.ar}` },
            fileUrl,
            currentVersion: 1,
            versionHistory: [],
            uploadedAt: new Date().toISOString(),
        };
        data.documents.push(newDoc);

        // 3. Link to checklist item
        if (project) {
            const item = project.checklist.find(i => i.id === checklistItemId);
            if (item) {
                if (!item.evidenceFiles) item.evidenceFiles = [];
                item.evidenceFiles.push(newDoc.id);
                this._saveAllData(data);
                return { updatedProject: project, newDocument: newDoc };
            }
        }
        throw new Error("Project or item not found");
    }

    async uploadDocumentFile(file: File, path: string = 'documents'): Promise<string> {
        return await cloudinaryService.uploadFile(file, path);
    }

    async deleteDocumentFile(fileUrl: string): Promise<void> {
        if (fileUrl.includes('cloudinary.com')) {
            console.info('[Cloudinary] File deletion requires backend API — skipping.');
            return;
        }
        return await storageService.deleteDocument(fileUrl);
    }

    async startMockSurvey(projectId: string, surveyorId: string): Promise<{ updatedProject: Project, newSurvey: MockSurvey }> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            const newSurvey: MockSurvey = {
                id: `survey-${Date.now()}`,
                date: new Date().toISOString(),
                surveyorId,
                status: ProjectStatus.InProgress,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                results: project.checklist.map((item, idx) => ({
                    id: `result-${Date.now()}-${idx}`,
                    itemId: item.id,
                    checklistItemId: item.id,
                    result: 'Not Applicable' as const,
                    notes: ''
                }))
            };
            if (!project.mockSurveys) project.mockSurveys = [];
            project.mockSurveys.push(newSurvey);
            this._saveAllData(data);
            return { updatedProject: project, newSurvey };
        }
        throw new Error("Project not found");
    }

    async updateMockSurvey(projectId: string, survey: MockSurvey): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            const surveyIndex = (project.mockSurveys || []).findIndex(s => s.id === survey.id);
            if (surveyIndex > -1 && project.mockSurveys) {
                project.mockSurveys[surveyIndex] = survey;
                this._saveAllData(data);
                return project;
            }
        }
        throw new Error("Project or Survey not found");
    }

    async applySurveyFindingsToProject(projectId: string, surveyId: string, userName: string): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        const survey = project?.mockSurveys?.find(s => s.id === surveyId);
        if (project && survey) {
            survey.results.forEach(result => {
                if (result.result === 'Fail') {
                    const item = project.checklist.find(c => c.id === result.checklistItemId);
                    if (item && item.status !== ComplianceStatus.NonCompliant) {
                        item.status = ComplianceStatus.NonCompliant;
                        item.notes += `\n[From Survey ${new Date(survey.date).toLocaleDateString()}]: ${result.notes}`;
                    }
                }
            });
            if (!project.activityLog) project.activityLog = [];
            project.activityLog.push({ id: `log-${Date.now()}`, timestamp: new Date().toISOString(), user: userName, action: { en: 'Applied survey findings', ar: 'تم تطبيق نتائج الجولة التفقدية' } });
            this._saveAllData(data);
            return project;
        }
        throw new Error("Project or Survey not found");
    }

    async updateCapa(projectId: string, capa: CAPAReport): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            const capaIndex = (project.capaReports || []).findIndex(c => c.id === capa.id);
            if (capaIndex > -1 && project.capaReports) {
                project.capaReports[capaIndex] = capa;
                this._saveAllData(data);
                return project;
            }
        }
        throw new Error("Project or CAPA not found");
    }

    async createPDCACycle(projectId: string, cycleData: Omit<PDCACycle, 'id'>, userId: string): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            if (!project.pdcaCycles) project.pdcaCycles = [];
            const newCycle: PDCACycle = {
                ...cycleData,
                id: `pdca-${Date.now()}`,
            };
            project.pdcaCycles.push(newCycle);
            this._saveAllData(data);
            return project;
        }
        throw new Error("Project not found");
    }

    async updatePDCACycle(projectId: string, cycleId: string, cycle: PDCACycle): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (project && project.pdcaCycles) {
            const index = project.pdcaCycles.findIndex(c => c.id === cycleId);
            if (index > -1) {
                project.pdcaCycles[index] = cycle;
                this._saveAllData(data);
                return project;
            }
        }
        throw new Error("Project or PDCA Cycle not found");
    }

    // Users
    async getUsers(): Promise<User[]> {
        return this._getAllData().users;
    }

    async getUserById(userId: string): Promise<User | null> {
        const users = this._getAllData().users;
        return users.find(u => u.id === userId) || null;
    }

    async addUser(userData: Omit<User, 'id'>): Promise<User> {
        const data = this._getAllData();
        const newUser: User = { id: `user-${Date.now()}`, ...userData };
        data.users.push(newUser);
        this._saveAllData(data);
        return newUser;
    }

    // Alias for addUser to maintain test compatibility
    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        return this.addUser(userData);
    }

    async updateUser(updatedUser: User): Promise<User> {
        const data = this._getAllData();
        const index = data.users.findIndex(u => u.id === updatedUser.id);
        if (index > -1) {
            data.users[index] = updatedUser;
            this._saveAllData(data);
            return updatedUser;
        }
        throw new Error("User not found");
    }

    async deleteUser(userId: string): Promise<void> {
        const data = this._getAllData();
        data.users = data.users.filter(u => u.id !== userId);
        this._saveAllData(data);
    }

    // Projects helper methods
    async updateProjectProgress(projectId: string, progress: number): Promise<Project> {
        const data = this._getAllData();
        const project = data.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error("Project not found");
        }
        project.progress = Math.max(0, Math.min(100, progress)); // Clamp to 0-100
        this._saveAllData(data);
        return project;
    }

    // AI Service passthrough
    async generateQualityBriefing(...args: Parameters<typeof aiService.generateQualityBriefing>): Promise<AIQualityBriefing> {
        return aiService.generateQualityBriefing(...args);
    }

    // Data Management
    exportAllData(): string {
        return JSON.stringify(this._getAllData(), null, 2);
    }

    async importAllData(jsonString: string): Promise<void> {
        const data = JSON.parse(jsonString);
        // Basic validation
        if (data.projects && data.users && data.appSettings) {
            this._saveAllData(data);
        } else {
            throw new Error("Invalid data format");
        }
    }

    async resetApplication(): Promise<void> {
        localStorage.removeItem('accreditex-data');
        await this.initialize();
    }
}

// Export both the class (for testing) and the singleton instance (for app use)
export { BackendService };
export const backendService = new BackendService();

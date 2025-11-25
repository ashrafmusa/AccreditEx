import projects from '@/data/projects.json';
import users from '@/data/users.json';
import documents from '@/data/documents.json';
import standards from '@/data/standards.json';
import accreditationPrograms from '@/data/programs.json';
import departments from '@/data/departments.json';
import trainingPrograms from '@/data/trainings.json';
import settings from '@/data/settings.json';
import competencies from '@/data/competencies.json';
import risks from '@/data/risks.json';
import { Project, User, AppDocument, Standard, AccreditationProgram, Department, TrainingProgram, AppSettings, Competency, Risk, IncidentReport, AuditPlan, Audit, CustomCalendarEvent, Notification, CertificateData, UserTrainingStatus } from '@/types';

interface InitialData {
    projects: Project[];
    users: User[];
    documents: AppDocument[];
    standards: Standard[];
    accreditationPrograms: AccreditationProgram[];
    departments: Department[];
    trainingPrograms: TrainingProgram[];
    appSettings: AppSettings;
    competencies: Competency[];
    risks: Risk[];
    incidentReports: IncidentReport[];
    auditPlans: AuditPlan[];
    audits: Audit[];
    customEvents: CustomCalendarEvent[];
    notifications: Notification[];
    certificates: CertificateData[];
    userTrainingStatuses: { [userId: string]: UserTrainingStatus };
}

export const initialData: InitialData = {
    projects: projects as Project[],
    users: users as User[],
    documents: documents as AppDocument[],
    standards: standards as Standard[],
    accreditationPrograms: accreditationPrograms as AccreditationProgram[],
    departments: departments as Department[],
    trainingPrograms: trainingPrograms as TrainingProgram[],
    appSettings: settings as AppSettings,
    competencies: competencies as Competency[],
    risks: risks as Risk[],
    // Empty arrays for data types not present in JSON files
    incidentReports: [],
    auditPlans: [],
    audits: [],
    customEvents: [],
    notifications: [],
    certificates: [],
    userTrainingStatuses: {},
};

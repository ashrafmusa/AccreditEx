import React from 'react';
import { NavigationState } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { 
    ChartPieIcon, ChartBarSquareIcon, LightBulbIcon, CalendarDaysIcon, FolderIcon, DocumentTextIcon, 
    ClipboardDocumentCheckIcon, ExclamationTriangleIcon, ClipboardDocumentSearchIcon, CircleStackIcon, 
    BuildingOffice2Icon, AcademicCapIcon, ShieldCheckIcon, Cog6ToothIcon, UsersIcon, GlobeAltIcon, IdentificationIcon
} from '@/components/icons';

interface HeaderTitleProps {
    navigation: NavigationState;
}

const viewToIconMap: Record<string, React.FC<any>> = {
    dashboard: ChartPieIcon,
    analytics: ChartBarSquareIcon,
    qualityInsights: LightBulbIcon,
    calendar: CalendarDaysIcon,
    projects: FolderIcon,
    projectDetail: FolderIcon,
    createProject: FolderIcon,
    editProject: FolderIcon,
    documentControl: DocumentTextIcon,
    myTasks: ClipboardDocumentCheckIcon,
    risk: ExclamationTriangleIcon,
    auditHub: ClipboardDocumentSearchIcon,
    dataHub: CircleStackIcon,
    departments: BuildingOffice2Icon,
    departmentDetail: BuildingOffice2Icon,
    trainingHub: AcademicCapIcon,
    trainingDetail: AcademicCapIcon,
    certificate: AcademicCapIcon,
    standards: ShieldCheckIcon,
    mockSurvey: ClipboardDocumentSearchIcon,
    surveyReport: ClipboardDocumentSearchIcon,
    settings: Cog6ToothIcon,
    userProfile: UsersIcon,
};

const HeaderTitle: React.FC<HeaderTitleProps> = ({ navigation }) => {
    const { t } = useTranslation();

    const getTitleAndIcon = () => {
        let viewKey = navigation.view;
        let titleText = '';

        switch (navigation.view) {
          case 'dashboard': titleText = t('dashboardOverview'); break;
          case 'projects': titleText = t('accreditationProjects'); break;
          case 'projectDetail': titleText = t('projectDetails'); break;
          case 'createProject': titleText = t('createNewProject'); break;
          case 'editProject': titleText = t('editProject'); break;
          case 'standards': titleText = t('programStandards'); break;
          case 'myTasks': titleText = t('myTasks'); break;
          case 'departments': titleText = t('departmentsHub'); break;
          case 'departmentDetail': titleText = t('departmentDetails'); break;
          case 'settings':
            switch (navigation.section) {
              case 'users': titleText = t('userManagement'); viewKey = 'users'; break;
              case 'accreditationHub': titleText = t('accreditationHubTitle'); viewKey = 'accreditationHub'; break;
              case 'security': titleText = t('security'); break;
              case 'general': titleText = t('general'); break;
              case 'profile': titleText = t('profile'); break;
              case 'competencies': titleText = t('competencies'); viewKey = 'competencies'; break;
              case 'data': titleText = t('dataManagement'); break;
              case 'about': titleText = t('about'); break;
              default: titleText = t('settings');
            }
            break;
          case 'userProfile': titleText = t('userProfile'); break;
          case 'trainingHub': titleText = t('trainingHubTitle'); break;
          case 'trainingDetail': titleText = t('trainingDetailTitle'); break;
          case 'certificate': titleText = t('certificateTitle'); break;
          case 'mockSurvey': titleText = t('mockSurvey'); break;
          case 'surveyReport': titleText = t('surveyReport'); break;
          case 'analytics': titleText = t('analyticsHub'); break;
          case 'calendar': titleText = t('complianceCalendar'); break;
          case 'risk': titleText = t('riskHubTitle'); break;
          case 'auditHub': titleText = t('auditHub'); break;
          case 'documentControl': titleText = t('documentControl'); break;
          case 'qualityInsights': titleText = t('qualityInsightsHub'); break;
          case 'dataHub': titleText = t('dataHub'); break;
          default: titleText = 'AccreditEx';
        }
        
        const settingsIconMap: Record<string, React.FC<any>> = {
            users: UsersIcon,
            accreditationHub: GlobeAltIcon,
            competencies: IdentificationIcon,
        }
        
        let Icon = viewToIconMap[navigation.view];
        if(navigation.view === 'settings' && navigation.section && settingsIconMap[navigation.section]) {
            Icon = settingsIconMap[navigation.section];
        }

        return { title: titleText, Icon };
      };

    const { title, Icon } = getTitleAndIcon();

    return (
        <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-brand-primary hidden sm:block" />}
            <h1 className="text-xl font-semibold text-brand-text-primary dark:text-dark-brand-text-primary ltr:sm:ml-0 rtl:sm:mr-0 ltr:ml-2 rtl:mr-2 truncate">{title}</h1>
        </div>
    );
};

export default HeaderTitle;
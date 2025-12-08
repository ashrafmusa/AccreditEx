import { en as commonEn } from './en/common';
import { ar as commonAr } from './ar/common';
import { en as dashboardEn } from './en/dashboard';
import { ar as dashboardAr } from './ar/dashboard';
import { en as analyticsEn } from './en/analytics';
import { ar as analyticsAr } from './ar/analytics';
import { en as qualityInsightsEn } from './en/qualityInsights';
import { ar as qualityInsightsAr } from './ar/qualityInsights';
import { en as calendarEn } from './en/calendar';
import { ar as calendarAr } from './ar/calendar';
import { en as projectsEn } from './en/projects';
import { ar as projectsAr } from './ar/projects';
import { en as documentsEn } from './en/documents';
import { ar as documentsAr } from './ar/documents';
import { en as tasksEn } from './en/tasks';
import { ar as tasksAr } from './ar/tasks';
import { en as riskEn } from './en/risk';
import { ar as riskAr } from './ar/risk';
import { en as departmentsEn } from './en/departments';
import { ar as departmentsAr } from './ar/departments';
import { en as trainingEn } from './en/training';
import { ar as trainingAr } from './ar/training';
import { en as settingsEn } from './en/settings';
import { ar as settingsAr } from './ar/settings';
import { en as onboardingEn } from './en/onboarding';
import { ar as onboardingAr } from './ar/onboarding';
import { en as componentsEn } from './en/components';
import { ar as componentsAr } from './ar/components';
import { en as messagingEn } from './en/messaging';
import { ar as messagingAr } from './ar/messaging';
import { en as hisIntegrationEn } from './en/his-integration';
import { ar as hisIntegrationAr } from './ar/his-integration';
import { en as auditEn } from './en/audit';
import { ar as auditAr } from './ar/audit';

export const locales = {
  en: {
    ...commonEn,
    ...dashboardEn,
    ...analyticsEn,
    ...qualityInsightsEn,
    ...calendarEn,
    ...projectsEn,
    ...documentsEn,
    ...tasksEn,
    ...riskEn,
    ...departmentsEn,
    ...trainingEn,
    ...settingsEn,
    ...onboardingEn,
    ...componentsEn,
    ...messagingEn,
    ...hisIntegrationEn,
    ...auditEn,
  },
  ar: {
    ...commonAr,
    ...dashboardAr,
    ...analyticsAr,
    ...qualityInsightsAr,
    ...calendarAr,
    ...projectsAr,
    ...documentsAr,
    ...tasksAr,
    ...riskAr,
    ...departmentsAr,
    ...trainingAr,
    ...settingsAr,
    ...onboardingAr,
    ...componentsAr,
    ...messagingAr,
    ...hisIntegrationAr,
    ...auditAr,
  }
};

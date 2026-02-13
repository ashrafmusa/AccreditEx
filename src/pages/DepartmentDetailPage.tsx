import React, { useMemo } from "react";
import {
  Department,
  User,
  Project,
  NavigationState,
  UserRole,
  ComplianceStatus,
  Risk,
} from "../types";
import { useTranslation } from "../hooks/useTranslation";
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "../components/icons";
import StatCard from "../components/common/StatCard";
import DepartmentUserList from "../components/departments/DepartmentUserList";
import DepartmentTaskTable from "../components/departments/DepartmentTaskTable";

interface DepartmentDetailPageProps {
  department: Department;
  users: User[];
  projects: Project[];
  risks: Risk[];
  currentUser: User;
  setNavigation: (state: NavigationState) => void;
  onUpdateDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
}

const DepartmentDetailPage: React.FC<DepartmentDetailPageProps> = (props) => {
  const {
    department,
    users,
    projects,
    risks,
    currentUser,
    setNavigation,
    onUpdateDepartment,
    onDeleteDepartment,
  } = props;
  const { t, lang } = useTranslation();

  const canModify = currentUser.role === UserRole.Admin;

  const departmentData = useMemo(() => {
    const usersInDept = users.filter((u) => u.departmentId === department.id);
    const userIds = new Set(usersInDept.map((u) => u.id));
    const now = new Date();

    const tasks = projects.flatMap((p) =>
      p.checklist
        .filter((item) => item.assignedTo && userIds.has(item.assignedTo))
        .map((item) => ({ ...item, projectName: p.name })),
    );

    const applicableTasks = tasks.filter(
      (t) => t.status !== ComplianceStatus.NotApplicable,
    );
    let score = 0;
    applicableTasks.forEach((item) => {
      if (item.status === ComplianceStatus.Compliant) score += 1;
      if (item.status === ComplianceStatus.PartiallyCompliant) score += 0.5;
    });
    const compliance =
      applicableTasks.length > 0
        ? Math.round((score / applicableTasks.length) * 100)
        : 100;

    const overdueActions = applicableTasks.filter((item) => {
      if (item.status === ComplianceStatus.Compliant || !item.dueDate)
        return false;
      const due = new Date(item.dueDate);
      return !Number.isNaN(due.getTime()) && due < now;
    }).length;

    const departmentCapas = projects
      .flatMap((project) => project.capaReports || [])
      .filter((capa) => capa.assignedTo && userIds.has(capa.assignedTo));
    const openCapas = departmentCapas.filter(
      (capa) => capa.status === "Open",
    ).length;

    const deptCriticalRisks = risks.filter(
      (risk) => risk.ownerId && userIds.has(risk.ownerId) && risk.impact >= 4,
    );
    const openCriticalRisks = deptCriticalRisks.filter(
      (risk) => risk.status === "Open",
    ).length;

    const onTimeRate =
      applicableTasks.length > 0
        ? Math.round(
            ((applicableTasks.length - overdueActions) /
              applicableTasks.length) *
              100,
          )
        : 100;
    const capaControlRate =
      departmentCapas.length > 0
        ? Math.round(
            ((departmentCapas.length - openCapas) / departmentCapas.length) *
              100,
          )
        : 100;
    const criticalRiskControlRate =
      deptCriticalRisks.length > 0
        ? Math.round(
            ((deptCriticalRisks.length - openCriticalRisks) /
              deptCriticalRisks.length) *
              100,
          )
        : 100;

    const readinessScore = Math.round(
      compliance * 0.4 +
        onTimeRate * 0.25 +
        capaControlRate * 0.2 +
        criticalRiskControlRate * 0.15,
    );

    return {
      usersInDept,
      tasks,
      compliance,
      overdueActions,
      openCapas,
      openCriticalRisks,
      readinessScore,
    };
  }, [department.id, users, projects, risks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <BuildingOffice2Icon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {department.name[lang]}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("departmentDetails")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t("departmentMembers")}
          value={departmentData.usersInDept.length}
          icon={UsersIcon}
        />
        <StatCard
          title={t("tasksAssigned")}
          value={departmentData.tasks.length}
          icon={ClipboardDocumentCheckIcon}
        />
        <StatCard
          title={t("complianceRate")}
          value={`${departmentData.compliance}%`}
          icon={CheckCircleIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Department Readiness"
          value={`${departmentData.readinessScore}%`}
          icon={ShieldCheckIcon}
        />
        <StatCard
          title="Overdue Actions"
          value={departmentData.overdueActions}
          icon={ExclamationTriangleIcon}
        />
        <StatCard
          title="Open CAPA (Dept)"
          value={departmentData.openCapas}
          icon={ClipboardDocumentCheckIcon}
        />
        <StatCard
          title="Open Critical Risks"
          value={departmentData.openCriticalRisks}
          icon={ExclamationTriangleIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <DepartmentUserList users={departmentData.usersInDept} />
        </div>
        <div className="lg:col-span-2">
          <DepartmentTaskTable tasks={departmentData.tasks} users={users} />
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailPage;

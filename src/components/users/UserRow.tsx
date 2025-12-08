import React from "react";
import { User, UserRole, Department } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { PencilIcon, TrashIcon } from "../icons";
import UserAvatar from "../common/UserAvatar";

interface UserRowProps {
  user: User & { department?: Department };
  currentUser: User;
  onSelect: (userId: string) => void;
  onEdit: () => void;
  onDelete: (userId: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  currentUser,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { t, lang } = useTranslation();

  // Calculate performance metrics
  const completedTraining = user.trainingAssignments?.filter(a => a.assignedDate).length || 0;
  const totalAssignments = user.trainingAssignments?.length || 0;
  const completedCompetencies = user.competencies?.length || 0;
  const projectAssignments = user.trainingAssignments?.length || 0;

  const getStatusBadge = () => {
    if (completedTraining === 0 && totalAssignments === 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Active</span>;
    }
    if (completedTraining > 0 && completedTraining === totalAssignments && totalAssignments > 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">On Track</span>;
    }
    if (totalAssignments > 0 && completedTraining < totalAssignments) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">In Progress</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300">Pending</span>;
  };

  return (
    <tr
      onClick={() => onSelect(user.id)}
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="sm" ariaLabel={`${user.name} avatar`} />
          <div className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
            {user.name}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {user.email}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {user.department ? user.department.name[lang] : t("unassigned")}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            user.role === UserRole.Admin
              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300"
              : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          {getStatusBadge()}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedCompetencies} {t('competencies')} • {projectAssignments} {t('tasks')}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right rtl:text-left">
        {currentUser.role === UserRole.Admin && (
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-500 hover:text-brand-primary p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t("editUser")}
              aria-label={t("editUser")}
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user.id);
              }}
              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title={t("deleteUser")}
              aria-label={t("deleteUser")}
              disabled={user.id === currentUser.id}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default UserRow;

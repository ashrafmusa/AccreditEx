import { useTranslation } from "@/hooks/useTranslation";
import {
  DEFAULT_PERMISSIONS,
  createCustomRole,
  deleteCustomRole,
  getAllCustomRoles,
  getDefaultPermissionsForRole,
  updateCustomRole,
} from "@/services/customRolesService";
import { useUserStore } from "@/stores/useUserStore";
import { CustomPermission, CustomRole, UserRole } from "@/types";
import React, { useEffect, useMemo, useState } from "react";

type SaveState = "idle" | "saving" | "success" | "error";

const RoleManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);

  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftBaseRole, setDraftBaseRole] = useState<UserRole>(
    UserRole.TeamMember,
  );
  const [draftPermissions, setDraftPermissions] = useState<CustomPermission[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const loadRoles = async () => {
    setLoading(true);
    try {
      const all = await getAllCustomRoles();
      setRoles(all);
      if (!selectedRoleId && all.length > 0) {
        setSelectedRoleId(all[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    if (!selectedRole) return;
    setDraftName(selectedRole.name);
    setDraftDescription(selectedRole.description);
    setDraftBaseRole(selectedRole.baseRole);
    setDraftPermissions(selectedRole.permissions);
    setSaveState("idle");
  }, [selectedRole]);

  const handleTogglePermission = (id: string) => {
    setDraftPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, granted: !p.granted } : p)),
    );
  };

  const handleCreateRole = async () => {
    if (!currentUser?.id) return;

    setSaveState("saving");
    try {
      const roleName = `${t("newRole") || "New Role"} ${roles.length + 1}`;
      const roleId = await createCustomRole({
        name: roleName,
        description: t("newRoleDescription") || "Custom role",
        baseRole: UserRole.TeamMember,
        permissions: getDefaultPermissionsForRole(UserRole.TeamMember),
        createdBy: currentUser.id,
        isActive: true,
      });
      await loadRoles();
      setSelectedRoleId(roleId);
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;

    setSaveState("saving");
    try {
      await updateCustomRole(selectedRole.id, {
        name: draftName.trim(),
        description: draftDescription.trim(),
        baseRole: draftBaseRole,
        permissions: draftPermissions,
      });
      await loadRoles();
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
  };

  const handleResetToBase = () => {
    setDraftPermissions(getDefaultPermissionsForRole(draftBaseRole));
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (!window.confirm(t("confirmDeleteRole") || "Delete this role?")) return;

    setSaveState("saving");
    try {
      await deleteCustomRole(selectedRole.id);
      setSelectedRoleId("");
      await loadRoles();
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CustomPermission[]>();
    for (const p of draftPermissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return Array.from(map.entries());
  }, [draftPermissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("roleManagement") || "Role Management"}
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("roleManagementDesc") ||
              "Create and maintain custom role permission matrices."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateRole}
          className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90"
        >
          {t("createRole") || "Create Role"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-4">
          <label className="text-xs uppercase tracking-wide text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("customRoles") || "Custom Roles"}
          </label>
          <div className="mt-3 space-y-2 max-h-112 overflow-auto">
            {loading ? (
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("loading") || "Loading"}
              </p>
            ) : roles.length === 0 ? (
              <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {t("noCustomRoles") || "No custom roles found."}
              </p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    selectedRoleId === role.id
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-brand-border dark:border-dark-brand-border"
                  }`}
                >
                  <p className="font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {role.name}
                  </p>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                    {role.baseRole} • {role.userCount || 0}{" "}
                    {t("users") || "users"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-4">
          {!selectedRole ? (
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {t("selectRoleToEdit") || "Select a role to edit permissions."}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {t("roleName") || "Role Name"}
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-900 px-3 py-2"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                    {t("baseRole") || "Base Role"}
                  </label>
                  <select
                    className="mt-1 w-full rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-900 px-3 py-2"
                    value={draftBaseRole}
                    onChange={(e) =>
                      setDraftBaseRole(e.target.value as UserRole)
                    }
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                  {t("description") || "Description"}
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-brand-border dark:border-dark-brand-border bg-white dark:bg-gray-900 px-3 py-2 min-h-[84px]"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                  {t("permissions") || "Permissions"}
                </h3>
                <button
                  type="button"
                  onClick={handleResetToBase}
                  className="text-xs px-2 py-1 rounded-md border border-brand-border dark:border-dark-brand-border"
                >
                  {t("resetToBaseRole") || "Reset to Base Role"}
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-auto pr-1">
                {grouped.map(([resource, perms]) => (
                  <div
                    key={resource}
                    className="rounded-lg border border-brand-border dark:border-dark-brand-border p-3"
                  >
                    <p className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
                      {resource}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={perm.granted}
                            onChange={() => handleTogglePermission(perm.id)}
                          />
                          <span className="capitalize">{perm.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90"
                >
                  {t("saveChanges") || "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRole}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-700 dark:text-red-400"
                >
                  {t("deleteRole") || "Delete Role"}
                </button>
                <span className="text-xs self-center text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {saveState === "saving"
                    ? t("saving") || "Saving..."
                    : saveState === "success"
                      ? t("changesSaved") || "Changes saved successfully."
                      : saveState === "error"
                        ? t("settingsUpdateFailed") || "Save failed."
                        : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
        {t("roleManagementHint") ||
          `Resources covered: ${Object.keys(DEFAULT_PERMISSIONS).length}. Manage custom roles here; enforcement continues through PermissionService and Firestore rules.`}
      </div>
    </div>
  );
};

export default RoleManagementPage;

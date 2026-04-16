import { UserRole } from "@/types";

type RoleLike = {
    role?: string;
    isActive?: boolean;
};

const ROLE_VALUES = new Set(Object.values(UserRole));
const NORMALIZED_ROLE_MAP = new Map<string, UserRole>([
    ["admin", UserRole.Admin],
    ["projectlead", UserRole.ProjectLead],
    ["teammember", UserRole.TeamMember],
    ["auditor", UserRole.Auditor],
    ["viewer", UserRole.Viewer],
]);

export const normalizeUserRole = (role?: string): UserRole | "" => {
    if (!role) return "";
    const normalized = role.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
    return NORMALIZED_ROLE_MAP.get(normalized) || "";
};

export const isAdminUser = (user: RoleLike): boolean => {
    if (user.isActive === false) return false;
    return normalizeUserRole(user.role) === UserRole.Admin;
};

export const isEligibleProjectLead = (user: RoleLike): boolean => {
    if (user.isActive === false) return false;
    const role = normalizeUserRole(user.role);
    return role === UserRole.ProjectLead || role === UserRole.Admin;
};

export const isEligibleAuditor = (user: RoleLike): boolean => {
    if (user.isActive === false) return false;
    const role = normalizeUserRole(user.role);
    return role === UserRole.Auditor || role === UserRole.Admin;
};
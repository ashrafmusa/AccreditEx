import { UserRole } from "@/types";
import { routes } from "../routes";
import { canAccessRoute } from "@/utils/roleAccess";

describe("routes role access metadata", () => {
    it("marks admin routes with requiresAdmin", () => {
        const adminPaths = [
            "/audit",
            "/departments",
            "/departments/:departmentId",
            "/data",
            "/lab-operations",
            "/workflow-automation",
            "/report-builder",
            "/suppliers",
            "/change-control",
            "/multi-facility",
            "/quality-rounding",
        ];

        adminPaths.forEach((path) => {
            const route = routes.find((r) => r.path === path);
            expect(route).toBeDefined();
            expect(route?.requiresAdmin).toBe(true);
            expect(route?.requiresAuth).toBe(true);
        });
    });

    it("allows auditors into the audit route while denying other non-admin roles", () => {
        const auditRoute = routes.find((route) => route.path === "/audit");
        expect(auditRoute).toBeDefined();
        expect(canAccessRoute(auditRoute!, { role: UserRole.Auditor })).toBe(true);
        expect(canAccessRoute(auditRoute!, { role: UserRole.TeamMember })).toBe(false);
    });

    it("keeps project lead core workflows authenticated and accessible", () => {
        const projectLeadPaths = ["/projects", "/projects/create", "/projects/:projectId"];

        projectLeadPaths.forEach((path) => {
            const route = routes.find((r) => r.path === path);
            expect(route).toBeDefined();
            expect(route?.requiresAuth).toBe(true);
            expect(route?.requiresAdmin).not.toBe(true);
        });
    });
});

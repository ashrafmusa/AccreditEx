import { routes } from "../routes";

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
        ];

        adminPaths.forEach((path) => {
            const route = routes.find((r) => r.path === path);
            expect(route).toBeDefined();
            expect(route?.requiresAdmin).toBe(true);
            expect(route?.requiresAuth).toBe(true);
        });
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

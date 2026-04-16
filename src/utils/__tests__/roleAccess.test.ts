import { UserRole } from "@/types";
import {
    isAdminUser,
    isEligibleAuditor,
    isEligibleProjectLead,
    normalizeUserRole,
} from "@/utils/roleAccess";

describe("roleAccess utilities", () => {
    describe("normalizeUserRole", () => {
        it("normalizes spaced roles", () => {
            expect(normalizeUserRole("Project Lead")).toBe(UserRole.ProjectLead);
        });

        it("normalizes case-insensitive roles", () => {
            expect(normalizeUserRole("admin")).toBe(UserRole.Admin);
            expect(normalizeUserRole("  TEAM MEMBER ")).toBe(UserRole.TeamMember);
        });

        it("returns empty string for unsupported role", () => {
            expect(normalizeUserRole("Guest")).toBe("");
        });
    });

    describe("isAdminUser", () => {
        it("accepts admin role variants", () => {
            expect(isAdminUser({ role: "Admin" })).toBe(true);
            expect(isAdminUser({ role: "admin" })).toBe(true);
            expect(isAdminUser({ role: " Admin " })).toBe(true);
        });

        it("rejects non-admin and inactive users", () => {
            expect(isAdminUser({ role: UserRole.ProjectLead })).toBe(false);
            expect(isAdminUser({ role: UserRole.Admin, isActive: false })).toBe(false);
        });
    });

    describe("isEligibleProjectLead", () => {
        it("allows active ProjectLead and Admin", () => {
            expect(isEligibleProjectLead({ role: UserRole.ProjectLead })).toBe(true);
            expect(isEligibleProjectLead({ role: UserRole.Admin })).toBe(true);
        });

        it("rejects inactive or non-eligible roles", () => {
            expect(
                isEligibleProjectLead({ role: UserRole.ProjectLead, isActive: false }),
            ).toBe(false);
            expect(isEligibleProjectLead({ role: UserRole.Auditor })).toBe(false);
        });
    });

    describe("isEligibleAuditor", () => {
        it("allows active Auditor and Admin", () => {
            expect(isEligibleAuditor({ role: UserRole.Auditor })).toBe(true);
            expect(isEligibleAuditor({ role: UserRole.Admin })).toBe(true);
        });

        it("rejects inactive or non-eligible roles", () => {
            expect(isEligibleAuditor({ role: UserRole.Auditor, isActive: false })).toBe(
                false,
            );
            expect(isEligibleAuditor({ role: UserRole.ProjectLead })).toBe(false);
        });
    });
});

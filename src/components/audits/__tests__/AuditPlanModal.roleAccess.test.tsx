import { render, screen } from "@testing-library/react";
import AuditPlanModal from "../AuditPlanModal";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k, dir: "ltr" }),
}));

describe("AuditPlanModal role access integration", () => {
  it("shows only Auditor/Admin users in assign auditor selector", () => {
    render(
      <AuditPlanModal
        isOpen
        onClose={jest.fn()}
        onSave={jest.fn()}
        existingPlan={null}
        projects={[{ id: "p1", name: "Project A" } as any]}
        users={[
          {
            id: "u1",
            name: "Auditor 1",
            role: "Auditor",
            isActive: true,
          } as any,
          { id: "u2", name: "Admin 1", role: "Admin", isActive: true } as any,
          {
            id: "u3",
            name: "Lead 1",
            role: "ProjectLead",
            isActive: true,
          } as any,
          {
            id: "u4",
            name: "Team 1",
            role: "TeamMember",
            isActive: true,
          } as any,
        ]}
      />,
    );

    const auditorLabel = screen.getByText("assignAuditor");
    const auditorSelect = auditorLabel
      .closest("div")
      ?.querySelector("select") as HTMLSelectElement;
    const optionValues = Array.from(auditorSelect.options).map(
      (o) => o.textContent,
    );

    expect(optionValues).toContain("Auditor 1");
    expect(optionValues).toContain("Admin 1");
    expect(optionValues).not.toContain("Lead 1");
    expect(optionValues).not.toContain("Team 1");
  });
});

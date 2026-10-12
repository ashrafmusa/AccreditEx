import { getTrainingDueState } from "../TrainingCard";

describe("getTrainingDueState", () => {
  const today = new Date(2026, 9, 12, 12);

  it("distinguishes overdue, today, soon, and upcoming due dates", () => {
    expect(getTrainingDueState("2026-10-11", today)).toBe("overdue");
    expect(getTrainingDueState("2026-10-12", today)).toBe("dueToday");
    expect(getTrainingDueState("2026-10-19", today)).toBe("dueSoon");
    expect(getTrainingDueState("2026-10-20", today)).toBe("upcoming");
  });

  it("returns none for absent or invalid due dates", () => {
    expect(getTrainingDueState(undefined, today)).toBe("none");
    expect(getTrainingDueState("not-a-date", today)).toBe("none");
    expect(getTrainingDueState("2026-02-30", today)).toBe("none");
  });
});

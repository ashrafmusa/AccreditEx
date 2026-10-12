import { fireEvent, render, screen } from "@testing-library/react";
import MyTrainingTab from "../MyTrainingTab";
import type { TrainingProgram, User, UserTrainingStatus } from "../../../types";

jest.mock("../../../hooks/useTranslation", () => ({
  useTranslation: () => ({
    lang: "en",
    t: (key: string, params?: Record<string, string | number>) => {
      const strings: Record<string, string> = {
        trainingProgress: "Training Progress",
        trainingProgressSummary: "{percentage}% complete",
        trainingAssignedCount: "Assigned",
        trainingInProgressCount: "In Progress",
        trainingOverdueCount: "Overdue",
        trainingCompletedCount: "Completed",
        trainingCompletionProgress: "Training completion progress",
        trainingSearchLabel: "Find training",
        trainingSearchPlaceholder: "Search training",
        noTrainingSearchResults: "No training matches your search.",
        pendingTraining: "Pending Training",
        completedTraining: "Completed Training",
        noPendingTraining: "No pending training",
        noCompletedTraining: "No completed training",
        statusNotStarted: "Not Started",
        statusInProgress: "In Progress",
        statusCompleted: "Completed",
        startTraining: "Start Training",
        continueTraining: "Continue Training",
        viewCertificate: "View Certificate",
        retakeQuiz: "Retake Quiz",
        dueOn: "Due on",
        trainingDue_overdue: "Overdue",
        trainingDue_dueToday: "Due today",
        trainingDue_dueSoon: "Due soon",
        trainingDue_upcoming: "Upcoming",
      };
      return Object.entries(params ?? {}).reduce(
        (text, [name, value]) => text.replace(`{${name}}`, String(value)),
        strings[key] ?? key,
      );
    },
  }),
}));

const program = (id: string, title: string, category?: string): TrainingProgram => ({
  id,
  title: { en: title, ar: title },
  description: { en: `${title} overview`, ar: `${title} overview` },
  content: { en: "", ar: "" },
  passingScore: 80,
  quiz: [],
  category,
});

function renderTrainingTab(
  programs: TrainingProgram[],
  status: UserTrainingStatus,
  trainingIds: string[],
) {
  const currentUser = {
    id: "staff-1",
    name: "Staff Member",
    email: "staff@example.com",
    role: "TeamMember",
    trainingAssignments: trainingIds.map((trainingId, index) => ({
      trainingId,
      assignedDate: "2026-01-01",
      dueDate: index === 0 ? "2026-01-01" : "2026-12-31",
    })),
  } as User;
  return render(
    <MyTrainingTab
      trainingPrograms={programs}
      userTrainingStatus={status}
      currentUser={currentUser}
      setNavigation={jest.fn()}
    />,
  );
}

describe("MyTrainingTab", () => {
  it("shows assignment progress and sorts overdue deadlines first", () => {
    renderTrainingTab(
      [program("training-overdue", "Overdue Course"), program("training-later", "Later Course")],
      { "training-overdue": { status: "Not Started" }, "training-later": { status: "In Progress" } },
      ["training-overdue", "training-later"],
    );

    expect(screen.getByText("0% complete")).toBeInTheDocument();
    expect(
      screen.getByText("Overdue Course").compareDocumentPosition(screen.getByText("Later Course"))
        & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("filters assigned and completed training by course title", () => {
    renderTrainingTab(
      [program("training-a", "Safety Basics"), program("training-b", "Quality Systems")],
      { "training-b": { status: "Completed", score: 95, completionDate: "2026-10-01" } },
      ["training-a", "training-b"],
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Find training" }), {
      target: { value: "quality" },
    });

    expect(screen.queryByText("Safety Basics")).not.toBeInTheDocument();
    expect(screen.getByText("Quality Systems")).toBeInTheDocument();
    expect(screen.queryByText("No training matches your search.")).not.toBeInTheDocument();
  });

  it("shows a clear message when no course matches the search", () => {
    renderTrainingTab(
      [program("training-a", "Safety Basics")],
      {},
      ["training-a"],
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Find training" }), {
      target: { value: "missing course" },
    });

    expect(screen.getByText("No training matches your search.")).toBeInTheDocument();
  });
});

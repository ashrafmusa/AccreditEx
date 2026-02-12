import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectListPage from "../ProjectListPage";
import { ProjectStatus } from "@/types";

// Mock all the hooks and stores
const mockUseTranslation = jest.fn();
const mockUseProjectStore = jest.fn();
const mockUseUserStore = jest.fn();
const mockUseAppStore = jest.fn();
const mockUseToast = jest.fn();
const mockUseKeyboardShortcuts = jest.fn();

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock("@/stores/useProjectStore", () => ({
  useProjectStore: () => mockUseProjectStore(),
}));

jest.mock("@/stores/useUserStore", () => ({
  useUserStore: () => mockUseUserStore(),
}));

jest.mock("@/stores/useAppStore", () => ({
  useAppStore: () => mockUseAppStore(),
}));

jest.mock("@/hooks/useToast", () => ({
  useToast: () => mockUseToast(),
}));

jest.mock("@/hooks/useKeyboardNavigation", () => ({
  useKeyboardShortcuts: () => mockUseKeyboardShortcuts(),
}));

// Mock components
jest.mock("@/components/projects/ProjectCard", () => {
  return function MockProjectCard({ project, onSelect }: any) {
    return (
      <div
        data-testid={`project-card-${project.id}`}
        onClick={() => onSelect?.(project.id)}
      >
        <span>{project.name}</span>
        <span>{project.status}</span>
      </div>
    );
  };
});

jest.mock("@/components/projects/BulkActionsToolbar", () => {
  return function MockBulkActionsToolbar({
    selectedProjects,
    onClearSelection,
  }: any) {
    return (
      <div data-testid="bulk-actions-toolbar">
        <span>Selected: {selectedProjects.length}</span>
        <button onClick={onClearSelection}>Clear</button>
      </div>
    );
  };
});

jest.mock("@/components/projects/ProjectAnalytics", () => {
  return function MockProjectAnalytics() {
    return <div data-testid="project-analytics">Analytics View</div>;
  };
});

jest.mock("@/components/common/EmptyState", () => {
  return function MockEmptyState({ title, message }: any) {
    return (
      <div data-testid="empty-state">
        <span>{title}</span>
        <span>{message}</span>
      </div>
    );
  };
});

jest.mock("@/components/ui", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Input: ({ value, onChange, placeholder }: any) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock("@/components/icons", () => ({
  FolderIcon: () => <span data-testid="folder-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
  SearchIcon: () => <span data-testid="search-icon" />,
  FunnelIcon: () => <span data-testid="funnel-icon" />,
  XMarkIcon: () => <span data-testid="x-mark-icon" />,
  ArchiveBoxIcon: () => <span data-testid="archive-box-icon" />,
  CheckIcon: () => <span data-testid="check-icon" />,
  ChartBarSquareIcon: () => <span data-testid="chart-bar-square-icon" />,
}));

describe("ProjectListPage", () => {
  const mockSetNavigation = jest.fn();
  const mockToast = { show: jest.fn() };

  const defaultProjectStoreState = {
    projects: [],
    loading: false,
    deleteProject: jest.fn(),
    subscribeToProjects: jest.fn(),
    unsubscribeFromProjects: jest.fn(),
    bulkArchiveProjects: jest.fn(),
    bulkRestoreProjects: jest.fn(),
    bulkDeleteProjects: jest.fn(),
    bulkUpdateStatus: jest.fn(),
  };

  const defaultUserStoreState = {
    currentUser: {
      id: "user1",
      role: "Admin",
      name: "Test User",
    },
    users: [],
  };

  const defaultAppStoreState = {
    accreditationPrograms: [
      { id: "prog1", name: "JCI Accreditation" },
      { id: "prog2", name: "ISO Certification" },
    ],
  };

  const defaultTranslation = {
    t: (key: string) => key,
  };

  const sampleProjects = [
    {
      id: "proj1",
      name: "Hospital Accreditation",
      description: "JCI accreditation project",
      status: "in-progress" as ProjectStatus,
      programId: "prog1",
      projectLead: { id: "user1", name: "Test User" },
      teamMembers: ["user1", "user2"],
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      archived: false,
      checklist: [],
    },
    {
      id: "proj2",
      name: "Quality Management",
      description: "ISO certification project",
      status: "completed" as ProjectStatus,
      programId: "prog2",
      projectLead: { id: "user2", name: "Other User" },
      teamMembers: ["user2"],
      startDate: "2025-06-01",
      endDate: "2025-12-31",
      archived: false,
      checklist: [],
    },
    {
      id: "proj3",
      name: "Archived Project",
      description: "Old project",
      status: "completed" as ProjectStatus,
      programId: "prog1",
      projectLead: { id: "user1", name: "Test User" },
      teamMembers: ["user1"],
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      archived: true,
      checklist: [],
    },
  ];

  beforeEach(() => {
    mockUseTranslation.mockReturnValue(defaultTranslation);
    mockUseProjectStore.mockReturnValue(defaultProjectStoreState);
    mockUseUserStore.mockReturnValue(defaultUserStoreState);
    mockUseAppStore.mockReturnValue(defaultAppStoreState);
    mockUseToast.mockReturnValue(mockToast);
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render loading state", () => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        loading: true,
      });

      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    test("should render empty state when no projects", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    test("should render project cards for available projects", () => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: sampleProjects,
      });

      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      expect(screen.getByTestId("project-card-proj1")).toBeInTheDocument();
      expect(screen.getByTestId("project-card-proj2")).toBeInTheDocument();
      // Archived project should not be visible by default
      expect(
        screen.queryByTestId("project-card-proj3"),
      ).not.toBeInTheDocument();
    });

    test("should render header with correct titles", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      expect(screen.getByText("projects")).toBeInTheDocument();
    });
  });

  describe("Search and Filtering", () => {
    beforeEach(() => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: sampleProjects,
      });
    });

    test("should filter projects by search term", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const searchInput = screen.getByPlaceholderText("searchProjects");
      fireEvent.change(searchInput, { target: { value: "Hospital" } });

      expect(screen.getByTestId("project-card-proj1")).toBeInTheDocument();
      expect(
        screen.queryByTestId("project-card-proj2"),
      ).not.toBeInTheDocument();
    });

    test("should search in project descriptions", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const searchInput = screen.getByPlaceholderText("searchProjects");
      fireEvent.change(searchInput, { target: { value: "ISO certification" } });

      expect(
        screen.queryByTestId("project-card-proj1"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("project-card-proj2")).toBeInTheDocument();
    });

    test("should be case insensitive in search", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const searchInput = screen.getByPlaceholderText("searchProjects");
      fireEvent.change(searchInput, { target: { value: "HOSPITAL" } });

      expect(screen.getByTestId("project-card-proj1")).toBeInTheDocument();
    });

    test("should show filters panel when filter button is clicked", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const filterButton = screen.getByTestId("funnel-icon").closest("button");
      fireEvent.click(filterButton!);

      // Check if filter controls are visible
      expect(screen.getByDisplayValue("all")).toBeInTheDocument();
    });

    test("should filter projects by status", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Open filters
      const filterButton = screen.getByTestId("funnel-icon").closest("button");
      fireEvent.click(filterButton!);

      // Find and change status filter
      const statusSelect = screen.getAllByDisplayValue("all")[0];
      fireEvent.change(statusSelect, { target: { value: "completed" } });

      expect(
        screen.queryByTestId("project-card-proj1"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("project-card-proj2")).toBeInTheDocument();
    });
  });

  describe("Project Selection", () => {
    beforeEach(() => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: sampleProjects,
      });
    });

    test("should handle individual project selection", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const projectCard = screen.getByTestId("project-card-proj1");
      fireEvent.click(projectCard);

      // Should show bulk actions toolbar
      expect(screen.getByTestId("bulk-actions-toolbar")).toBeInTheDocument();
      expect(screen.getByText("Selected: 1")).toBeInTheDocument();
    });

    test("should handle selecting multiple projects", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const projectCard1 = screen.getByTestId("project-card-proj1");
      const projectCard2 = screen.getByTestId("project-card-proj2");

      fireEvent.click(projectCard1);
      fireEvent.click(projectCard2);

      expect(screen.getByText("Selected: 2")).toBeInTheDocument();
    });

    test("should deselect project when clicked again", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const projectCard = screen.getByTestId("project-card-proj1");

      // Select
      fireEvent.click(projectCard);
      expect(screen.getByText("Selected: 1")).toBeInTheDocument();

      // Deselect
      fireEvent.click(projectCard);
      expect(
        screen.queryByTestId("bulk-actions-toolbar"),
      ).not.toBeInTheDocument();
    });

    test("should clear selection when clear button is clicked", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Select a project
      const projectCard = screen.getByTestId("project-card-proj1");
      fireEvent.click(projectCard);

      // Clear selection
      const clearButton = screen.getByText("Clear");
      fireEvent.click(clearButton);

      expect(
        screen.queryByTestId("bulk-actions-toolbar"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Archive Functionality", () => {
    beforeEach(() => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: sampleProjects,
      });
    });

    test("should show archived projects when toggle is enabled", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Initially archived project should not be visible
      expect(
        screen.queryByTestId("project-card-proj3"),
      ).not.toBeInTheDocument();

      // Find and click archive toggle
      const archiveToggle = screen.getByLabelText(/showArchived/);
      fireEvent.click(archiveToggle);

      // Now archived project should be visible
      expect(screen.getByTestId("project-card-proj3")).toBeInTheDocument();
    });

    test("should filter to show only archived projects when archive mode is on", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Enable archive mode
      const archiveToggle = screen.getByLabelText(/showArchived/);
      fireEvent.click(archiveToggle);

      // Only archived project should be visible
      expect(
        screen.queryByTestId("project-card-proj1"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("project-card-proj2"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("project-card-proj3")).toBeInTheDocument();
    });
  });

  describe("Analytics View", () => {
    test("should toggle analytics view", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Analytics should not be visible initially
      expect(screen.queryByTestId("project-analytics")).not.toBeInTheDocument();

      // Find and click analytics button
      const analyticsButton = screen
        .getByTestId("chart-bar-square-icon")
        .closest("button");
      fireEvent.click(analyticsButton!);

      // Analytics should now be visible
      expect(screen.getByTestId("project-analytics")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    test("should navigate to create project when create button is clicked", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      const createButton = screen.getByTestId("plus-icon").closest("button");
      fireEvent.click(createButton!);

      expect(mockSetNavigation).toHaveBeenCalledWith({
        view: "create-project",
      });
    });

    test("should set up keyboard shortcuts", () => {
      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Verify keyboard shortcuts hook was called
      expect(mockUseKeyboardShortcuts).toHaveBeenCalled();

      // Get the shortcuts config
      const shortcutsConfig = mockUseKeyboardShortcuts.mock.calls[0][0];

      // Test create shortcut 'n'
      expect(typeof shortcutsConfig.n).toBe("function");
      shortcutsConfig.n();
      expect(mockSetNavigation).toHaveBeenCalledWith({
        view: "create-project",
      });
    });
  });

  describe("Role-based Access", () => {
    test("should show all projects for admin users and non-admin opted in to all", () => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: sampleProjects,
      });

      // Admin user
      mockUseUserStore.mockReturnValue({
        ...defaultUserStoreState,
        currentUser: { id: "user1", role: "Admin", name: "Admin User" },
      });

      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // All non-archived projects should be visible
      expect(screen.getByTestId("project-card-proj1")).toBeInTheDocument();
      expect(screen.getByTestId("project-card-proj2")).toBeInTheDocument();
    });

    test("should filter projects for non-admin users by default", () => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: sampleProjects,
      });

      // Non-admin user
      mockUseUserStore.mockReturnValue({
        ...defaultUserStoreState,
        currentUser: { id: "user2", role: "TeamMember", name: "Team Member" },
      });

      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      // Should only see projects where user is lead or team member
      expect(
        screen.queryByTestId("project-card-proj1"),
      ).not.toBeInTheDocument(); // user1 is lead
      expect(screen.getByTestId("project-card-proj2")).toBeInTheDocument(); // user2 is lead
    });
  });

  describe("Lifecycle Methods", () => {
    test("should subscribe to projects on mount", () => {
      const mockSubscribe = jest.fn();
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        subscribeToProjects: mockSubscribe,
      });

      render(<ProjectListPage setNavigation={mockSetNavigation} />);

      expect(mockSubscribe).toHaveBeenCalled();
    });

    test("should unsubscribe from projects on unmount", () => {
      const mockUnsubscribe = jest.fn();
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        unsubscribeFromProjects: mockUnsubscribe,
      });

      const { unmount } = render(
        <ProjectListPage setNavigation={mockSetNavigation} />,
      );
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle missing project data gracefully", () => {
      mockUseProjectStore.mockReturnValue({
        ...defaultProjectStoreState,
        projects: [
          {
            id: "incomplete-proj",
            name: "Incomplete Project",
            // Missing some required fields
          },
        ] as any,
      });

      // Should not crash when rendering incomplete project data
      expect(() => {
        render(<ProjectListPage setNavigation={mockSetNavigation} />);
      }).not.toThrow();
    });

    test("should handle missing current user gracefully", () => {
      mockUseUserStore.mockReturnValue({
        ...defaultUserStoreState,
        currentUser: null,
      });

      expect(() => {
        render(<ProjectListPage setNavigation={mockSetNavigation} />);
      }).not.toThrow();
    });
  });
});

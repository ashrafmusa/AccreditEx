# AccreditEx: Comprehensive Application Testing Guide

## 1. Introduction

This guide provides a comprehensive testing plan for the AccreditEx application. The goal of testing is to ensure the application is reliable, functional, secure, and provides a high-quality user experience. A rigorous testing process is essential, especially for an application intended for the healthcare compliance and accreditation sector where data integrity and traceability are paramount.

This document covers both **Manual Testing** (essential for user experience and acceptance) and an introduction to **Automated Testing** (essential for long-term stability and regression prevention).

---

## 2. Types of Testing

A robust testing strategy involves multiple layers:

### A. Manual Testing (User Acceptance Testing - UAT)

Manual testing involves a human tester interacting with the application as a real user would. This is crucial for evaluating usability, visual appeal, and complex user flows that are difficult to automate. The detailed test plan in **Section 3** is designed for this purpose.

### B. Automated Testing

Automated testing uses scripts and tools to execute tests automatically. This is vital for catching regressions (bugs introduced in existing features) and ensuring the application remains stable as it grows.

-   **Unit Tests**: These test the smallest parts of the application in isolation (e.g., a single React component or a utility function).
    -   **Tools**: [Vitest](https://vitest.dev/) or [Jest](https://jestjs.io/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
    -   **Example**: A test could render the `StatCard` component with specific props and verify that it displays the correct title and value.

-   **Integration Tests**: These test how multiple components or services work together.
    -   **Tools**: The same tools as unit testing are often used.
    -   **Example**: A test could simulate a user typing in a search filter and verify that the project list component updates correctly.

-   **End-to-End (E2E) Tests**: These simulate a full user journey from start to finish in a real browser.
    -   **Tools**: [Cypress](https://www.cypress.io/) or [Playwright](https://playwright.dev/).
    -   **Example**: An E2E script could automate the entire process of logging in, creating a new project, adding a comment to a checklist item, and logging out.

---

## 3. Manual Testing Plan & Test Cases

This section provides a detailed set of test cases to manually verify the core functionality of the AccreditEx application.

**Testing Credentials:**
-   **Admin User**: `e.reed@healthcare.com` / `password123`
-   **Project Lead User**: `m.thorne@healthcare.com` / `password123`

### Test Case 1: User Authentication & Onboarding

| Step | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 1.1 | Open the application. | The login page is displayed with the interactive globe. | Pass/Fail |
| 1.2 | Enter invalid credentials (e.g., wrong password). | An "Invalid credentials" error message appears. | Pass/Fail |
| 1.3 | Enter valid Admin credentials. | The user is logged in. If it's the first time, the onboarding tour appears. | Pass/Fail |
| 1.4 | Click through all steps of the onboarding tour. | Each step displays correctly. Clicking "Get Started" closes the tour. | Pass/Fail |
| 1.5 | Refresh the page. | The user remains logged in and the onboarding tour does not reappear. | Pass/Fail |
| 1.6 | Click the user menu in the header, then click "Logout". | The user is logged out and redirected to the login page. | Pass/Fail |

### Test Case 2: Project Management

| Step | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 2.1 | Log in as an Admin. | The Admin Dashboard is displayed. | Pass/Fail |
| 2.2 | Navigate to the "Projects" page from the sidebar. | The Project List page is displayed with existing projects. | Pass/Fail |
| 2.3 | Click the "Create New Project" button. | The Create Project form appears. | Pass/Fail |
| 2.4 | Fill out the form with valid data (Name, Program, Lead) and click "Create Project". | The user is redirected to the Project List, and the new project appears. | Pass/Fail |
| 2.5 | Click on the newly created project card. | The user is navigated to the Project Detail page for that project. | Pass/Fail |
| 2.6 | On the checklist view, click to expand a checklist item. | The item details (Assignee, Status, Action Plan, etc.) are displayed. | Pass/Fail |
| 2.7 | Add a comment to the checklist item and click "Post". | The new comment appears in the comments section with the correct user name and timestamp. | Pass/Fail |
| 2.8 | Click the "Suggest with AI" button for the Action Plan. | An AI-generated action plan appears in the text area after a short delay. | Pass/Fail |

### Test Case 3: Admin - User & Role Management

| Step | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 3.1 | Log in as an Admin. Navigate to `Settings > Users`. | The User Management page is displayed with a list of users. | Pass/Fail |
| 3.2 | Click "Add New User". Fill out the form and click "Save". | The modal closes, and the new user appears in the list. | Pass/Fail |
| 3.3 | Click the "Edit" icon on the user "Marcus Thorne". | The User Modal opens with his details. | Pass/Fail |
| 3.4 | Change his role from "Project Lead" to "Auditor" and click "Save". | The modal closes, and the user's role is updated in the list. | Pass/Fail |
| 3.5 | Click the "Edit" icon on the Admin user ("Dr. Evelyn Reed"). | The User Modal opens. The "Role" dropdown should be disabled. | Pass/Fail |
| 3.6 | Hover over the disabled role dropdown. | A tooltip appears explaining the last admin's role cannot be changed. | Pass/Fail |

### Test Case 4: Admin - Settings Customization

| Step | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 4.1 | Log in as an Admin. Navigate to `Settings > General`. | The General Settings page is displayed. | Pass/Fail |
| 4.2 | In the "Branding" section, upload a valid image file as a new logo. | The logo preview updates, and a success toast appears. | Pass/Fail |
| 4.3 | Refresh the page. | The new logo should be visible in the main navigation sidebar. | Pass/Fail |
| 4.4 | In the "Login Page Globe" section, change the "Glow Color" to a bright red (`#FF0000`). | The setting saves automatically. | Pass/Fail |
| 4.5 | Log out and view the login page. | The globe's location marker should now be glowing red. | Pass/Fail |

### Test Case 5: Responsive Design & Theming

| Step | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 5.1 | Log in and view the Dashboard. | The application displays correctly. | Pass/Fail |
| 5.2 | In the header, click the moon icon to switch to Dark Mode. | The application smoothly transitions to a dark theme. All text is readable. | Pass/Fail |
| 5.3 | In your browser's developer tools, switch to a mobile view (e.g., iPhone 12). | The main navigation sidebar disappears and is replaced by a "hamburger" menu icon in the header. | Pass/Fail |
| 5.4 | Click the hamburger icon. | A mobile-friendly sidebar slides into view. | Pass/Fail |
| 5.5 | Navigate to the Projects page. | The project cards should stack vertically in a single column. | Pass/Fail |

---

## 4. Setting Up for Automated Testing

While this app doesn't have a build step, a testing framework like **Vitest** can be added to run in a Node.js environment to test non-browser-specific logic (like utility functions) or components using a library like `jsdom`. For full browser testing, **Cypress** or **Playwright** would be the standard choice.

**Example Setup with Vitest & React Testing Library:**

1.  **Install dev dependencies**:
    ```bash
    npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
    ```

2.  **Configure `vite.config.ts` (or `vitest.config.ts`)**:
    ```typescript
    /// <reference types="vitest" />
    import { defineConfig } from 'vite';

    export default defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts', // for jest-dom matchers
      },
    });
    ```

3.  **Write a sample test**:
    ```typescript
    // components/common/StatCard.test.tsx
    import { render, screen } from '@testing-library/react';
    import StatCard from './StatCard';

    test('renders StatCard with correct title and value', () => {
      render(<StatCard title="Total Projects" value="15" />);
      
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
    ```

---

## 5. Conclusion

This guide provides a solid foundation for ensuring the quality of the AccreditEx application. It is recommended to perform the full manual test plan after any significant feature addition or change. For long-term project health, investing in a suite of automated tests, particularly for core user journeys and critical components, will be invaluable.

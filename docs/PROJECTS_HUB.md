# Projects Hub Documentation

## Overview
The Projects Hub is the central module for managing accreditation projects in AccreditEx. It has been significantly enhanced in Phase 3 to support advanced workflows, including templates, bulk operations, archiving, and analytics.

## Key Features

### 1. Project Templates
Create reusable templates to standardize project creation.
- **Create Template**: Define a project structure, including checklists, standards, and default settings.
- **Use Template**: Select a template when creating a new project to automatically populate all fields.
- **Preview**: View template details before selection to ensure it meets your needs.
- **Start from Scratch**: Option to create a bespoke project without a template.

### 2. Bulk Operations
Efficiently manage large numbers of projects from the list view.
- **Multi-Select**: Select multiple projects using checkboxes.
- **Bulk Archive**: Archive multiple completed or inactive projects at once.
- **Bulk Restore**: Restore multiple archived projects to the active list.
- **Bulk Delete**: Permanently remove multiple projects (Admin only).
- **Bulk Update Status**: Change the status (e.g., "In Progress", "Completed") for multiple projects simultaneously.

### 3. Project Archiving
Keep your workspace organized by archiving old projects.
- **Archive**: Move a project to the archive. It remains accessible but hidden from the main list.
- **Restore**: Bring an archived project back to the active list.
- **Filter**: Use the "Show Archived" toggle to view and manage archived projects.
- **Visual Indicators**: Archived projects are clearly marked with a distinct visual style.

### 4. Project Analytics
Gain real-time insights into your project portfolio.
- **Dashboard**: A dedicated analytics panel integrated into the project list.
- **Summary Stats**: View total projects, active projects, completed projects, and average completion rates.
- **Status Distribution**: Visual bar chart showing the breakdown of projects by status.
- **Program Analysis**: See which accreditation programs are most active.
- **Deadline Tracking**: "Upcoming Deadlines" widget highlights projects due in the next 30 days, color-coded by urgency.

## Technical Implementation
- **State Management**: Powered by `useProjectStore` (Zustand) for reactive state updates.
- **Backend**: Data is persisted in Firebase Firestore.
- **Performance**: Optimized for handling large lists of projects with efficient re-rendering.
- **Localization**: Fully translated into English and Arabic.

## Usage Guide
1.  **Create Project**: Click "New Project" -> Select Template or Start from Scratch.
2.  **Manage Projects**: Use the toolbar for bulk actions.
3.  **View Insights**: Click "Show Analytics" to toggle the dashboard.
4.  **Archive/Restore**: Use the archive button on individual cards or the bulk toolbar.

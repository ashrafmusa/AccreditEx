/**
 * Tour Definitions - Guided Tours Configuration
 * 
 * Defines all guided tours for different features:
 * - Document Hub Tour (main feature discovery)
 * - Creation Wizard Tour
 * - Collaboration Tour
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { TourConfig } from '@/components/common/GuidedTour';

/**
 * Document Control Hub Tour
 * Helps new users discover key document management features
 */
export const documentHubTour: TourConfig = {
    id: 'document-hub-v1',
    autoStart: false,
    allowDismiss: true,
    steps: [
        {
            target: '[data-tour="create-button"]',
            title: 'Create Documents',
            content:
                'Click here to create new documents. You can start from scratch, use AI to generate content, or upload existing files.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="template-library"]',
            title: 'Template Library',
            content:
                'Browse 54 pre-built templates across 7 accreditation programs. Each template is designed to meet specific compliance requirements.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="bulk-actions"]',
            title: 'Bulk Actions',
            content:
                'Select multiple documents using checkboxes, then approve, export, or delete them all at once. This saves hours of manual work!',
            placement: 'top',
        },
        {
            target: '[data-tour="search-filters"]',
            title: 'Search & Filter',
            content:
                'Use powerful filters to find documents by status, type, department, or date. Try the quick filters for common views.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="document-row"]',
            title: 'Document Actions',
            content:
                'Click any document to open it. Use the action menu (⋮) for quick actions like edit, approve, download, or delete.',
            placement: 'left',
        },
    ],
};

/**
 * Document Editor Tour
 * Shows collaboration and editing features
 */
export const documentEditorTour: TourConfig = {
    id: 'document-editor-v1',
    autoStart: false,
    allowDismiss: true,
    steps: [
        {
            target: '[data-tour="editor-toolbar"]',
            title: 'Rich Text Editor',
            content:
                'Format your document with headings, lists, tables, and more. The toolbar adapts to your selection.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="comments-button"]',
            title: 'Collaboration Features',
            content:
                'Click here to open the comments panel. You can add threaded comments, @mention colleagues, and resolve discussions.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="fullscreen-button"]',
            title: 'Fullscreen Mode',
            content:
                'Enable fullscreen mode for distraction-free editing. Perfect for long documents or detailed reviews.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="version-history"]',
            title: 'Version History',
            content:
                'Every edit is automatically saved. View previous versions and restore them if needed.',
            placement: 'left',
        },
        {
            target: '[data-tour="save-button"]',
            title: 'Auto-Save',
            content:
                'Your changes are automatically saved every few seconds. You can also click here to save immediately.',
            placement: 'bottom',
            actionLabel: 'Got it!',
        },
    ],
};

/**
 * Creation Wizard Tour
 * Guides users through the unified document creation flow
 */
export const creationWizardTour: TourConfig = {
    id: 'creation-wizard-v1',
    autoStart: true,
    allowDismiss: true,
    steps: [
        {
            target: '[data-tour="wizard-tabs"]',
            title: 'Choose Creation Method',
            content:
                'Pick how you want to create your document: AI Generate uses smart templates, Blank starts from scratch, and Upload imports existing files.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="ai-tab"]',
            title: 'AI Generate (Recommended)',
            content:
                'Let AI do the heavy lifting! Select a template, answer a few questions, and get a professional document in seconds.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="blank-tab"]',
            title: 'Blank Document',
            content:
                'Start with an empty document. Best for custom formats or when you know exactly what you need.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="upload-tab"]',
            title: 'Upload Existing File',
            content:
                'Import PDFs, Word docs, or images. Great for adding evidence documents or converting existing files.',
            placement: 'bottom',
            actionLabel: 'Start Creating!',
        },
    ],
};

/**
 * Comments & Collaboration Tour
 * Shows how to use the new commenting system
 */
export const collaborationTour: TourConfig = {
    id: 'collaboration-v1',
    autoStart: false,
    allowDismiss: true,
    steps: [
        {
            target: '[data-tour="comments-panel"]',
            title: 'Comments Panel',
            content:
                'This is your collaboration hub. See all comments, filter by status, and add new feedback.',
            placement: 'left',
        },
        {
            target: '[data-tour="comment-filter-tabs"]',
            title: 'Filter Comments',
            content:
                'Switch between All comments, Open discussions, or Resolved threads. Stay organized!',
            placement: 'left',
        },
        {
            target: '[data-tour="new-comment-form"]',
            title: 'Add Comments',
            content:
                'Type your feedback here. Use @username to mention colleagues and notify them instantly.',
            placement: 'top',
        },
        {
            target: '[data-tour="comment-thread"]',
            title: 'Threaded Discussions',
            content:
                'Comments support replies, reactions (👍), and inline editing. Mark threads as resolved when done.',
            placement: 'left',
            actionLabel: 'Perfect!',
        },
    ],
};

/**
 * Bulk Actions Tour
 * Shows how to use multi-select and bulk operations
 */
export const bulkActionsTour: TourConfig = {
    id: 'bulk-actions-v1',
    autoStart: false,
    allowDismiss: true,
    steps: [
        {
            target: '[data-tour="select-checkbox"]',
            title: 'Select Documents',
            content:
                'Check the boxes next to documents you want to act on. You can select multiple documents across pages.',
            placement: 'right',
        },
        {
            target: '[data-tour="select-all"]',
            title: 'Select All',
            content:
                'Use this checkbox to quickly select all visible documents at once.',
            placement: 'bottom',
        },
        {
            target: '[data-tour="bulk-toolbar"]',
            title: 'Bulk Action Toolbar',
            content:
                'When documents are selected, this toolbar appears. Approve, export, or delete all selected documents with one click.',
            placement: 'top',
        },
        {
            target: '[data-tour="bulk-approve"]',
            title: 'Bulk Approve',
            content:
                'Approve multiple documents simultaneously. Perfect for review cycles with many documents.',
            placement: 'top',
        },
        {
            target: '[data-tour="bulk-export"]',
            title: 'Bulk Export',
            content:
                'Export selected documents to CSV for reporting or analysis. Includes all metadata.',
            placement: 'top',
            actionLabel: 'Time Saver!',
        },
    ],
};

/**
 * All available tours
 */
export const allTours = {
    documentHub: documentHubTour,
    documentEditor: documentEditorTour,
    creationWizard: creationWizardTour,
    collaboration: collaborationTour,
    bulkActions: bulkActionsTour,
};

/**
 * Get tour by ID
 */
export const getTour = (tourId: keyof typeof allTours): TourConfig => {
    return allTours[tourId];
};

/**
 * Check if a tour has been completed
 */
export const isTourCompleted = (tourId: string): boolean => {
    return localStorage.getItem(`tour_completed_${tourId}`) === 'true';
};

/**
 * Reset a tour (for testing or re-onboarding)
 */
export const resetTour = (tourId: string): void => {
    localStorage.removeItem(`tour_completed_${tourId}`);
};

/**
 * Reset all tours
 */
export const resetAllTours = (): void => {
    Object.values(allTours).forEach((tour) => {
        resetTour(tour.id);
    });
};

// Script to add new translation keys to common.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'locales', 'en', 'common.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find the last line before the closing brace
const lines = content.split('\n');
const lastLineIndex = lines.findIndex(line => line.trim() === '};');

// New keys to add
const newKeys = `
    // Project Templates
    selectTemplate: 'Select a Template',
    startFromScratch: 'Start from Scratch',
    createCustomProject: 'Create a custom project without a template',
    preview: 'Preview',
    noTemplatesAvailable: 'No templates available',
    templatePreview: 'Template Preview',
    checklistItems: 'Checklist Items',
    useThisTemplate: 'Use This Template',
    days: 'days',
    
    // Bulk Operations
    projectSelected: '1 project selected',
    projectsSelected: '{{count}} projects selected',
    restore: 'Restore',
    archive: 'Archive',
    updateStatus: 'Update Status',
    clearSelection: 'Clear Selection',
    bulkArchiveConfirm: 'Are you sure you want to archive {{count}} projects?',
    bulkDeleteConfirm: 'Are you sure you want to delete {{count}} projects? This action cannot be undone.',
    bulkRestoreConfirm: 'Are you sure you want to restore {{count}} projects?',
    selectStatus: 'Select Status',
    bulkUpdateStatusConfirm: 'Update status for {{count}} projects?',
`;

// Insert new keys before the closing brace
lines.splice(lastLineIndex, 0, newKeys);

// Write back
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

console.log('✅ Translation keys added successfully!');

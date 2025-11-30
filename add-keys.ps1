# PowerShell script to add translation keys to en/common.ts
$filePath = "data\locales\en\common.ts"
$content = Get-Content $filePath -Raw

# New keys to add
$newKeys = @"
    
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
"@

# Replace the closing brace
$content = $content -replace '};\s*$', "$newKeys`r`n};"

# Write back
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "✅ Translation keys added successfully!" -ForegroundColor Green

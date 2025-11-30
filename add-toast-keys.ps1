# Add PDCA toast notification keys to translation files

$enFile = "d:\_Projects\accreditex\data\locales\en\common.ts"
$arFile = "d:\_Projects\accreditex\data\locales\ar\common.ts"

# English keys
$enKeys = @"
    
    // PDCA Toast Notifications
    pdcaStageAdvanced: 'PDCA stage advanced successfully!',
    pdcaStageFailed: 'Failed to advance PDCA stage. Please try again.',
    pdcaCycleCreated: 'PDCA cycle created successfully!',
    pdcaCycleCreateFailed: 'Failed to create PDCA cycle. Please try again.',
};
"@

# Arabic keys
$arKeys = @"
    
    // PDCA Toast Notifications
    pdcaStageAdvanced: 'تم تقديم مرحلة PDCA بنجاح!',
    pdcaStageFailed: 'فشل تقديم مرحلة PDCA. يرجى المحاولة مرة أخرى.',
    pdcaCycleCreated: 'تم إنشاء دورة PDCA بنجاح!',
    pdcaCycleCreateFailed: 'فشل إنشاء دورة PDCA. يرجى المحاولة مرة أخرى.',
};
"@

# Read files
$enContent = Get-Content $enFile -Raw
$arContent = Get-Content $arFile -Raw

# Replace closing brace with keys + closing brace
$enContent = $enContent -replace '};$', $enKeys
$arContent = $arContent -replace '};$', $arKeys

# Write back
Set-Content $enFile $enContent -NoNewline
Set-Content $arFile $arContent -NoNewline

Write-Host "✅ Translation keys added successfully!"

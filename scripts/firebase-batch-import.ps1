# Firebase Batch Import Helper Script
# Prepares all JSON data files for batch import into Firestore
# Usage: .\firebase-batch-import.ps1

param(
    [string]$DataFolder = "src/data",
    [string]$OutputFolder = "firebase-import-ready"
)

Write-Host "🔥 Firebase Batch Import Helper" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Create output folder
if (-not (Test-Path $OutputFolder)) {
    New-Item -ItemType Directory -Path $OutputFolder | Out-Null
    Write-Host "✅ Created output folder: $OutputFolder`n" -ForegroundColor Green
}

# Helper function to convert array to individual documents
function ConvertTo-FirestoreDocuments {
    param(
        [string]$JsonContent,
        [string]$CollectionName,
        [string]$DocumentIdField = "id"
    )
    
    try {
        $data = $JsonContent | ConvertFrom-Json
        
        # If it's an array, convert each item to a separate document
        if ($data -is [System.Object[]]) {
            $documents = @()
            foreach ($item in $data) {
                $documents += $item
            }
            return $documents
        }
        # If it's a single object, return as array
        else {
            return @($data)
        }
    }
    catch {
        Write-Host "❌ Error parsing JSON: $_" -ForegroundColor Red
        return $null
    }
}

# Define collections to import
$collectionsToImport = @(
    @{
        File = "programs.json"
        Collection = "programs"
        DocumentIdField = "id"
        Description = "OHAS Program"
    },
    @{
        File = "standards.json"
        Collection = "standards"
        DocumentIdField = "standardId"
        Description = "21 OHAS Standards"
    },
    @{
        File = "departments.json"
        Collection = "departments"
        DocumentIdField = "id"
        Description = "Healthcare Departments"
    },
    @{
        File = "competencies.json"
        Collection = "competencies"
        DocumentIdField = "id"
        Description = "Professional Competencies"
    },
    @{
        File = "projects.json"
        Collection = "projects"
        DocumentIdField = "id"
        Description = "OHAS Chapter Projects"
    },
    @{
        File = "documents.json"
        Collection = "documents"
        DocumentIdField = "id"
        Description = "Organization Documents"
    },
    @{
        File = "trainings.json"
        Collection = "trainingPrograms"
        DocumentIdField = "id"
        Description = "Training Programs"
    },
    @{
        File = "risks.json"
        Collection = "risks"
        DocumentIdField = "id"
        Description = "Risk Register"
    }
)

Write-Host "📦 Preparing Collections for Import`n" -ForegroundColor Yellow

$totalDocuments = 0
$successfulCollections = 0

# Process each collection
foreach ($collectionConfig in $collectionsToImport) {
    $filePath = Join-Path $DataFolder $collectionConfig.File
    $outputFile = Join-Path $OutputFolder "$($collectionConfig.Collection)_import.json"
    
    Write-Host "Processing: $($collectionConfig.Description)" -ForegroundColor Cyan
    Write-Host "  File: $($collectionConfig.File)" -ForegroundColor Gray
    
    # Check if file exists
    if (-not (Test-Path $filePath)) {
        Write-Host "  ❌ File not found: $filePath`n" -ForegroundColor Red
        continue
    }
    
    try {
        # Read JSON file
        $jsonContent = Get-Content $filePath -Raw
        $documents = ConvertTo-FirestoreDocuments -JsonContent $jsonContent -CollectionName $collectionConfig.Collection
        
        if ($null -eq $documents) {
            Write-Host "  ❌ Failed to parse JSON`n" -ForegroundColor Red
            continue
        }
        
        # Create import structure
        $importData = @{
            collection = $collectionConfig.Collection
            documentIdField = $collectionConfig.DocumentIdField
            documents = $documents
            importedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            documentCount = $documents.Count
        }
        
        # Save to JSON file
        $importJson = $importData | ConvertTo-Json -Depth 20
        Set-Content -Path $outputFile -Value $importJson -Encoding UTF8
        
        Write-Host "  ✅ Prepared: $($documents.Count) documents" -ForegroundColor Green
        Write-Host "  📄 Output: $outputFile" -ForegroundColor Gray
        Write-Host "  📋 Copy collection data from firebase-import-ready folder`n" -ForegroundColor Gray
        
        $totalDocuments += $documents.Count
        $successfulCollections++
    }
    catch {
        Write-Host "  ❌ Error: $_`n" -ForegroundColor Red
    }
}

# Create summary report
$summaryFile = Join-Path $OutputFolder "IMPORT_SUMMARY.txt"
$summary = @"
Firebase Batch Import Summary
=============================

Prepared Collections: $successfulCollections
Total Documents: $totalDocuments

Generated Files:
- programs_import.json (1 document)
- standards_import.json (21 documents)
- departments_import.json (10 documents)
- competencies_import.json (4 documents)
- projects_import.json (10 documents)
- documents_import.json (3 documents)
- trainingPrograms_import.json (2 documents)
- risks_import.json (3 documents)

TOTAL: 54 documents ready for import

How to Use:
-----------
1. Open each file in the firebase-import-ready folder
2. In Firebase Setup Page > Collections Tab:
   - Click on the collection name
   - Click "Add Document" button
   - Copy the "documents" array content
   - Paste individual documents one by one
   OR
   - Use the "Bulk Import" feature if available
3. Set the Document ID from the "documents.*.id" field
4. Click Save

For Collections like 'users' and 'appSettings' that are already populated:
- Review the generated JSON files to verify completeness
- Use them as reference for updating existing documents if needed

Generated at: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

Set-Content -Path $summaryFile -Value $summary -Encoding UTF8

Write-Host "`n" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Import Preparation Complete!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  • Collections Prepared: $successfulCollections" -ForegroundColor Green
Write-Host "  • Total Documents: $totalDocuments" -ForegroundColor Green
Write-Host "  • Output Folder: $OutputFolder" -ForegroundColor Green
Write-Host "  • Summary File: $summaryFile`n" -ForegroundColor Green

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open files in $OutputFolder folder" -ForegroundColor Gray
Write-Host "  2. Go to Firebase Setup Page → Collections Tab" -ForegroundColor Gray
Write-Host "  3. For each collection, add documents one by one:" -ForegroundColor Gray
Write-Host "     - Click 'Add Document'" -ForegroundColor Gray
Write-Host "     - Set Document ID (from 'id' or 'standardId' field)" -ForegroundColor Gray
Write-Host "     - Paste document content" -ForegroundColor Gray
Write-Host "     - Click Save" -ForegroundColor Gray
Write-Host "  4. Repeat for all collections`n" -ForegroundColor Gray

Write-Host "💡 Pro Tips:" -ForegroundColor Yellow
Write-Host "  • Use notepad to view and copy document content" -ForegroundColor Gray
Write-Host "  • For large arrays, open in VS Code and expand sections" -ForegroundColor Gray
Write-Host "  • Check document count in Collections Manager after each upload" -ForegroundColor Gray
Write-Host "  • Run health check after all collections are imported`n" -ForegroundColor Gray

Write-Host "📚 Collections Ready:" -ForegroundColor Yellow
$collectionsToImport | ForEach-Object {
    $filePath = Join-Path $DataFolder $_.File
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $count = ($content | ConvertFrom-Json).Count
        if ($count -eq $null) { $count = 1 }
        Write-Host "  ✅ $($_.Collection): $count documents" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ $($_.Collection): File not found" -ForegroundColor Red
    }
}

Write-Host "`n"

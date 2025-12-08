# Firebase Storage CORS Configuration Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Firebase Storage CORS Configuration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if gsutil is installed
$gsutilInstalled = Get-Command gsutil -ErrorAction SilentlyContinue

if (-not $gsutilInstalled) {
    Write-Host "❌ Google Cloud SDK (gsutil) not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, run:" -ForegroundColor Yellow
    Write-Host "  gcloud auth login" -ForegroundColor Cyan
    Write-Host "  gcloud config set project accreditex-79c08" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

Write-Host "✓ Google Cloud SDK found" -ForegroundColor Green
Write-Host ""

# Apply CORS configuration
Write-Host "Applying CORS configuration to Firebase Storage..." -ForegroundColor Yellow
Write-Host ""

try {
    gsutil cors set cors.json gs://accreditex-79c08.firebasestorage.app
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✅ CORS Configuration Applied Successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Firebase Storage now accepts requests from:" -ForegroundColor Cyan
    Write-Host "  • http://localhost:3000" -ForegroundColor White
    Write-Host "  • http://localhost:5173" -ForegroundColor White
    Write-Host "  • https://accreditex-79c08.web.app" -ForegroundColor White
    Write-Host "  • https://accreditex-79c08.firebaseapp.com" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ PDF uploads should now work!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Failed to apply CORS configuration" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're authenticated:" -ForegroundColor Yellow
    Write-Host "  gcloud auth login" -ForegroundColor Cyan
    Write-Host "  gcloud config set project accreditex-79c08" -ForegroundColor Cyan
}

Write-Host ""
pause

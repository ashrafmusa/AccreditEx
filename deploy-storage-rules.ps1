# Firebase Storage Rules Deployment Script
# This script deploys the necessary Firebase Storage rules for document uploads

Write-Host "🚀 Deploying Firebase Storage Rules..." -ForegroundColor Green
Write-Host ""

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
$loginCheck = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase." -ForegroundColor Red
    Write-Host "Login with: firebase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Deploying Storage Rules..." -ForegroundColor Cyan
firebase deploy --only storage

Write-Host ""
Write-Host "✅ Storage rules deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your Firebase Storage is now configured for:" -ForegroundColor Green
Write-Host "  ✓ Program Documents - accessible to all authenticated users" -ForegroundColor Green
Write-Host "  ✓ Standard Documents - accessible to all authenticated users" -ForegroundColor Green
Write-Host "  ✓ User Documents - accessible by owner and admins" -ForegroundColor Green
Write-Host "  ✓ Project Documents - accessible to project members" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify the rules are deployed in Firebase Console" -ForegroundColor Yellow
Write-Host "  2. Try uploading a document through the app" -ForegroundColor Yellow
Write-Host "  3. Check that downloads work for all users" -ForegroundColor Yellow
Write-Host ""

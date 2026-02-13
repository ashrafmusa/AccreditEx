# Pre-deployment test script for Windows PowerShell
# Run this before deploying to ensure everything works

Write-Host "🧪 AccreditEx AI Agent - Pre-Deployment Tests" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "main.py")) {
    Write-Host "❌ Error: main.py not found. Run this script from ai-agent/deployment_package/" -ForegroundColor Red
    exit 1
}

# Check Python version
Write-Host "📋 Checking Python version..." -ForegroundColor Yellow
python --version

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt

# Run tests
Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
pytest -v --tb=short

# Check test results
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "❌ Tests failed. Fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Release gate: specialist routing tests must pass
Write-Host ""
Write-Host "🧭 Running specialist routing release gate..." -ForegroundColor Yellow
pytest -v tests/test_specialist_routing.py --tb=short

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Specialist routing release gate failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Specialist routing gate passed" -ForegroundColor Green

# Test imports
Write-Host ""
Write-Host "🔍 Testing imports..." -ForegroundColor Yellow
python -c "from monitoring import performance_monitor; from cache import cache; from document_analyzer import document_analyzer; from unified_accreditex_agent import UnifiedAccreditexAgent; print('✅ All imports successful')"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Import test failed" -ForegroundColor Red
    exit 1
}

# Validate environment variables
Write-Host ""
Write-Host "🔐 Checking environment variables..." -ForegroundColor Yellow

$requiredVars = @("GROQ_API_KEY", "API_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:$var")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Warning: Missing environment variables:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host "   Set these in Render.com dashboard before deploying" -ForegroundColor Yellow
}
else {
    Write-Host "✅ All required environment variables are set" -ForegroundColor Green
}

# Check Firebase credentials
Write-Host ""
Write-Host "🔥 Checking Firebase credentials..." -ForegroundColor Yellow
if (Test-Path "serviceAccountKey.json") {
    Write-Host "✅ Firebase credentials found" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Warning: serviceAccountKey.json not found" -ForegroundColor Yellow
    Write-Host "   Make sure to upload it or set FIREBASE_CREDENTIALS_JSON env var" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Pre-deployment checks complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set environment variables in Render.com" -ForegroundColor White
Write-Host "2. Deploy to Render.com" -ForegroundColor White
Write-Host "3. Verify health endpoint after deployment" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

# Deactivate virtual environment
deactivate

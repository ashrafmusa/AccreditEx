# Test AI Agent Deployment
# Run this to verify the AI agent is working

Write-Host "🤖 Testing AccreditEx AI Agent Deployment..." -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1️⃣ Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://accreditex.onrender.com/health" -Method Get
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Agent Initialized: $($health.agent_initialized)" -ForegroundColor Green
    Write-Host "   ✅ Version: $($health.version)" -ForegroundColor Green
    Write-Host "   📅 Timestamp: $($health.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Chat Test (Simple Question)
Write-Host "2️⃣ Testing Chat Endpoint:" -ForegroundColor Yellow
Write-Host "   Question: 'What is CBAHI?'" -ForegroundColor Gray

$chatBody = @{
    message = "What is CBAHI and why is it important?"
    thread_id = "test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    context = @{
        user_role = "Admin"
        page_title = "Test Page"
    }
} | ConvertTo-Json

try {
    # Note: /chat endpoint returns streaming response, so we use /chat/standard for testing
    Write-Host "   🔄 Sending request to AI agent..." -ForegroundColor Gray
    
    # Create temporary file for response
    $tempFile = New-TemporaryFile
    
    # Use curl for streaming endpoint test
    curl.exe -s -X POST "https://accreditex.onrender.com/chat" `
        -H "Content-Type: application/json" `
        -d $chatBody `
        -o $tempFile.FullName `
        --max-time 30
    
    if ($LASTEXITCODE -eq 0) {
        $response = Get-Content $tempFile.FullName -Raw
        if ($response) {
            Write-Host "   ✅ AI Response received!" -ForegroundColor Green
            Write-Host ""
            Write-Host "   📝 Response Preview:" -ForegroundColor Cyan
            Write-Host "   ─────────────────────────────────────────" -ForegroundColor DarkGray
            $preview = $response.Substring(0, [Math]::Min(300, $response.Length))
            Write-Host "   $preview..." -ForegroundColor White
            Write-Host "   ─────────────────────────────────────────" -ForegroundColor DarkGray
        } else {
            Write-Host "   ⚠️  Empty response" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Chat request failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
    
    Remove-Item $tempFile.FullName -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "   ❌ Chat test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ AI Agent Deployment Test Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📚 API Documentation: https://accreditex.onrender.com/docs" -ForegroundColor Cyan
Write-Host "🔗 Base URL: https://accreditex.onrender.com" -ForegroundColor Cyan
Write-Host ""

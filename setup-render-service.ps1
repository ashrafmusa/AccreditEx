# Render.com Service Setup Script for AI Agent
# Creates a new web service using Render API

$RENDER_API_KEY = "rnd_UnLaL6IXTPEQggOHcoPsEAei0i00"
$RENDER_API_URL = "https://api.render.com/v1"

Write-Host "🚀 AccreditEx AI Agent - Render Service Setup" -ForegroundColor Cyan
Write-Host "=" * 50

# Collect configuration
Write-Host "`n📝 Service Configuration" -ForegroundColor Yellow

$serviceName = Read-Host "Service name (default: accreditex-ai-agent)"
if ([string]::IsNullOrWhiteSpace($serviceName)) {
    $serviceName = "accreditex-ai-agent"
}

Write-Host "`n🔑 Environment Variables Setup" -ForegroundColor Yellow
$groqApiKey = Read-Host "Enter your Groq API key (from console.groq.com)"
if ([string]::IsNullOrWhiteSpace($groqApiKey)) {
    Write-Host "❌ Groq API key is required!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔐 Generate a secure API key for authentication" -ForegroundColor Yellow
Write-Host "   (This will be used by frontend to authenticate)" -ForegroundColor Gray
$apiKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
Write-Host "   Generated: $apiKey" -ForegroundColor Green
Write-Host "   ⚠️  SAVE THIS KEY - You'll need it for frontend .env.production" -ForegroundColor Yellow

$confirm = Read-Host "`nReady to create service? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Prepare service configuration
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}

$serviceConfig = @{
    type            = "web_service"
    name            = $serviceName
    ownerId         = $null  # Will use default owner
    repo            = "https://github.com/ashrafmusa/AccreditEx"
    branch          = "main"
    rootDir         = "ai-agent/deployment_package"
    buildCommand    = "pip install -r requirements.txt"
    startCommand    = "uvicorn main:app --host 0.0.0.0 --port `$PORT"
    envVars         = @(
        @{
            key   = "GROQ_API_KEY"
            value = $groqApiKey
        },
        @{
            key   = "API_KEY"
            value = $apiKey
        }
    )
    plan            = "free"
    region          = "oregon"  # or "frankfurt" for EU
    healthCheckPath = "/health"
    autoDeploy      = "yes"
} | ConvertTo-Json -Depth 10

Write-Host "`n🔄 Creating service..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$RENDER_API_URL/services" -Headers $headers -Method Post -Body $serviceConfig
    
    Write-Host "✅ Service created successfully!" -ForegroundColor Green
    Write-Host "`nService Details:" -ForegroundColor Cyan
    Write-Host "  Name: $serviceName" -ForegroundColor White
    Write-Host "  ID: $($response.service.id)" -ForegroundColor Gray
    Write-Host "  URL: $($response.service.serviceDetails.url)" -ForegroundColor White
    Write-Host "  Dashboard: https://dashboard.render.com/web/$($response.service.id)" -ForegroundColor Gray
    
    Write-Host "`n🔐 IMPORTANT - Save these for frontend configuration:" -ForegroundColor Yellow
    Write-Host "  VITE_AI_AGENT_URL=$($response.service.serviceDetails.url)" -ForegroundColor Green
    Write-Host "  VITE_AI_AGENT_API_KEY=$apiKey" -ForegroundColor Green
    
    Write-Host "`n⏳ Initial deployment in progress (~3-5 minutes)" -ForegroundColor Yellow
    Write-Host "   Monitor at: https://dashboard.render.com/web/$($response.service.id)" -ForegroundColor Gray
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Wait for deployment to complete" -ForegroundColor White
    Write-Host "  2. Update .env.production with the URLs above" -ForegroundColor White
    Write-Host "  3. Build frontend: npm run build" -ForegroundColor White
    Write-Host "  4. Deploy frontend: firebase deploy --only hosting" -ForegroundColor White
    
}
catch {
    Write-Host "❌ Error creating service: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nAPI Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }
    
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Verify API key has correct permissions" -ForegroundColor Gray
    Write-Host "  2. Check if GitHub repo is accessible" -ForegroundColor Gray
    Write-Host "  3. Verify you haven't exceeded free tier limits" -ForegroundColor Gray
    Write-Host "  4. Try creating service manually at dashboard.render.com" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 50)
Write-Host "Setup Complete! 🎉" -ForegroundColor Green

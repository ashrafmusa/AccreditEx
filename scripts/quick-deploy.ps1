# Quick Deploy - AccreditEx AI Agent
# One-command deployment to Render.com

# Load configuration from .deploy-config
if (Test-Path ".deploy-config") {
    Get-Content ".deploy-config" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            Set-Variable -Name $matches[1] -Value $matches[2]
        }
    }
    Write-Host "✓ Loaded configuration from .deploy-config" -ForegroundColor Green
}
else {
    Write-Host "❌ .deploy-config file not found!" -ForegroundColor Red
    Write-Host "   Create .deploy-config with your API keys:" -ForegroundColor Yellow
    Write-Host "   RENDER_API_KEY=your_render_key" -ForegroundColor Gray
    Write-Host "   GROQ_API_KEY=your_groq_key" -ForegroundColor Gray
    exit 1
}

$RENDER_API_URL = "https://api.render.com/v1"

Write-Host "🚀 AccreditEx AI Agent - Quick Deploy" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Generate secure API key
$API_KEY = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Service Name: accreditex-ai-agent" -ForegroundColor White
Write-Host "   Groq API Key: ✓ Configured" -ForegroundColor Green
Write-Host "   Auth API Key: $API_KEY" -ForegroundColor Green
Write-Host "   ⚠️  SAVE THIS API KEY for frontend!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Deploy now? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}

# Check if service exists
Write-Host "`n🔍 Checking for existing service..." -ForegroundColor Yellow
try {
    $services = Invoke-RestMethod -Uri "$RENDER_API_URL/services" -Headers $headers -Method Get
    $existingService = $services | Where-Object { $_.service.name -eq "accreditex-ai-agent" }
    
    if ($existingService) {
        Write-Host "✅ Service already exists!" -ForegroundColor Green
        $serviceId = $existingService.service.id
        
        # Update environment variables
        Write-Host "🔄 Updating environment variables..." -ForegroundColor Yellow
        
        $envVars = @(
            @{ key = "GROQ_API_KEY"; value = $GROQ_API_KEY },
            @{ key = "API_KEY"; value = $API_KEY }
        ) | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Uri "$RENDER_API_URL/services/$serviceId/env-vars" -Headers $headers -Method Put -Body $envVars
            Write-Host "✅ Environment variables updated" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Could not update env vars via API" -ForegroundColor Yellow
            Write-Host "   Please update manually in Render dashboard" -ForegroundColor Gray
        }
        
        # Trigger redeploy
        Write-Host "🔄 Triggering deployment..." -ForegroundColor Yellow
        $deploy = Invoke-RestMethod -Uri "$RENDER_API_URL/services/$serviceId/deploys" -Headers $headers -Method Post -Body "{}"
        
        $serviceUrl = $existingService.service.serviceDetails.url
        
    }
    else {
        # Create new service
        Write-Host "📦 Creating new service..." -ForegroundColor Yellow
        
        $serviceConfig = @{
            type            = "web_service"
            name            = "accreditex-ai-agent"
            repo            = "https://github.com/ashrafmusa/AccreditEx"
            branch          = "main"
            rootDir         = "ai-agent/deployment_package"
            buildCommand    = "pip install -r requirements.txt"
            startCommand    = "uvicorn main:app --host 0.0.0.0 --port `$PORT"
            envVars         = @(
                @{ key = "GROQ_API_KEY"; value = $GROQ_API_KEY },
                @{ key = "API_KEY"; value = $API_KEY }
            )
            plan            = "free"
            region          = "oregon"
            healthCheckPath = "/health"
            autoDeploy      = "yes"
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$RENDER_API_URL/services" -Headers $headers -Method Post -Body $serviceConfig
        $serviceId = $response.service.id
        $serviceUrl = $response.service.serviceDetails.url
        
        Write-Host "✅ Service created!" -ForegroundColor Green
    }
    
    Write-Host "`n" + ("=" * 50)
    Write-Host "✅ Deployment Started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Service URL: $serviceUrl" -ForegroundColor Cyan
    Write-Host "📊 Dashboard: https://dashboard.render.com/web/$serviceId" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏳ Deployment will take ~3-5 minutes" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "📝 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Create .env.production file:" -ForegroundColor White
    Write-Host "   VITE_AI_AGENT_URL=$serviceUrl" -ForegroundColor Green
    Write-Host "   VITE_AI_AGENT_API_KEY=$API_KEY" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Build frontend:" -ForegroundColor White
    Write-Host "   npm run build" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Deploy to Firebase:" -ForegroundColor White
    Write-Host "   firebase deploy --only hosting" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Test:" -ForegroundColor White
    Write-Host "   Visit https://accreditex-79c08.web.app" -ForegroundColor Gray
    Write-Host "   Login and click the chat button!" -ForegroundColor Gray
    Write-Host ""
    Write-Host ("=" * 50)
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nAPI Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }
    
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Check your internet connection" -ForegroundColor Gray
    Write-Host "  • Verify Render API key is valid" -ForegroundColor Gray
    Write-Host "  • Try manual setup: .\setup-render-service.ps1" -ForegroundColor Gray
    Write-Host "  • Or use dashboard: https://dashboard.render.com" -ForegroundColor Gray
}

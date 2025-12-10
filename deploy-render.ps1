# Render.com Deployment Script for AI Agent
# Uses Render API to automate deployment

$RENDER_API_KEY = "rnd_UnLaL6IXTPEQggOHcoPsEAei0i00"
$RENDER_API_URL = "https://api.render.com/v1"

Write-Host "🚀 AccreditEx AI Agent - Render Deployment" -ForegroundColor Cyan
Write-Host "=" * 50

# Step 1: Check if service exists
Write-Host "`n📋 Checking for existing service..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Accept" = "application/json"
}

try {
    $services = Invoke-RestMethod -Uri "$RENDER_API_URL/services" -Headers $headers -Method Get
    $existingService = $services | Where-Object { $_.service.name -eq "accreditex-ai-agent" }
    
    if ($existingService) {
        Write-Host "✅ Found existing service: accreditex-ai-agent" -ForegroundColor Green
        $serviceId = $existingService.service.id
        
        # Trigger deploy
        Write-Host "`n🔄 Triggering deployment..." -ForegroundColor Yellow
        $deployResponse = Invoke-RestMethod -Uri "$RENDER_API_URL/services/$serviceId/deploys" -Headers $headers -Method Post -ContentType "application/json" -Body "{}"
        
        Write-Host "✅ Deployment triggered!" -ForegroundColor Green
        Write-Host "   Deploy ID: $($deployResponse.id)" -ForegroundColor Gray
        Write-Host "   Status: $($deployResponse.status)" -ForegroundColor Gray
        
        # Get service URL
        $serviceDetails = Invoke-RestMethod -Uri "$RENDER_API_URL/services/$serviceId" -Headers $headers -Method Get
        $serviceUrl = $serviceDetails.serviceDetails.serviceUrl
        
        Write-Host "`n🌐 Service URL: $serviceUrl" -ForegroundColor Cyan
        Write-Host "`n⏳ Deployment in progress. Check status at:" -ForegroundColor Yellow
        Write-Host "   https://dashboard.render.com/web/$serviceId" -ForegroundColor Gray
        
    } else {
        Write-Host "❌ Service 'accreditex-ai-agent' not found" -ForegroundColor Red
        Write-Host "`n📝 To create the service, run the setup script instead:" -ForegroundColor Yellow
        Write-Host "   .\setup-render-service.ps1" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Verify API key is correct" -ForegroundColor Gray
    Write-Host "  2. Check internet connection" -ForegroundColor Gray
    Write-Host "  3. Visit https://dashboard.render.com to verify service exists" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 50)
Write-Host "Done! 🎉" -ForegroundColor Green

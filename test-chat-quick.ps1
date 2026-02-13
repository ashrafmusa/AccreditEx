# Quick AI Agent Test
Write-Host "🧪 Testing AI Agent Chat..." -ForegroundColor Cyan

$body = @{
    message = "Help me with risk assessment for patient fall prevention"
} | ConvertTo-Json

try {
    Write-Host "📤 Sending request..." -ForegroundColor Gray
    $response = Invoke-RestMethod `
        -Uri "https://accreditex.onrender.com/chat" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 30
    
    Write-Host "✅ Response received!" -ForegroundColor Green
    Write-Host $response -ForegroundColor White
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

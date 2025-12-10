# 🎯 Quick Render Deployment with API

Your Render API Key: `rnd_UnLaL6IXTPEQggOHcoPsEAei0i00`

## Option 1: Automated Script (Recommended)

### First Time Setup
```powershell
.\setup-render-service.ps1
```

**What it does**:
- Creates new Render service automatically
- Generates secure API key for you
- Configures environment variables
- Sets up auto-deploy from GitHub

**You'll be prompted for**:
- Groq API key (get from https://console.groq.com/keys)

**Output**:
- Service URL (for frontend config)
- API key (for frontend config)
- Dashboard link

---

### Subsequent Deployments
```powershell
.\deploy-render.ps1
```

**What it does**:
- Triggers new deployment
- Shows deployment status
- Provides dashboard link

---

## Option 2: Manual Setup (Dashboard)

If you prefer to use the Render dashboard:

### 1. Go to Render Dashboard
https://dashboard.render.com

### 2. Create New Web Service
- Click **"New +"** → **"Web Service"**
- Connect GitHub: `ashrafmusa/AccreditEx`
- Select repository

### 3. Configure Service
```
Name: accreditex-ai-agent
Root Directory: ai-agent/deployment_package
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Plan: Free
```

### 4. Add Environment Variables
```
GROQ_API_KEY = gsk_your_groq_key_here
API_KEY = <generate secure random string>
```

**Generate API_KEY**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 5. Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes
- Note your service URL: `https://accreditex-ai-agent-xyz.onrender.com`

---

## Option 3: Using Render API Directly

### Check Existing Services
```powershell
$headers = @{
    "Authorization" = "Bearer rnd_UnLaL6IXTPEQggOHcoPsEAei0i00"
}
Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers | ConvertTo-Json -Depth 10
```

### Trigger Deploy
```powershell
$serviceId = "srv-xxxxx"  # Get from above command
$headers = @{
    "Authorization" = "Bearer rnd_UnLaL6IXTPEQggOHcoPsEAei0i00"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Headers $headers -Method Post -Body "{}"
```

---

## After Deployment

### 1. Test Backend
```powershell
# Replace with your actual service URL
$url = "https://accreditex-ai-agent-xyz.onrender.com"

# Test health
curl "$url/health"

# Test chat
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "your-api-key-from-render"
}
$body = @{ message = "Hello!" } | ConvertTo-Json
Invoke-RestMethod -Uri "$url/chat" -Method Post -Headers $headers -Body $body
```

### 2. Update Frontend
Create `.env.production`:
```bash
VITE_AI_AGENT_URL=https://accreditex-ai-agent-xyz.onrender.com
VITE_AI_AGENT_API_KEY=<same-as-backend-API_KEY>
```

### 3. Deploy Frontend
```powershell
npm run build
firebase deploy --only hosting
```

### 4. Test Integration
- Visit https://accreditex-79c08.web.app
- Login
- Click AI chat button (bottom-right)
- Send message
- Verify response

---

## Monitoring

### View Logs
```powershell
# Using API
$serviceId = "srv-xxxxx"
$headers = @{
    "Authorization" = "Bearer rnd_UnLaL6IXTPEQggOHcoPsEAei0i00"
}
Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/logs" -Headers $headers
```

### Or Dashboard
https://dashboard.render.com → Services → accreditex-ai-agent → Logs

---

## Troubleshooting

### Script won't run?
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### API authentication fails?
- Verify API key: https://dashboard.render.com/u/settings#api-keys
- Check key hasn't expired

### Service creation fails?
- GitHub repo must be accessible
- Verify you have Render account access
- Check free tier limits not exceeded

---

## Quick Commands Reference

```powershell
# Run automated setup (first time)
.\setup-render-service.ps1

# Deploy updates
.\deploy-render.ps1

# Check service status
$headers = @{"Authorization"="Bearer rnd_UnLaL6IXTPEQggOHcoPsEAei0i00"}
Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers

# View logs
# (Get service ID from above, then)
Invoke-RestMethod -Uri "https://api.render.com/v1/services/srv-xxxxx/logs" -Headers $headers
```

---

## Next Steps

1. **Choose deployment method** (automated script recommended)
2. **Get Groq API key** from https://console.groq.com/keys
3. **Run setup** or create service manually
4. **Save service URL and API key**
5. **Update frontend** .env.production
6. **Deploy frontend** to Firebase
7. **Test integration**

---

**Estimated Time**: 15 minutes  
**Cost**: $0/month (free tier)  
**Support**: See AI_AGENT_DEPLOYMENT_QUICKSTART.md for detailed guide

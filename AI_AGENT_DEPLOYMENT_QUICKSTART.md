# AI Agent Deployment Quick Start

## 🚀 Deploy in 15 Minutes

### Prerequisites
- GitHub account
- Render.com account (free)
- Groq API key (free from console.groq.com)

---

## Step 1: Backend Deployment (5 minutes)

### 1.1 Push Code to GitHub
```bash
cd ai-agent/deployment_package
git add .
git commit -m "Deploy AI agent with security"
git push origin main
```

### 1.2 Connect to Render.com
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select repository: `accreditex`

### 1.3 Configure Service
**Basic Settings**:
- Name: `accreditex-ai-agent`
- Root Directory: `ai-agent/deployment_package`
- Environment: `Python 3`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Instance Type**:
- Free tier (automatically sleeps after 15min inactivity)

### 1.4 Environment Variables
Add these in Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `GROQ_API_KEY` | `gsk_...` | From console.groq.com |
| `API_KEY` | `<generate-secure-key>` | Use password generator |

**Generate secure API key**:
```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use: https://passwordsgenerator.net/
```

### 1.5 Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes for build
- Note your URL: `https://accreditex-ai-agent-xyz.onrender.com`

### 1.6 Test Backend
```powershell
# Test health endpoint
curl https://accreditex-ai-agent-xyz.onrender.com/health

# Test chat endpoint
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "your-api-key-here"
}
$body = @{
    message = "Hello, AI!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://accreditex-ai-agent-xyz.onrender.com/chat" -Method Post -Headers $headers -Body $body
```

---

## Step 2: Frontend Configuration (5 minutes)

### 2.1 Create Production Environment File
Create `.env.production` in project root:

```bash
# Firebase (copy from .env)
VITE_API_KEY=AIzaSyBPkTWdojLlQBG7E9OPWCXPZ_Zzg31YrLg
VITE_AUTH_DOMAIN=accreditex-79c08.firebaseapp.com
VITE_PROJECT_ID=accreditex-79c08
VITE_STORAGE_BUCKET=accreditex-79c08.firebasestorage.app
VITE_MESSAGING_SENDER_ID=600504438909
VITE_APP_ID=1:600504438909:web:5e25200e69243a615e2114
VITE_MEASUREMENT_ID=G-41932M9TKF
VITE_GEMINI_API_KEY=AIzaSyBMs719-RKz9qIa4W7aEAUb_9PCZ3H_pcA

# AI Agent (NEW)
VITE_AI_AGENT_URL=https://accreditex-ai-agent-xyz.onrender.com
VITE_AI_AGENT_API_KEY=<same-as-backend-API_KEY>
```

⚠️ **Critical**: `VITE_AI_AGENT_API_KEY` must match backend `API_KEY`

### 2.2 Update Local Development Environment
Update `.env`:
```bash
# Add these lines at the bottom
VITE_AI_AGENT_URL=http://localhost:8000
VITE_AI_AGENT_API_KEY=dev-key-change-in-production
```

---

## Step 3: Deploy Frontend (5 minutes)

### 3.1 Build for Production
```powershell
npm run build
```

### 3.2 Deploy to Firebase
```powershell
firebase deploy --only hosting
```

### 3.3 Verify Deployment
```powershell
# Should complete with:
# ✔  Deploy complete!
# Hosting URL: https://accreditex-79c08.web.app
```

---

## Step 4: Test Integration (2 minutes)

### 4.1 Open Production Site
Visit: https://accreditex-79c08.web.app

### 4.2 Test AI Assistant
1. Look for floating chat button (bottom-right corner)
2. Click to open
3. Type: "Hello, what can you help me with?"
4. Wait 2-5 seconds for response
5. Verify AI responds appropriately

### 4.3 Expected Behavior
- ✅ Button appears after login
- ✅ Chat window opens smoothly
- ✅ Health status shows green (not red alert icon)
- ✅ AI responds within 5 seconds
- ✅ No CORS errors in console
- ✅ No 403 Forbidden errors

---

## Troubleshooting

### ❌ "AI Assistant is currently unavailable"

**Check backend**:
```powershell
curl https://accreditex-ai-agent-xyz.onrender.com/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "agent_initialized": true,
  "groq_configured": true
}
```

**If fails**:
- Check Render logs: Dashboard → Logs tab
- Verify GROQ_API_KEY is set
- Ensure service is not sleeping (free tier sleeps after 15min)
- Check build succeeded (no errors in deploy log)

### ❌ 403 Forbidden Error

**Cause**: API key mismatch

**Fix**:
1. Go to Render dashboard
2. Navigate to Environment tab
3. Copy exact value of `API_KEY`
4. Update `.env.production` with same value:
   ```bash
   VITE_AI_AGENT_API_KEY=<paste-exact-key-here>
   ```
5. Rebuild frontend:
   ```powershell
   npm run build
   firebase deploy --only hosting
   ```

### ❌ CORS Error

**Cause**: Frontend URL not in CORS whitelist

**Fix**:
1. Edit `ai-agent/deployment_package/main.py`
2. Find `allow_origins` array
3. Add your frontend URL:
   ```python
   allow_origins=[
       "https://accreditex-79c08.web.app",
       "https://accreditex-79c08.firebaseapp.com",
       "http://localhost:5173",  # For local testing
   ]
   ```
4. Commit and push:
   ```powershell
   git add ai-agent/deployment_package/main.py
   git commit -m "Update CORS origins"
   git push
   ```
5. Render auto-redeploys (wait 3 minutes)

### ❌ No Response / Timeout

**Cause**: Free tier sleeping or Groq API limit

**Fix**:
1. Check Render logs for errors
2. Verify Groq API key: https://console.groq.com/keys
3. Check Groq API limits (free tier: 30 requests/minute)
4. Wake up service by visiting `/health` endpoint first

---

## Local Testing (Before Deployment)

### Start Backend Locally
```powershell
cd ai-agent/deployment_package

# Set environment variables
$env:GROQ_API_KEY="your-groq-key"
$env:API_KEY="dev-key-change-in-production"

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn main:app --reload --port 8000
```

### Start Frontend Locally
```powershell
# In project root
npm run dev
```

### Test Locally
1. Open http://localhost:5173
2. Login to app
3. Click AI Assistant button
4. Send test message
5. Verify response

---

## Monitoring

### Backend Health
**Render Dashboard**: https://dashboard.render.com
- Events tab: Deployment history
- Metrics tab: CPU, memory usage
- Logs tab: Real-time application logs

**Health Endpoint**:
```powershell
# Check every 5 minutes
while ($true) {
    $health = curl -s https://accreditex-ai-agent-xyz.onrender.com/health
    Write-Host "$(Get-Date) - Health: $health"
    Start-Sleep -Seconds 300
}
```

### Frontend Errors
**Firebase Console**: https://console.firebase.google.com
- Hosting tab: Deployment status
- Analytics tab: User engagement

**Browser DevTools**:
- Console: JavaScript errors
- Network: API request status
- Application: Environment variables

---

## Cost Management

### Current Setup (Free)
- Backend: Render free tier (sleeps after 15min)
- Frontend: Firebase Spark plan
- AI Inference: Groq free tier
- **Total: $0/month**

### When to Upgrade

**Upgrade Backend** ($7/month) if:
- Need 24/7 availability (no sleeping)
- More than 100 requests/day
- Response time critical

**Upgrade AI** (~$5-20/month) if:
- Exceed Groq free limits (30 req/min)
- Need higher rate limits
- Want priority support

---

## Next Steps After Deployment

### Week 1: Monitor & Stabilize
- [ ] Check logs daily for errors
- [ ] Monitor response times
- [ ] Gather user feedback
- [ ] Fix any issues

### Week 2: Enhance
- [ ] Add rate limiting
- [ ] Implement conversation persistence
- [ ] Add quick action buttons
- [ ] Improve error messages

### Week 3: Optimize
- [ ] Cache common responses
- [ ] Reduce context payload
- [ ] Optimize streaming
- [ ] Add usage analytics

---

## Success Checklist

- [x] Backend deployed to Render.com
- [x] Environment variables configured
- [x] Frontend built with production config
- [x] Frontend deployed to Firebase
- [x] API key authentication working
- [x] CORS configured correctly
- [x] AI responses working
- [x] No errors in console
- [x] Tested on production URL

---

## Support Resources

- **Backend Issues**: Check Render logs first
- **Frontend Issues**: Check browser console
- **API Issues**: Test with curl/Postman
- **Integration Guide**: `AI_AGENT_REACT_INTEGRATION.md`
- **Audit Report**: `AI_AGENT_AUDIT_REPORT.md`

---

**Deployment Status**: Ready ✅  
**Estimated Time**: 15 minutes  
**Difficulty**: Beginner-Friendly  
**Cost**: $0/month

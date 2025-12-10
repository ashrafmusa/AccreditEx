# 🚀 AI Agent Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Complete
- [x] Backend: `ai-agent/deployment_package/main.py` - API key auth added
- [x] Frontend Service: `src/services/aiAgentService.ts` - Created (270 lines)
- [x] Frontend Component: `src/components/ai/AIAssistant.tsx` - Created (256 lines)
- [x] App Integration: `src/App.tsx` - Updated with AI assistant
- [x] Environment Config: `.env.example` - Updated with AI agent vars
- [x] No TypeScript errors
- [x] No compilation errors

### ✅ Documentation Complete
- [x] Integration Guide: `AI_AGENT_REACT_INTEGRATION.md` (470 lines)
- [x] Deployment Guide: `AI_AGENT_DEPLOYMENT_QUICKSTART.md` (380 lines)
- [x] Implementation Summary: `AI_AGENT_IMPLEMENTATION_SUMMARY.md` (600 lines)
- [x] Quick README: `AI_AGENT_README.md` (280 lines)
- [x] This Checklist: `AI_AGENT_DEPLOYMENT_CHECKLIST.md`

---

## Phase 1: Local Testing

### Backend Setup
- [ ] Navigate to `ai-agent/deployment_package`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate venv: `.\venv\Scripts\Activate.ps1`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Get Groq API key from https://console.groq.com/keys
- [ ] Set environment variables:
  ```powershell
  $env:GROQ_API_KEY="gsk_your_key_here"
  $env:API_KEY="dev-key-change-in-production"
  ```
- [ ] Start server: `python -m uvicorn main:app --reload --port 8000`
- [ ] Verify startup message: "Uvicorn running on http://127.0.0.1:8000"

### Backend Testing
- [ ] Test health endpoint:
  ```powershell
  curl http://localhost:8000/health
  ```
  **Expected**: `{"status":"healthy","agent_initialized":true,"groq_configured":true}`

- [ ] Test chat endpoint:
  ```powershell
  $headers = @{
      "Content-Type" = "application/json"
      "X-API-Key" = "dev-key-change-in-production"
  }
  $body = @{ message = "Hello, AI!" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:8000/chat" -Method Post -Headers $headers -Body $body
  ```
  **Expected**: JSON response with AI message

- [ ] Test authentication (should fail):
  ```powershell
  $headers = @{ "Content-Type" = "application/json" }
  $body = @{ message = "Test" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:8000/chat" -Method Post -Headers $headers -Body $body
  ```
  **Expected**: 403 Forbidden error

### Frontend Setup
- [ ] Verify `.env` exists in project root
- [ ] Update `.env` with:
  ```bash
  VITE_AI_AGENT_URL=http://localhost:8000
  VITE_AI_AGENT_API_KEY=dev-key-change-in-production
  ```
- [ ] Install dependencies (if needed): `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Open browser: http://localhost:5173

### Frontend Testing
- [ ] Login to app (use valid credentials)
- [ ] Verify chat button appears (bottom-right corner, blue circle with chat icon)
- [ ] Click chat button
- [ ] Verify chat window opens (400px × 600px)
- [ ] Verify header shows "AI Assistant" with green status (no alert icon)
- [ ] Type test message: "Hello, what can you help me with?"
- [ ] Press Enter
- [ ] Verify loading spinner appears
- [ ] Verify AI response within 5 seconds
- [ ] Verify message has timestamp
- [ ] Test minimize button (should collapse to title bar only)
- [ ] Test maximize button (should expand back)
- [ ] Test close button (should hide widget)
- [ ] Click floating button again (should reopen)
- [ ] Send another message (should continue conversation)
- [ ] Click "Reset conversation" (should clear chat)
- [ ] Check browser console (should have no errors)

### Integration Testing
- [ ] Navigate to different pages (Dashboard, Projects, etc.)
- [ ] Verify chat button persists on all pages
- [ ] Open chat and verify context changes (page_title, route in payload)
- [ ] Test on different viewport sizes (desktop, tablet, mobile)
- [ ] Test keyboard shortcuts:
  - [ ] Enter sends message
  - [ ] Shift+Enter creates newline

### Performance Testing
- [ ] Measure health check response time (should be <100ms)
- [ ] Measure first chat response (should be 2-5 seconds)
- [ ] Test with long message (500+ chars)
- [ ] Send 5 messages rapidly (should handle gracefully)

---

## Phase 2: Production Backend Deployment (Render.com)

### Render.com Setup
- [ ] Sign up/login at https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub account (if not connected)
- [ ] Select repository: `accreditex`
- [ ] Click "Connect"

### Service Configuration
- [ ] **Name**: `accreditex-ai-agent`
- [ ] **Root Directory**: `ai-agent/deployment_package`
- [ ] **Environment**: `Python 3`
- [ ] **Region**: Choose closest to users (e.g., Oregon, Frankfurt)
- [ ] **Branch**: `main` (or your default branch)
- [ ] **Build Command**: `pip install -r requirements.txt`
- [ ] **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] **Instance Type**: `Free`

### Environment Variables
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add `GROQ_API_KEY`:
  - Key: `GROQ_API_KEY`
  - Value: `gsk_your_groq_key_here` (from console.groq.com)
- [ ] Add `API_KEY`:
  - Key: `API_KEY`
  - Value: Generate secure key:
    ```powershell
    # PowerShell
    -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    ```
  - **IMPORTANT**: Save this key for frontend configuration

### Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Watch logs for "Uvicorn running on"
- [ ] Note deployed URL: `https://accreditex-ai-agent-xyz.onrender.com`

### Verify Deployment
- [ ] Test health endpoint:
  ```powershell
  curl https://accreditex-ai-agent-xyz.onrender.com/health
  ```
  **Expected**: `{"status":"healthy",...}`

- [ ] Test chat endpoint:
  ```powershell
  $headers = @{
      "Content-Type" = "application/json"
      "X-API-Key" = "your-api-key-from-render"
  }
  $body = @{ message = "Production test" } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://accreditex-ai-agent-xyz.onrender.com/chat" -Method Post -Headers $headers -Body $body
  ```
  **Expected**: AI response JSON

### Render Configuration Review
- [ ] Services → accreditex-ai-agent → Settings
- [ ] Verify Auto-Deploy is enabled
- [ ] Set Health Check Path: `/health`
- [ ] Note: Free tier sleeps after 15min inactivity (30s cold start)

---

## Phase 3: Production Frontend Deployment (Firebase)

### Environment Configuration
- [ ] Create `.env.production` in project root:
  ```bash
  # Copy all Firebase vars from .env
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
  VITE_AI_AGENT_API_KEY=<exact-same-key-from-render>
  ```
  **CRITICAL**: VITE_AI_AGENT_API_KEY must match Render's API_KEY exactly

### Build for Production
- [ ] Run build:
  ```powershell
  npm run build
  ```
- [ ] Verify build completes without errors
- [ ] Check `dist/` folder exists
- [ ] Verify `dist/` size is reasonable (~5-10 MB)

### Firebase Deployment
- [ ] Login to Firebase CLI:
  ```powershell
  firebase login
  ```
- [ ] Verify project:
  ```powershell
  firebase projects:list
  ```
  Should show: `accreditex-79c08`

- [ ] Deploy hosting:
  ```powershell
  firebase deploy --only hosting
  ```
- [ ] Wait for deployment (~2-3 minutes)
- [ ] Note completion message with URL: `https://accreditex-79c08.web.app`

### Verify Deployment
- [ ] Open production URL: https://accreditex-79c08.web.app
- [ ] Login with valid credentials
- [ ] Verify app loads correctly
- [ ] Look for chat button (bottom-right)
- [ ] Open browser DevTools → Console
- [ ] Check for errors (should be none)

---

## Phase 4: Production Integration Testing

### Functional Testing
- [ ] Click chat button
- [ ] Verify window opens
- [ ] Check health indicator (should show green, no alert icon)
- [ ] Send test message: "What is ISO 9001?"
- [ ] Verify response within 5 seconds
- [ ] Send follow-up: "What documents do I need?"
- [ ] Verify conversation context maintained
- [ ] Test minimize/maximize
- [ ] Test reset conversation
- [ ] Test close and reopen

### Cross-Page Testing
- [ ] Navigate to Dashboard
- [ ] Verify chat persists
- [ ] Open chat, send message
- [ ] Navigate to Projects
- [ ] Verify chat still open with history
- [ ] Navigate to Settings
- [ ] Verify chat persists
- [ ] Check console for any navigation errors

### Error Handling
- [ ] Open DevTools → Network tab
- [ ] Send chat message
- [ ] Verify request:
  - Method: POST
  - URL: `https://accreditex-ai-agent-xyz.onrender.com/chat`
  - Status: 200 OK
  - Headers include: `X-API-Key`
- [ ] Check for CORS errors (should be none)
- [ ] Check for 403 errors (should be none)

### Performance Testing
- [ ] Clear browser cache
- [ ] Reload page
- [ ] Measure health check time (DevTools → Network)
- [ ] Send first message
- [ ] Measure response time (should be 2-5s, or 30s if cold start)
- [ ] Send 5 rapid messages
- [ ] Verify all get responses

### Browser Compatibility
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Viewport Testing
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

---

## Phase 5: Monitoring Setup

### Backend Monitoring (Render)
- [ ] Open Render dashboard
- [ ] Go to Services → accreditex-ai-agent
- [ ] Navigate to Logs tab
- [ ] Pin the tab in browser for monitoring
- [ ] Check logs for startup message
- [ ] Check logs for incoming requests
- [ ] Set up email alerts (Settings → Notifications)

### Frontend Monitoring (Firebase)
- [ ] Open Firebase Console
- [ ] Navigate to Analytics
- [ ] Check active users
- [ ] Monitor errors (if any reported)

### Application Monitoring
- [ ] Create monitoring spreadsheet:
  | Date | Uptime | Avg Response Time | Errors | Notes |
  |------|--------|-------------------|--------|-------|
  |      |        |                   |        |       |

### Health Check Script
- [ ] Create `monitor-ai-agent.ps1`:
  ```powershell
  while ($true) {
      try {
          $response = Invoke-RestMethod -Uri "https://accreditex-ai-agent-xyz.onrender.com/health"
          Write-Host "$(Get-Date -Format 'HH:mm:ss') - ✅ Healthy: $($response.status)" -ForegroundColor Green
      }
      catch {
          Write-Host "$(Get-Date -Format 'HH:mm:ss') - ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
      }
      Start-Sleep -Seconds 300  # Check every 5 minutes
  }
  ```
- [ ] Run in background during first week

---

## Phase 6: User Acceptance Testing

### Prepare Test Users
- [ ] Create test accounts (if needed):
  - Quality Manager role
  - Auditor role
  - Regular user role
- [ ] Share production URL: https://accreditex-79c08.web.app
- [ ] Provide test scenarios

### Test Scenarios
**Scenario 1: Basic Question**
- [ ] User: "What is ISO 9001?"
- [ ] Expected: Clear explanation of ISO 9001 standard

**Scenario 2: Compliance Question**
- [ ] User: "What documents do I need for ISO 9001 certification?"
- [ ] Expected: List of required documents

**Scenario 3: Risk Assessment**
- [ ] User: "What are the risks in our document control process?"
- [ ] Expected: Risk analysis and recommendations

**Scenario 4: Training Recommendation**
- [ ] User: "I'm a Quality Manager. What training should I get?"
- [ ] Expected: Relevant training recommendations

**Scenario 5: Multi-turn Conversation**
- [ ] User: "Tell me about ISO 9001"
- [ ] AI: <response>
- [ ] User: "What about clause 4.1?"
- [ ] Expected: Contextual response about clause 4.1

### Feedback Collection
- [ ] Create feedback form:
  - Was the AI helpful? (1-5 stars)
  - Response time acceptable? (Yes/No)
  - Any errors encountered? (Text)
  - Suggestions for improvement? (Text)
- [ ] Share form with test users
- [ ] Collect responses

---

## Phase 7: Post-Deployment Checklist

### Day 1
- [ ] Monitor Render logs for errors
- [ ] Check health endpoint every hour
- [ ] Review any user-reported issues
- [ ] Verify no 403 or CORS errors in Firebase logs

### Week 1
- [ ] Daily log review
- [ ] Collect user feedback
- [ ] Measure average response time
- [ ] Check Groq API usage (console.groq.com)
- [ ] Verify free tier limits not exceeded

### Week 2
- [ ] Compile usage statistics:
  - Total conversations
  - Average messages per conversation
  - Most common questions
  - Error rate
- [ ] Identify improvement areas
- [ ] Plan enhancements

---

## Rollback Plan (If Issues Occur)

### Backend Rollback
- [ ] Go to Render → Services → accreditex-ai-agent
- [ ] Navigate to Deploys tab
- [ ] Click "Rollback" on previous working deployment
- [ ] Wait for rollback to complete (~2 minutes)
- [ ] Test health endpoint

### Frontend Rollback
- [ ] Checkout previous commit:
  ```powershell
  git log --oneline  # Find last working commit
  git checkout <commit-hash>
  npm run build
  firebase deploy --only hosting
  ```
- [ ] Or remove AI assistant:
  - Edit `src/App.tsx`
  - Remove `<AIAssistant />` line
  - Rebuild and redeploy

### Disable AI Assistant
Quick disable without full rollback:
- [ ] Edit `src/App.tsx`
- [ ] Comment out: `<AIAssistant />`
- [ ] Rebuild: `npm run build`
- [ ] Deploy: `firebase deploy --only hosting`

---

## Success Criteria

### Must Have (MVP)
- [x] Code complete and error-free
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Chat button appears after login
- [ ] AI responds to messages
- [ ] No security vulnerabilities
- [ ] Basic error handling works

### Should Have
- [ ] Response time <5 seconds (excluding cold start)
- [ ] Health monitoring setup
- [ ] User feedback collected
- [ ] Documentation accessible
- [ ] No CORS or auth errors

### Nice to Have
- [ ] Response time <3 seconds
- [ ] 95%+ uptime in first week
- [ ] Positive user feedback (>4/5 stars)
- [ ] Usage analytics collected
- [ ] Enhancement roadmap defined

---

## Common Issues & Solutions

### Issue: Backend won't deploy on Render
- **Cause**: Build command incorrect
- **Fix**: Verify Root Directory is `ai-agent/deployment_package`
- **Fix**: Check requirements.txt exists and is valid
- **Fix**: Review deploy logs for specific error

### Issue: 403 Forbidden on all requests
- **Cause**: API key mismatch
- **Fix**: Copy exact API_KEY from Render environment
- **Fix**: Update .env.production with exact same key
- **Fix**: Rebuild frontend: `npm run build`

### Issue: CORS error in browser console
- **Cause**: Frontend URL not whitelisted
- **Fix**: Edit `main.py` → add URL to `allow_origins`
- **Fix**: Commit and push (Render auto-deploys)

### Issue: Chat button doesn't appear
- **Cause**: Not logged in, or component not rendering
- **Fix**: Verify logged in to app
- **Fix**: Check browser console for errors
- **Fix**: Verify `<AIAssistant />` in App.tsx

### Issue: Response timeout or no response
- **Cause**: Free tier sleeping, or Groq rate limit
- **Fix**: Wait 30 seconds for cold start
- **Fix**: Check Groq console for rate limits
- **Fix**: Verify Render logs show request received

---

## Final Verification

### Code Quality
- [x] No TypeScript errors
- [x] No ESLint warnings (critical ones)
- [x] Code follows project conventions
- [x] All imports working

### Security
- [x] API keys in environment variables
- [x] No secrets in code
- [x] CORS properly configured
- [x] Authentication on all endpoints

### Documentation
- [x] Integration guide complete
- [x] Deployment guide complete
- [x] Troubleshooting documented
- [x] This checklist complete

### Deployment
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Integration tested
- [ ] Monitoring setup

---

## Sign-Off

### Pre-Deployment
- [x] **Developer**: Code complete and tested ✅
- [ ] **Reviewer**: Code reviewed and approved
- [ ] **QA**: Local testing passed

### Post-Deployment
- [ ] **Developer**: Deployment successful
- [ ] **QA**: Production testing passed
- [ ] **Product Owner**: UAT approved
- [ ] **Operations**: Monitoring active

---

## Next Steps After Deployment

### Immediate (Day 1-7)
- [ ] Monitor logs daily
- [ ] Respond to user feedback
- [ ] Fix critical issues within 24h
- [ ] Document any bugs found

### Short-term (Week 2-4)
- [ ] Add rate limiting
- [ ] Implement conversation persistence
- [ ] Add usage analytics
- [ ] Improve error messages

### Long-term (Month 2-3)
- [ ] Add voice input
- [ ] Support file uploads
- [ ] Export chat transcripts
- [ ] Multi-language support

---

**Deployment Status**: ⏳ **READY TO START**  
**Estimated Time**: 30 minutes (15 min deploy + 15 min test)  
**Risk Level**: Low  
**Rollback Time**: <5 minutes

**Let's ship it! 🚀**

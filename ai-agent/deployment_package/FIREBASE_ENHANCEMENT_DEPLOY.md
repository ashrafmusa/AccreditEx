# 🚀 Firebase Integration Deployment Guide

## What's Enhanced

Your AI agent now has **direct Firebase database access** for:
- ✅ User-specific project data
- ✅ Department information and team context
- ✅ Recent document access history
- ✅ Workspace-wide analytics
- ✅ Project insights with compliance statistics
- ✅ AI-powered document search
- ✅ Training status with recommendations

## Files Added/Modified

### ✅ New Files
- `firebase_client.py` - Comprehensive Firebase client with specialized methods

### ✅ Enhanced Files
- `unified_accreditex_agent.py` - Now uses firebase_client for rich context
- `main.py` - Added 5 new API endpoints
- `requirements.txt` - Updated firebase-admin to >=6.5.0

## 🔑 Prerequisites

### 1. Firebase Service Account Key

You need to add your Firebase service account key to Render:

1. Download service account key:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: **accreditex-79c08**
   - Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

2. Add to Render:
   - Go to your Render dashboard
   - Select your AI agent service
   - Environment → Secret Files
   - Add new file: `serviceAccountKey.json`
   - Paste the entire JSON content

### 2. Environment Variable

Add this environment variable in Render:

```
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
```

## 📦 Deployment Steps

### Option 1: Git Push (Recommended)

```bash
# Navigate to deployment package
cd d:\_Projects\accreditex\ai-agent\deployment_package

# Stage the changes
git add firebase_client.py
git add unified_accreditex_agent.py
git add main.py
git add requirements.txt

# Commit
git commit -m "feat: Add Firebase integration for data-aware AI

- Integrated comprehensive Firebase client
- Enhanced agent with user/project context
- Added 5 new API endpoints for insights/analytics
- Updated dependencies"

# Push to main branch (triggers Render auto-deploy)
git push origin main
```

### Option 2: Manual Deploy via Render Dashboard

1. Go to Render dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

## ✅ Verify Deployment

### 1. Check Health Endpoint

```bash
curl https://accreditex.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "agent_initialized": true,
  "timestamp": "2024-12-14T...",
  "version": "2.1.0"
}
```

### 2. Check Root Endpoint

```bash
curl https://accreditex.onrender.com/
```

Should show new features:
```json
{
  "version": "2.1.0",
  "new_endpoints": [
    "POST /api/ai/insights",
    "GET /api/ai/search",
    ...
  ]
}
```

### 3. Test Enhanced Chat

```bash
curl -X POST https://accreditex.onrender.com/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my active projects?",
    "context": {
      "user_id": "YOUR_USER_ID"
    }
  }'
```

AI should now respond with **actual project names** from your Firebase!

## 🆕 New API Endpoints

### 1. Project Insights
```bash
POST /api/ai/insights
Body: {
  "project_id": "proj123",
  "user_id": "user123"
}
```

Returns AI analysis of project with:
- Top 3 priorities
- Risk assessment
- Next actions
- Timeline concerns

### 2. AI Document Search
```bash
GET /api/ai/search?query=infection+control&user_id=user123
```

Returns documents with AI relevance ranking and explanations.

### 3. User Context (Debug)
```bash
GET /api/ai/context/user123
```

Returns comprehensive user context:
- Assigned projects
- Department info
- Recent documents
- Permissions

### 4. Workspace Analytics
```bash
GET /api/ai/analytics
```

Returns workspace statistics:
- Total/active projects
- Risk counts
- Department totals

### 5. Training Status with AI
```bash
GET /api/ai/training/user123
```

Returns training completion with AI recommendations.

## 🔄 Frontend Integration

Update your frontend `aiAgentService.ts` to pass user_id:

```typescript
// In src/services/aiAgentService.ts

private getContext(): any {
  const { currentUser } = useUserStore.getState();
  // ... existing context ...
  
  return {
    user_id: currentUser?.id,  // ADD THIS - critical for Firebase context
    user_role: currentUser?.role,
    page_title: document.title,
    route: window.location.pathname,
    current_data: { /* ... */ }
  };
}
```

## 📊 What Users Will Notice

### Before Firebase Integration:
```
User: "What projects am I working on?"
AI: "I don't have access to your specific projects. Please check your dashboard."
```

### After Firebase Integration:
```
User: "What projects am I working on?"
AI: "You're currently leading 3 active projects:

## Your Projects

### 1. OHAS Verification 2024
- Status: In Progress
- Progress: 78%
- 23/30 standards compliant
- **Action needed**: 2 open CAPAs

### 2. JCI Accreditation Prep  
- Status: In Progress
- Progress: 45%
- **Critical**: Emergency response documentation gap
- Mock survey next week

### 3. ISO 9001 Renewal
- Status: In Progress  
- Progress: 92%
- Nearly ready for final audit

Would you like detailed insights on any project?"
```

## 🐛 Troubleshooting

### "Firebase not initialized"

**Cause**: Service account key not found

**Fix**:
1. Verify `serviceAccountKey.json` exists in Render Secret Files
2. Check `FIREBASE_CREDENTIALS_PATH` environment variable
3. Restart service

### "Agent not providing context"

**Cause**: `user_id` not being passed from frontend

**Fix**:
1. Check frontend `aiAgentService.ts` includes `user_id` in context
2. Verify user is logged in
3. Check browser console for errors

### "Permission denied" errors

**Cause**: Firestore security rules blocking access

**Fix**:
1. Service account has admin access (should work automatically)
2. Check Firestore rules allow admin SDK access
3. Verify service account has correct permissions in Firebase Console

## 📈 Performance Monitoring

After deployment, monitor:

1. **Response Times**: Should be <2s for chat with context
2. **Firebase Reads**: Check quota usage (50K/day on free tier)
3. **Error Rates**: Monitor Render logs for exceptions
4. **Context Quality**: Test AI responses reference actual data

## 🎉 Success Indicators

✅ AI references user's actual project names  
✅ AI knows user's department and role  
✅ AI suggests actions based on recent documents  
✅ Project insights show real compliance statistics  
✅ Document search returns relevant results with explanations  

## 📞 Support

If issues persist:
1. Check Render logs: Dashboard → Logs tab
2. Test Firebase connection directly
3. Verify API key is set correctly
4. Check all environment variables

---

**Next Steps After Deployment**:
1. Test enhanced chat with real users
2. Monitor Firebase quota usage
3. Gather feedback on AI response quality
4. Consider adding caching for performance

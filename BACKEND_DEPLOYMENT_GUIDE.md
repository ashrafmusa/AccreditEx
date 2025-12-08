# 🚀 Backend Deployment Guide - Render.com

## ✅ Fixed Issues

1. **Fixed `agent.agent` AttributeError** 
   - Changed `agent.agent` → `agent` (UnifiedAccreditexAgent doesn't have nested agent)
   
2. **Fixed Firebase Credentials**
   - Added support for environment variable `FIREBASE_CREDENTIALS_JSON`
   - Falls back to default credentials if env var not set

## 📝 Deployment Steps

### Step 1: Add Firebase Credentials to Render.com

You need to add your Firebase service account credentials as an environment variable:

1. **Get your Firebase credentials:**
   ```powershell
   # If you have serviceAccountKey.json locally:
   Get-Content serviceAccountKey.json | Set-Clipboard
   # This copies the entire JSON to clipboard
   ```

2. **Add to Render.com:**
   - Go to https://dashboard.render.com
   - Select your `accreditex` service
   - Click **Environment** in the left sidebar
   - Click **Add Environment Variable**
   - Key: `FIREBASE_CREDENTIALS_JSON`
   - Value: Paste the entire JSON content from serviceAccountKey.json
   - Click **Save Changes**

### Step 2: Commit and Push Changes

```powershell
cd D:\_Projects\accreditex

# Check what changed
git status

# Add the backend fix
git add ai-agent/deployment_package/main.py

# Commit
git commit -m "Fix backend: Remove agent.agent check and add Firebase credentials support"

# Push to GitHub
git push origin main
```

### Step 3: Deploy on Render.com

Render will auto-deploy when it detects the push, or manually:

1. Go to https://dashboard.render.com
2. Select your service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait 2-3 minutes for deployment

### Step 4: Verify Deployment

```powershell
# Check health endpoint
curl https://accreditex.onrender.com/health

# Should return:
# {"status":"healthy","agent_initialized":true,"timestamp":"...","version":"2.0.0"}
```

## 🔐 Getting Firebase Service Account Key

If you don't have `serviceAccountKey.json`:

1. Go to https://console.firebase.google.com/project/accreditex-79c08/settings/serviceaccounts
2. Click **Generate New Private Key**
3. Download the JSON file
4. Save it as `serviceAccountKey.json` (DON'T commit to Git!)

## 🌍 Environment Variables Needed on Render.com

| Variable | Value | Required |
|----------|-------|----------|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes |
| `FIREBASE_CREDENTIALS_JSON` | Full JSON from serviceAccountKey.json | ✅ Yes |
| `PORT` | 10000 | Auto-set by Render |

## 📂 Current Deployment Config

- **Repository:** https://github.com/ashrafmusa/AccreditEx
- **Branch:** main
- **Root Directory:** `ai-agent/deployment_package`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python main.py`

## 🧪 Testing After Deployment

1. **Test Health:**
   ```powershell
   curl https://accreditex.onrender.com/health
   ```

2. **Test Chat:**
   ```powershell
   curl -X POST https://accreditex.onrender.com/chat `
     -H "Content-Type: application/json" `
     -d '{"message":"Hello", "thread_id":"test-123"}'
   ```

3. **Test in Frontend:**
   - Run `npm run dev`
   - Generate a compliance report
   - Should now work without CORS or 500 errors!

## 🐛 Troubleshooting

### Error: "Agent not initialized"
- Check Render logs: `GROQ_API_KEY` is set correctly
- Verify startup logs show: "✅ Agent initialized using model: llama3-70b-8192"

### Error: "Firebase credentials not found"
- Verify `FIREBASE_CREDENTIALS_JSON` environment variable is set
- Check JSON is valid (use jsonlint.com)
- Make sure no extra quotes or escaping

### Error: "Permission denied" on Firebase
- Service account needs these roles:
  - Firebase Admin SDK Administrator Service Agent
  - Storage Admin (for bucket access)

### Still getting 500 errors?
- Check Render logs for detailed error messages
- Verify all dependencies in requirements.txt are installed
- Check if Render is using Python 3.11+ (required for some packages)

## ✨ Expected Behavior After Fix

✅ AI chat endpoint works without 500 errors  
✅ Report upload succeeds (no CORS)  
✅ PDF saves to Firebase Storage  
✅ Auto-download works in frontend  
✅ Documents appear in Document Control  

---

**Next:** Commit, push, wait for deployment, then test! 🎉

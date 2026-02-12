# Deployment Pre-flight Checklist

## ✅ Pre-Deployment Checklist

### 1. Local Testing
- [ ] All tests passing locally
- [ ] Server runs without errors
- [ ] API documentation accessible
- [ ] Metrics endpoint working

### 2. Environment Variables Ready
- [ ] GROQ_API_KEY obtained from console.groq.com
- [ ] API_KEY generated (secure random string)
- [ ] Firebase credentials available

### 3. Code Review
- [ ] All enhancements committed
- [ ] No sensitive data in code
- [ ] Requirements.txt updated
- [ ] Documentation complete

### 4. Deployment Files
- [ ] Procfile exists
- [ ] runtime.txt exists
- [ ] render.yaml exists
- [ ] requirements.txt complete

---

## 🚀 Deployment Steps

### Step 1: Run Local Tests
```bash
cd ai-agent/deployment_package

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest -v --cov=. --cov-report=term

# Expected: All tests passing
```

### Step 2: Test Server Locally
```bash
# Set environment variables (Windows PowerShell)
$env:GROQ_API_KEY="your-groq-api-key"
$env:API_KEY="dev-key-change-in-production"
$env:FIREBASE_CREDENTIALS_PATH="serviceAccountKey.json"

# Start server
python main.py

# Server should start on http://localhost:8000
```

### Step 3: Verify Endpoints
Open another terminal and test:
```bash
# Health check
curl http://localhost:8000/health

# Documentation
# Open browser: http://localhost:8000/docs

# Metrics
curl http://localhost:8000/metrics

# Chat (requires API key)
curl -X POST http://localhost:8000/chat \
  -H "X-API-Key: dev-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help?"}'
```

### Step 4: Prepare for Render.com Deployment

#### 4.1 Get Groq API Key
1. Go to https://console.groq.com
2. Sign up/Login
3. Navigate to API Keys
4. Create new API key
5. Copy and save securely

#### 4.2 Generate Secure API Key
```powershell
# Generate random API key (PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### 4.3 Prepare Firebase Credentials
You have two options:

**Option A: Upload Service Account File** (Recommended for testing)
- Keep `serviceAccountKey.json` in deployment_package
- Render will use it during deployment

**Option B: Use Environment Variable** (Recommended for production)
```powershell
# Convert serviceAccountKey.json to single-line JSON
$json = Get-Content serviceAccountKey.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
Write-Output $json
# Copy output and set as FIREBASE_CREDENTIALS_JSON env var in Render
```

### Step 5: Deploy to Render.com

#### 5.1 Connect Repository
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select `accreditex` repository

#### 5.2 Configure Service
- **Name:** `accreditex-ai-agent`
- **Region:** Choose closest to your users
- **Branch:** `main` (or your branch)
- **Root Directory:** `ai-agent/deployment_package`
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python main.py`

#### 5.3 Set Environment Variables
In Render dashboard, add:

| Key | Value | Notes |
|-----|-------|-------|
| `GROQ_API_KEY` | `your-groq-api-key` | From console.groq.com |
| `API_KEY` | `your-secure-random-key` | Generated in Step 4.2 |
| `FIREBASE_CREDENTIALS_PATH` | `serviceAccountKey.json` | Or use Option B |
| `PORT` | `10000` | Render default |
| `PYTHON_VERSION` | `3.11` | Match runtime.txt |

**If using Option B for Firebase:**
| Key | Value |
|-----|-------|
| `FIREBASE_CREDENTIALS_JSON` | Single-line JSON from Step 4.3 |

#### 5.4 Deploy
1. Click "Create Web Service"
2. Wait for build to complete (~3-5 minutes)
3. Monitor logs for errors

### Step 6: Verify Deployment

Once deployed, your service will be at:
```
https://accreditex-ai-agent.onrender.com
```

Test the endpoints:
```bash
# Health check
curl https://accreditex-ai-agent.onrender.com/health

# Documentation
# Open: https://accreditex-ai-agent.onrender.com/docs

# Metrics
curl https://accreditex-ai-agent.onrender.com/metrics

# Chat endpoint
curl -X POST https://accreditex-ai-agent.onrender.com/chat \
  -H "X-API-Key: your-secure-api-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test deployment"}'
```

### Step 7: Update Frontend Configuration

Update your React app's environment variables:

**File:** `d:\_Projects\accreditex\.env` (or `.env.production`)
```bash
VITE_AI_AGENT_URL=https://accreditex-ai-agent.onrender.com
VITE_AI_AGENT_API_KEY=your-secure-api-key
```

**Note:** Both frontend and backend must use the **same API_KEY**!

---

## 🔍 Troubleshooting

### Build Fails
**Check:**
- Requirements.txt is valid
- Python version matches runtime.txt
- All dependencies are available on PyPI

### Service Crashes
**Check logs for:**
- Missing environment variables
- Firebase credentials issues
- Port binding errors

### API Key Errors
**Verify:**
- API_KEY matches between frontend and backend
- X-API-Key header is being sent
- No typos in environment variables

### Firebase Connection Issues
**Check:**
- Service account JSON is valid
- Firebase project ID is correct
- Firestore database exists

### Slow Response Times
**Monitor:**
- Check /metrics endpoint
- Review cache hit rates
- Monitor Groq API latency

---

## 📊 Post-Deployment Monitoring

### 1. Check Health Regularly
```bash
curl https://accreditex-ai-agent.onrender.com/health
```

### 2. Monitor Metrics
```bash
curl https://accreditex-ai-agent.onrender.com/metrics
```

Look for:
- High error rates
- Slow response times
- Low cache hit rates
- Groq API issues

### 3. Review Logs
In Render dashboard:
- Go to your service
- Click "Logs" tab
- Monitor for errors or warnings

### 4. Set Up Alerts (Optional)
In Render dashboard, configure:
- Health check alerts
- Deployment failure notifications
- Resource usage alerts

---

## 🔐 Security Best Practices

1. **Never commit credentials** to repository
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Enable HTTPS only** (Render does this automatically)
5. **Monitor API usage** to detect abuse
6. **Set up rate limiting** (future enhancement)

---

## 🎯 Success Criteria

✅ Service is running and healthy
✅ All endpoints responding correctly
✅ API documentation accessible
✅ Tests passing
✅ Metrics being collected
✅ Frontend can connect successfully
✅ No errors in logs

---

## 📞 Need Help?

- **Render Docs:** https://render.com/docs
- **Groq Docs:** https://console.groq.com/docs
- **Firebase Docs:** https://firebase.google.com/docs

---

**Ready to Deploy?** Follow the steps above in order! 🚀

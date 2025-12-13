# 🎯 Firebase Integration Quick Reference

## What Changed

### Before
- AI had basic context (role, page)
- Manual data passing from frontend
- Generic responses

### After  
- AI has **direct Firebase access**
- Automatic user/project context
- **Personalized, data-driven responses**

## Key Files Modified

| File | Changes | Impact |
|------|---------|--------|
| `firebase_client.py` | ✅ NEW | Firebase data access layer |
| `unified_accreditex_agent.py` | 🔄 Enhanced | Uses firebase_client for context |
| `main.py` | 🔄 Enhanced | +5 new API endpoints |
| `requirements.txt` | 🔄 Updated | firebase-admin >=6.5.0 |

## New Capabilities

### 1. Context-Aware Chat
```python
# Agent now automatically knows:
- User's assigned projects (by name, status, progress)
- Department (name, head, team size)
- Recent documents (last 10)
- User permissions
- Workspace totals
```

### 2. Project Insights
```python
POST /api/ai/insights
→ AI analysis of compliance rates, CAPAs, risks
```

### 3. AI Document Search
```python
GET /api/ai/search?query=...
→ Ranked results with relevance explanations
```

### 4. Training Recommendations
```python
GET /api/ai/training/{user_id}
→ Completion status + AI-powered recommendations
```

## Deployment Checklist

- [ ] Add `serviceAccountKey.json` to Render Secret Files
- [ ] Set `FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json`
- [ ] Push code to main branch
- [ ] Verify `/health` shows "healthy"
- [ ] Test chat with `user_id` in context
- [ ] Confirm AI references actual project names

## Testing Commands

### Health Check
```bash
curl https://accreditex.onrender.com/health
```

### Test Enhanced Chat
```bash
curl -X POST https://accreditex.onrender.com/chat \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "What projects am I working on?", "context": {"user_id": "USER_ID"}}'
```

### Get User Context (Debug)
```bash
curl https://accreditex.onrender.com/api/ai/context/USER_ID \
  -H "X-API-Key: YOUR_KEY"
```

## Frontend Update Required

Add `user_id` to context in `aiAgentService.ts`:

```typescript
private getContext(): any {
  const { currentUser } = useUserStore.getState();
  
  return {
    user_id: currentUser?.id,  // ⭐ ADD THIS
    // ... rest of context
  };
}
```

## Success Metrics

### Before
> "I don't have access to your projects."

### After
> "You're working on **OHAS Verification 2024** (78% complete), **JCI Prep** (45% complete), and **ISO 9001 Renewal** (92% complete)."

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase not initialized" | Add service account key to Render |
| "Agent not providing context" | Pass `user_id` from frontend |
| "Permission denied" | Service account has admin access (automatic) |

## Environment Variables

```env
# Required
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
GROQ_API_KEY=your_groq_key
API_KEY=your_api_key

# Optional (for Anthropic instead of Groq)
OPENAI_API_KEY=your_openai_key
```

## Quick Deploy

```bash
cd ai-agent/deployment_package
git add .
git commit -m "feat: Firebase integration"
git push origin main
```

Render auto-deploys in ~2 minutes.

---

**Questions?** See [FIREBASE_ENHANCEMENT_DEPLOY.md](FIREBASE_ENHANCEMENT_DEPLOY.md) for full guide.

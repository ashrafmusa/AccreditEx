# AI Agent Backend Integration with Firebase

This directory contains the backend code to make your AI Agent **fully database-aware** with direct Firebase Firestore access.

## 📋 What This Provides

- **Direct Firebase Access**: AI can query Firestore collections in real-time
- **Comprehensive Context**: User data, projects, documents, departments, analytics
- **Smart Search**: AI-powered document search with relevance ranking
- **Project Insights**: Automated compliance analysis and recommendations
- **Proactive Assistance**: AI knows your workspace without manual data passing

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install firebase-admin anthropic python-dotenv
```

### 2. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (accreditex-79c08)
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save as `serviceAccountKey.json` in this directory

### 3. Set Environment Variables

Create `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Test Firebase Connection

```bash
python test_firebase_connection.py
```

## 📁 Files Overview

### `firebase_client.py`
Firebase Admin SDK client for database access.

**Key Methods:**
- `get_user_context(user_id)` - User data + projects + department + documents
- `get_project_details(project_id)` - Project stats, compliance rates, CAPAs
- `get_workspace_analytics()` - Workspace-wide statistics
- `search_documents(query)` - Full-text document search
- `get_user_training_status(user_id)` - Training completion tracking

### `enhanced_agent.py`
AI Agent with Firebase integration.

**Key Methods:**
- `chat(message, user_id)` - Context-aware chat with Firebase data
- `get_project_insights(project_id)` - AI-generated project analysis
- `search_compliance_documents(query, user_id)` - AI-ranked search results

### `api_routes.py`
FastAPI endpoints to integrate with your frontend.

**Endpoints:**
- `POST /api/ai/chat` - Enhanced chat with Firebase context
- `GET /api/ai/insights/{project_id}` - Project insights
- `GET /api/ai/search` - Smart document search

## 🔌 Integration Steps

### Option A: Deploy to Existing Backend (Render)

Your backend is already at `https://accreditex.onrender.com`.

1. Add these files to your backend repository
2. Update `requirements.txt`:
   ```
   firebase-admin>=6.5.0
   anthropic>=0.25.0
   ```
3. Add service account key as environment variable in Render:
   - Go to Render dashboard → Your service
   - Environment → Add Secret File
   - Upload `serviceAccountKey.json`
4. Deploy:
   ```bash
   git add backend-integration/
   git commit -m "Add Firebase integration to AI agent"
   git push
   ```

### Option B: Test Locally First

1. Install dependencies (see Quick Start)
2. Run test server:
   ```bash
   python api_routes.py
   ```
3. Test endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What are my active projects?", "user_id": "YOUR_USER_ID"}'
   ```

## 🎯 Update Frontend to Use Enhanced Backend

Replace `aiAgentService.ts` chat method to call backend:

```typescript
// In src/services/aiAgentService.ts

async chat(message: string, streaming = true): Promise<AsyncIterable<string> | string> {
  const user = useUserStore.getState().currentUser;
  const context = this.getContext();
  
  // Call enhanced backend instead of direct Anthropic
  const response = await fetch('https://accreditex.onrender.com/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      user_id: user?.id,
      context,
      stream: streaming
    })
  });
  
  if (streaming) {
    return this.handleStreamingResponse(response);
  } else {
    const data = await response.json();
    return data.response;
  }
}
```

## 📊 What AI Can Now Do

### Before (Limited Context)
```
User: "What are my active projects?"
AI: "I don't have access to your project data. Please check your dashboard."
```

### After (Firebase-Aware)
```
User: "What are my active projects?"
AI: "You're currently leading 3 active projects:

1. **OHAS Verification 2024** - 78% complete, In Progress
   - 23/30 standards compliant
   - 2 open CAPAs need attention
   
2. **JCI Accreditation Prep** - 45% complete, In Progress
   - Critical finding: Emergency response documentation
   - Mock survey scheduled next week
   
3. **ISO 9001 Renewal** - 92% complete, In Progress
   - Nearly ready for final audit
   - 1 remaining document approval

Would you like detailed insights on any of these projects?"
```

## 🔐 Security Considerations

1. **Service Account Security**:
   - Never commit `serviceAccountKey.json` to git
   - Add to `.gitignore`
   - Use environment variables in production

2. **Access Control**:
   - Firebase client respects Firestore security rules
   - Always pass `user_id` to verify access rights
   - Don't expose admin endpoints publicly

3. **API Rate Limits**:
   - Firebase has quota limits (50K reads/day on free tier)
   - Cache frequently accessed data
   - Implement request rate limiting

## 🧪 Testing

Run comprehensive tests:

```bash
python test_firebase_connection.py
python test_enhanced_agent.py
```

Expected output:
```
✅ Firebase connection successful
✅ User context retrieved: John Doe (Admin)
✅ Found 3 assigned projects
✅ Department: Quality Assurance (5 members)
✅ Recent documents: 7 items
✅ AI response generated successfully
```

## 📈 Performance Optimization

1. **Caching**: Cache user context for 5 minutes
2. **Lazy Loading**: Only fetch data when needed
3. **Batch Queries**: Use Firebase batch reads
4. **Indexed Queries**: Ensure Firestore indexes exist

## 🆘 Troubleshooting

### "Firebase Admin SDK not initialized"
- Check `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable
- Verify service account JSON file exists
- Ensure file has correct permissions

### "Permission denied" errors
- Check Firestore security rules
- Verify user has access to requested collections
- Test with Firebase Console first

### "AI responses don't include context"
- Verify `user_id` is being passed correctly
- Check Firebase client returns data (not empty)
- Inspect `_build_enhanced_context` output

## 📚 Next Steps

1. ✅ Deploy backend integration
2. Update frontend to call enhanced endpoints
3. Add caching layer for performance
4. Implement analytics tracking
5. Add more specialized AI methods (risk analysis, audit prep, etc.)

## 🎉 Benefits Summary

- **10x More Context**: AI sees everything in your workspace
- **Personalized**: Recommendations based on YOUR projects
- **Proactive**: AI suggests actions before you ask
- **Role-Aware**: Respects permissions and access control
- **Real-Time**: Always up-to-date with latest Firestore data

---

**Need Help?** Check the test files or contact the development team.

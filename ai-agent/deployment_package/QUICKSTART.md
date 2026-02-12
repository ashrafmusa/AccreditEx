# Quick Start Guide - Enhanced AI Agent

## 🚀 Local Development

### 1. Install Dependencies
```bash
cd ai-agent/deployment_package
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
# Create .env file
GROQ_API_KEY=your-groq-api-key
API_KEY=dev-key-change-in-production
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
```

### 3. Run Tests
```bash
# Run all tests
pytest -v

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific tests
pytest -v -m unit  # Unit tests only
pytest -v -m integration  # Integration tests only
```

### 4. Start Server
```bash
python main.py
# Server runs on http://localhost:8000
```

### 5. View Documentation
Open browser: http://localhost:8000/docs

### 6. Test Chat Endpoint
```bash
curl -X POST http://localhost:8000/chat \
  -H "X-API-Key: dev-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I prepare for ISO 9001 audit?",
    "context": {
      "user_role": "Quality Manager"
    }
  }'
```

### 7. Check Metrics
```bash
curl http://localhost:8000/metrics
```

---

## 📊 Monitoring in Development

### View Logs
Logs are structured JSON for easy parsing:
```bash
# All logs go to console
python main.py | jq .
```

### Check Cache Performance
```python
from cache import cache
print(cache.get_stats())
```

### Monitor Performance
```python
from monitoring import performance_monitor
print(performance_monitor.get_metrics_summary())
```

---

## 🧪 Testing Tips

### Run Tests in Watch Mode
```bash
pip install pytest-watch
ptw
```

### Debug a Failing Test
```bash
pytest -v -s test_unified_agent.py::TestUnifiedAccreditexAgent::test_chat_creates_new_thread
```

### Generate Coverage Badge
```bash
pytest --cov=. --cov-report=term --cov-report=html
# View htmlcov/index.html
```

---

## 🔧 Common Issues

### Issue: Firebase credentials not found
**Solution:** Copy serviceAccountKey.json to deployment_package folder

### Issue: Groq API key invalid
**Solution:** Get free API key from https://console.groq.com

### Issue: Tests failing
**Solution:** Ensure all dependencies installed: `pip install -r requirements.txt`

### Issue: Import errors
**Solution:** Add deployment_package to Python path or run from that directory

---

## 📖 Learn More

- Full documentation: `ENHANCEMENTS_SUMMARY.md`
- API docs: http://localhost:8000/docs
- Test files: `tests/` directory

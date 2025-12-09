# API KEY ROTATION GUIDE
**CRITICAL PRIORITY - Complete Immediately**

## 🚨 EXPOSED KEYS FOUND

The following API keys are exposed in `.env.example` and must be rotated:

```
VITE_API_KEY=AIzaSyBPkTWdojLlQBG7E9OPWCXPZ_Zzg31YrLg
VITE_GEMINI_API_KEY=AIzaSyBMs719-RKz9qIa4W7aEAUb_9PCZ3H_pcA
VITE_PROJECT_ID=accreditex-79c08
```

---

## STEP 1: ROTATE FIREBASE API KEY

### Firebase Console:
1. Go to: https://console.firebase.google.com/project/accreditex-79c08/settings/general
2. Navigate to "Web apps" section
3. Click on your web app
4. Click "Regenerate API Key" or delete the current app and create a new one
5. Copy the new API key

### Update Your Project:
```powershell
# Create a new .env file (if it doesn't exist)
Copy-Item .env.example .env

# Edit .env with your new Firebase key
# NEVER commit this file to Git
```

---

## STEP 2: ROTATE GEMINI API KEY

### Google AI Studio:
1. Go to: https://makersuite.google.com/app/apikey
2. Find the exposed key: `AIzaSyBMs719-RKz9qIa4W7aEAUb_9PCZ3H_pcA`
3. Click "Delete" to revoke it
4. Click "Create API Key" to generate a new one
5. Copy the new API key

### Update Your Project:
```env
# In your .env file
VITE_GEMINI_API_KEY=your_new_gemini_key_here
```

---

## STEP 3: UPDATE .env.example WITH PLACEHOLDERS

Replace real keys with placeholders:

```env
# .env.example (Safe for Git)
VITE_API_KEY=your_firebase_api_key_here
VITE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_HIS_WEBHOOK_URL=https://your-his-system.com/webhook
```

---

## STEP 4: VERIFY .gitignore

Ensure `.env` is in `.gitignore`:

```powershell
# Check if .env is ignored
Get-Content .gitignore | Select-String -Pattern "^\.env$"

# If not found, add it:
Add-Content .gitignore "`n# Environment variables`n.env"
```

---

## STEP 5: CHECK GIT HISTORY (IMPORTANT!)

The exposed keys may already be in Git history:

```powershell
# Search Git history for exposed keys
git log -S "AIzaSyBPkTWdojLlQBG7E9OPWCXPZ_Zzg31YrLg" --all
git log -S "AIzaSyBMs719-RKz9qIa4W7aEAUb_9PCZ3H_pcA" --all

# If found, you must purge the history or rotate the keys
# Recommended: Just rotate the keys (already in Step 1 & 2)
```

---

## STEP 6: UPDATE FIREBASE SECURITY RULES

Deploy the enhanced security rules:

```powershell
# Deploy updated firestore.rules
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules get
```

---

## VERIFICATION CHECKLIST

After completing all steps:

- [ ] Firebase API key rotated in Firebase Console
- [ ] Gemini API key rotated in Google AI Studio
- [ ] New keys added to `.env` (NOT .env.example)
- [ ] `.env.example` updated with placeholders only
- [ ] `.env` is in `.gitignore`
- [ ] Git history checked for exposed keys
- [ ] Firestore rules deployed
- [ ] Application tested with new keys
- [ ] Old keys confirmed revoked

---

## TESTING

Test your application with the new keys:

```powershell
# Start the dev server
npm run dev

# Test Firebase authentication
# Test Firestore database access
# Test Gemini AI features
```

If you encounter any errors:
1. Verify the new API keys are correct
2. Check Firebase Console for any restrictions
3. Ensure Firestore rules are deployed
4. Clear browser cache and reload

---

## ESTIMATED TIME: 1-2 hours

**Priority**: CRITICAL - Complete this immediately before proceeding with other tasks.

**Note**: Once keys are rotated, the old exposed keys will be invalid, preventing unauthorized access to your Firebase and Gemini AI services.

#!/bin/bash
# Firebase Storage Rules Deployment Script
# This script deploys the necessary Firebase Storage rules for document uploads

echo "🚀 Deploying Firebase Storage Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase."
    echo "Login with: firebase login"
    exit 1
fi

echo "📝 Deploying Storage Rules..."
firebase deploy --only storage

echo ""
echo "✅ Storage rules deployed successfully!"
echo ""
echo "Your Firebase Storage is now configured for:"
echo "  ✓ Program Documents - accessible to all authenticated users"
echo "  ✓ Standard Documents - accessible to all authenticated users"
echo "  ✓ User Documents - accessible by owner and admins"
echo "  ✓ Project Documents - accessible to project members"
echo ""
echo "📌 Next steps:"
echo "  1. Verify the rules are deployed in Firebase Console"
echo "  2. Try uploading a document through the app"
echo "  3. Check that downloads work for all users"
echo ""

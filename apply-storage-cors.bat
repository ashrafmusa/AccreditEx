@echo off
echo ============================================
echo Firebase Storage CORS Configuration
echo ============================================
echo.
echo This will configure CORS for Firebase Storage.
echo Please ensure you have Google Cloud SDK installed.
echo.
echo Download from: https://cloud.google.com/sdk/docs/install
echo.
pause

echo.
echo Applying CORS configuration...
gsutil cors set cors.json gs://accreditex-79c08.firebasestorage.app

echo.
echo ============================================
echo CORS Configuration Complete!
echo ============================================
echo.
echo You can now upload files from localhost:3000
echo.
pause

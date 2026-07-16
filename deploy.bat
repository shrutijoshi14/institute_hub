@echo off
echo ===================================================
echo   🚀 INSTITUTE APP ONE-CLICK DEPLOYMENT AUTOMATOR  
echo ===================================================
echo.

:: Check for modifications
git status

echo.
set /p commit_msg="Enter commit message (Press Enter for 'update application code'): "
if "%commit_msg%"=="" set commit_msg=update application code

echo.
echo 📦 Staging and committing changes...
git add .
git commit -m "%commit_msg%"

echo.
echo 📤 Pushing code to GitHub...
git push origin main

echo.
echo 🔄 Triggering Render Build Hooks...

:: ===================================================
:: INSTRUCTION: Replace the placeholder URLs below with
:: your actual Deploy Hook URLs from the Render Dashboard
:: (Render Dashboard -> Service -> Settings -> Deploy Hook)
:: ===================================================

set BACKEND_HOOK=YOUR_BACKEND_DEPLOY_HOOK_URL_HERE
set FRONTEND_HOOK=YOUR_FRONTEND_DEPLOY_HOOK_URL_HERE

if "%BACKEND_HOOK%"=="YOUR_BACKEND_DEPLOY_HOOK_URL_HERE" (
    echo [WARNING] Backend deploy hook is not configured in deploy.bat yet.
) else (
    echo Triggering Backend deployment...
    curl -I "%BACKEND_HOOK%"
)

if "%FRONTEND_HOOK%"=="YOUR_FRONTEND_DEPLOY_HOOK_URL_HERE" (
    echo [WARNING] Frontend deploy hook is not configured in deploy.bat yet.
) else (
    echo Triggering Frontend deployment...
    curl -I "%FRONTEND_HOOK%"
)

echo.
echo ✅ Git push completed and build requests dispatched!
pause

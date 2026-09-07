@echo off
echo ========================================
echo PrimeCare Pharmacy OS - Pure React + Firebase Setup
echo ========================================
echo.

echo Step 1: Installing dependencies (Vite + React + Firebase)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Please check if Node.js is installed correctly
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo Step 2: Checking for .env file...
if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
)
echo Firebase environment configuration is ready!
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Starting development server...
echo   npm run dev
echo.
echo Local URL: http://localhost:3000
echo.
call npm run dev

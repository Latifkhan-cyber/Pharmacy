@echo off
echo ========================================
echo Pharmacy Management System Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
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
    echo WARNING: .env file not found!
    echo Please create .env file from .env.example
    echo.
    echo Copy .env.example to .env and update your database credentials
    pause
    exit /b 1
)
echo .env file found!
echo.

echo Step 3: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo Prisma Client generated successfully!
echo.

echo Step 4: Pushing database schema...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to push database schema
    echo Please check your database connection in .env file
    pause
    exit /b 1
)
echo Database schema created successfully!
echo.

echo Step 5: Seeding sample data...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo WARNING: Failed to seed data (this is optional)
    echo You can continue without sample data
)
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo Default login credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause

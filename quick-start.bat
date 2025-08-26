@echo off
echo 🚀 Fruits E-commerce Store - Quick Start Setup
echo ================================================
echo.

echo 📦 Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Creating .env file...
if not exist .env (
    copy env.example .env
    echo ✅ .env file created from template
    echo ⚠️  Please edit .env file with your credentials
) else (
    echo ✅ .env file already exists
)

echo.
echo 👑 Creating admin user...
node create-admin.js
if %errorlevel% neq 0 (
    echo ❌ Failed to create admin user
    pause
    exit /b 1
)

echo.
echo 🎯 Starting server (Backend + Frontend)...
echo 📡 Application will be available at: http://localhost:5000
echo 👤 Admin login: admin@growwpark.com / admin123
echo.
echo 🌐 Frontend: http://localhost:5000
echo 🔧 Backend API: http://localhost:5000/api
echo 👑 Admin Panel: http://localhost:5000/admin-login.html
echo.
echo Press Ctrl+C to stop the server
echo.
npm start

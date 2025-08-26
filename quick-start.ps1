# 🚀 Fruits E-commerce Store - Quick Start Setup
Write-Host "🚀 Fruits E-commerce Store - Quick Start Setup" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location server

# Install dependencies
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔧 Creating .env file..." -ForegroundColor Yellow

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "👑 Creating admin user..." -ForegroundColor Yellow

# Create admin user
node create-admin.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create admin user" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🎯 Starting server (Backend + Frontend)..." -ForegroundColor Yellow
Write-Host "📡 Application will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "👤 Admin login: admin@growwpark.com / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:5000" -ForegroundColor Green
Write-Host "🔧 Backend API: http://localhost:5000/api" -ForegroundColor Green
Write-Host "👑 Admin Panel: http://localhost:5000/admin-login.html" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start

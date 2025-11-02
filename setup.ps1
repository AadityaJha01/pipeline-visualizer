# Pipeline Visualizer 2.0 Setup Script (PowerShell)

Write-Host "🚀 Setting up Pipeline Visualizer 2.0..." -ForegroundColor Cyan

# Check prerequisites
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Setup backend
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path .env)) {
    Copy-Item env.example .env
    Write-Host "✅ Created .env file. Please edit it with your Jenkins credentials." -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists." -ForegroundColor Blue
}
npm install
Set-Location ..

# Setup frontend
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env with your Jenkins credentials"
Write-Host "2. Run 'npm run dev' to start both frontend and backend"
Write-Host "3. Or use 'docker-compose up' for Docker deployment"


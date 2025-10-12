# Start Invoice Management App Development Server
# This script ensures Node.js is in the PATH and starts the dev server

Write-Host "🚀 Starting Peak Brew Invoice Management App..." -ForegroundColor Cyan
Write-Host ""

# Add Node.js to PATH for this session
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:Path = "$nodePath;" + $env:Path
    Write-Host "✓ Node.js path configured" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found at $nodePath" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verify Node.js is accessible
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot run Node.js" -ForegroundColor Red
    exit 1
}

# Navigate to project directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "✓ In directory: $scriptDir" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Cyan
Write-Host "The app will be available at: http://localhost:5173/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Run the development server
npm run dev

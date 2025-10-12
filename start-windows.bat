@echo off
echo Starting Peak Brew Invoice Management App...
echo.

REM Add Node.js to PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Navigate to script directory
cd /d "%~dp0"

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.
echo Starting development server...
echo The application will be available at http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
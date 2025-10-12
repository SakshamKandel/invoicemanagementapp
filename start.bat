@echo off
REM Quick Start Script for Invoice Management App
REM Sets up Node.js PATH and runs the development server

echo.
echo ========================================
echo  Peak Brew Invoice Management App
echo ========================================
echo.

REM Add Node.js to PATH for this session
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Show Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected
echo.

REM Navigate to the script's directory
cd /d "%~dp0"

echo [INFO] Starting development server...
echo.
echo The app will be available at:
echo   http://localhost:5173/
echo.
echo Press Ctrl+C to stop the server
echo.
echo ----------------------------------------
echo.

REM Run npm dev
npm run dev

REM If npm exits, pause to show any errors
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to start the server
    pause
)

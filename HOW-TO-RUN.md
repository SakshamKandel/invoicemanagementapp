# How to Run the Invoice Management App

## Quick Start (3 Ways)

### Method 1: Using the Batch File (Easiest)
1. Double-click `start.bat` in the `invoice` folder
2. The app will automatically start at http://localhost:5173/

### Method 2: Using PowerShell/Terminal in VS Code
Open terminal in VS Code and run:
```powershell
npm run dev
```

If you get "npm not found" error, run this first:
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run dev
```

### Method 3: Manual Start
1. Open Windows PowerShell
2. Navigate to the invoice folder:
   ```powershell
   cd "C:\VIP\WEB PROD\Invoice Management APp\invoice"
   ```
3. Add Node.js to PATH (for this session only):
   ```powershell
   $env:Path = "C:\Program Files\nodejs;" + $env:Path
   ```
4. Start the server:
   ```powershell
   npm run dev
   ```

## Permanent Solution

To make `npm run dev` work in any terminal without extra steps:

### Add Node.js to Windows PATH Permanently:
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find and select "Path"
5. Click "Edit"
6. Click "New" and add: `C:\Program Files\nodejs`
7. Click "OK" on all windows
8. **Restart VS Code** (or your computer)

After this, you can simply run `npm run dev` from any terminal!

## Troubleshooting

### "npm is not recognized"
- Node.js is not in your PATH
- Use Method 1 (batch file) or add Node.js to PATH permanently

### Port already in use
- Another instance is running
- Check http://localhost:5173/ or http://localhost:5174/
- Or stop the running instance with Ctrl+C

### Changes not showing
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache

## App URLs
- Local: http://localhost:5173/
- Network (other devices): Check terminal output for IP addresses

## Default Login
Check your Firebase console for authentication setup.

## Features
✅ Product Catalog with 8 beer products
✅ Invoice Generation with PDF export
✅ Customer Management
✅ Analytics Dashboard
✅ Firebase Cloud Sync

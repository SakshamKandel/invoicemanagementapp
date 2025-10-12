# ✅ SETUP COMPLETE - How to Run npm run dev

## 🎯 You Now Have 4 Ways to Run the App!

### ✨ Method 1: VS Code Task (EASIEST - RECOMMENDED)
1. Press `Ctrl+Shift+P` in VS Code
2. Type "Run Task"
3. Select "Start Dev Server"
4. Done! Server starts automatically at http://localhost:5173/

OR use the keyboard shortcut: `Ctrl+Shift+B`

### 🚀 Method 2: New Terminal (AUTOMATIC)
1. Open a NEW terminal in VS Code (Terminal → New Terminal)
2. Simply type: `npm run dev`
3. That's it! Node.js PATH is auto-configured

### 📝 Method 3: Batch File (Double-Click)
1. Go to the `invoice` folder
2. Double-click `start.bat`
3. Server starts automatically

### 💻 Method 4: Manual (If PATH not working)
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd "C:\VIP\WEB PROD\Invoice Management APp\invoice"
npm run dev
```

## ⚙️ What Was Configured

### 1. VS Code Settings (`.vscode/settings.json`)
- ✅ Automatically adds Node.js to PATH for new terminals
- ✅ Sets default directory to `invoice` folder

### 2. VS Code Tasks (`.vscode/tasks.json`)
- ✅ "Start Dev Server" task (Ctrl+Shift+B)
- ✅ "Install Dependencies" task

### 3. Quick Start Scripts
- ✅ `start.bat` - Windows batch file
- ✅ `start-dev.ps1` - PowerShell script
- ✅ Updated `start-windows.bat`

### 4. Package.json
- ✅ Added `npm start` alias for `npm run dev`

## 🔄 If It's Still Not Working

### Close and reopen VS Code completely
Node.js PATH settings only take effect in NEW terminals.

### Or Add Node.js to Windows PATH Permanently:
1. Press `Win + X` → System
2. Advanced system settings → Environment Variables
3. System variables → Path → Edit
4. New → Add: `C:\Program Files\nodejs`
5. OK → Restart VS Code

After permanent PATH setup, `npm run dev` works EVERYWHERE!

## 📱 Access Your App

Once running, open your browser to:
- **Local**: http://localhost:5173/
- **Network**: Check terminal for your local IP

## 🎨 Your Product Updates

✅ **Barahsinghe Craft Pilsner Can**
- Price: $45 per case
- Size: 500ml
- Image: Configured and ready
- Available in catalog, invoices, and PDFs

## 🛠️ Quick Commands

```powershell
npm run dev      # Start development server
npm start        # Same as npm run dev
npm run build    # Build for production
npm install      # Install dependencies
```

## 🎉 You're All Set!

Your Invoice Management App is fully configured and ready to run with a simple `npm run dev` command!

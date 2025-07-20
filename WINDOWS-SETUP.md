# Windows Setup Instructions for Peak Brew Invoice Management

## Step-by-Step Setup (Windows PowerShell/Command Prompt)

### 1. Open Windows PowerShell as Administrator
- Right-click Start button → Windows PowerShell (Admin)

### 2. Navigate to Project Directory
```powershell
cd "C:\VIP\WEB PROD\Invoice Management APp\invoice"
```

### 3. Clean Previous Installation
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
```

### 4. Clear NPM Cache
```powershell
npm cache clean --force
```

### 5. Install Dependencies (Try These Options in Order)

**Option A: Standard Install**
```powershell
npm install
```

**Option B: If Option A fails with Rollup error**
```powershell
npm install --legacy-peer-deps
```

**Option C: If both fail, force install**
```powershell
npm install --force --no-optional
```

### 6. Start Development Server
```powershell
npm run dev
```

### 7. Access Application
- Open browser to: http://localhost:5173
- The application should load with Aurora background login page

## Alternative Method (If npm install still fails)

### Using Yarn Instead of NPM
1. **Install Yarn globally**
   ```powershell
   npm install -g yarn
   ```

2. **Install dependencies with Yarn**
   ```powershell
   yarn install
   ```

3. **Start development server**
   ```powershell
   yarn dev
   ```

## Alternative Method 2 (Static Build)

If development server won't start:

1. **Install serve globally**
   ```powershell
   npm install -g serve
   ```

2. **Build the application**
   ```powershell
   npm run build
   ```

3. **Serve the built application**
   ```powershell
   serve -s dist -l 3000
   ```

4. **Access at http://localhost:3000**

## Troubleshooting Common Issues

### Issue: "Cannot find module @rollup/rollup-win32-x64-msvc"
**Solution:**
1. Delete node_modules and package-lock.json
2. Run: `npm install --no-optional --legacy-peer-deps`

### Issue: ERESOLVE dependency conflicts
**Solution:**
1. Run: `npm install --legacy-peer-deps --force`

### Issue: Permission errors
**Solution:**
1. Run PowerShell as Administrator
2. Or try: `npm config set cache C:\tmp\npm-cache --global`

### Issue: Network/proxy problems
**Solution:**
1. Check corporate firewall/proxy settings
2. Try: `npm config set registry https://registry.npmjs.org/`

## Expected Result

When successful, you should see:
- Login page with animated Aurora background
- "Welcome to Peak Brew" animated text
- Premium beer product catalog
- Invoice generation system
- PDF download functionality

## Application Features

✅ Firebase Authentication  
✅ Airbnb-style animations  
✅ Aurora WebGL background  
✅ Product catalog (6 Nepalese beers)  
✅ Invoice PDF generation  
✅ Firebase cloud storage  
✅ No tax calculations  
✅ Professional invoice templates  

## Support

If you continue having issues:
1. Try running from Command Prompt instead of PowerShell
2. Ensure Node.js is latest LTS version (18.x or 20.x)
3. Check Windows Defender isn't blocking npm operations
4. Try running with Windows Sandbox or clean Windows environment

The application is fully functional once dependencies are properly installed!
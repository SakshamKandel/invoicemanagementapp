# Peak Brew Trading LLC - Invoice Management System

A premium invoice management application for Peak Brew Trading LLC, specializing in imported Nepalese beer distribution. Built with React, Firebase, and styled with Airbnb-inspired design aesthetics.

## Features

- 🔐 **Firebase Authentication** - Secure login system
- 📄 **PDF Invoice Generation** - Professional invoices with jsPDF
- 🍺 **Product Catalog** - Premium Nepalese beer inventory
- 🎨 **Airbnb-Style Design** - Modern, animated UI components
- ⚡ **Aurora Background** - WebGL-powered animated backgrounds
- 📱 **Responsive Design** - Works on all device sizes
- 🔥 **Firebase Storage** - Cloud storage for invoice PDFs
- 🚀 **Split Text Animations** - Smooth text reveal animations

## Beer Products

### Yak Brand
- **Barahsinghe Pilsner** (330ml & 650ml) - 5% alcohol
- **Barahsinghe Hazy IPA** (330ml) - 5.5% alcohol

### Gorkha Brand  
- **Gorkha Premium** (330ml) - 5% alcohol
- **Gorkha Strong** (500ml can) - 6% alcohol

### Nepal Ice Brand
- **Nepal Ice Premium** (330ml) - 5.5% alcohol

## Technology Stack

- **Frontend**: React 19, React Aria Components
- **Styling**: Tailwind CSS, Custom animations
- **Backend**: Firebase (Auth, Firestore, Storage)
- **PDF Generation**: jsPDF, html2canvas
- **3D Graphics**: OGL (for Aurora backgrounds)
- **Build Tool**: Vite

## Getting Started

### Important: WSL/Linux Users
If you're running on WSL (Windows Subsystem for Linux), you may encounter Rollup native binary issues. Please run the commands from Windows Command Prompt or PowerShell instead.

### For Windows Users (Recommended)
1. **Open Windows Command Prompt or PowerShell** (not WSL)
2. **Navigate to project directory**
   ```cmd
   cd "C:\VIP\WEB PROD\Invoice Management APp\invoice"
   ```
3. **Install Dependencies**
   ```cmd
   npm install
   ```
4. **Start Development Server**
   ```cmd
   npm run dev
   ```

### For Linux/WSL Users (Alternative)
If you must use WSL, try these steps:
1. **Clean install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --force
   ```
2. **Use alternative bundler**
   ```bash
   npm install -g serve
   npm run build
   serve -s dist
   ```

### Build for Production
```bash
npm run build
```

## Firebase Configuration

The application is pre-configured with Firebase. Features include:
- Authentication for secure access
- Firestore for invoice data storage  
- Cloud Storage for PDF file storage

## Design Philosophy

Inspired by Airbnb's design language:
- Clean, modern layouts
- Smooth animations and transitions
- Aurora-style backgrounds with dynamic colors
- Intuitive user interactions
- Premium feel with subtle shadows and gradients

## Invoice Features

- **No Tax Calculations** - As per company policy
- **Professional PDF Export** - Branded invoice templates
- **Customer Management** - Store customer details
- **Product Selection** - Easy product browsing and selection
- **Real-time Totals** - Dynamic price calculations

## Components Structure

```
src/
├── Animations/          # Reusable animation components
├── Backgrounds/         # Background effects (Aurora, etc.)
├── Components/          # UI components
├── TextAnimations/      # Text effect components  
├── assets/             # Product images and logos
├── components/         # App-specific components
├── contexts/           # React context providers
└── data/              # Product data and constants
```

## Usage

1. **Login** - Use Firebase authentication to access the system
2. **Browse Products** - View available Nepalese beer products
3. **Select Items** - Add products to your invoice cart
4. **Generate Invoice** - Fill customer details and create PDF
5. **Download** - Invoice PDF is automatically downloaded and stored

## No Taxation

This application does not include tax calculations as per Peak Brew Trading LLC policy. All prices are final case prices for wholesale distribution.

---

*Built with ❤️ for Peak Brew Trading LLC - Bringing the finest Nepalese beers to your table*

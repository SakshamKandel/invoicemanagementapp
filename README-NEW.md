# Peak Brew Trading LLC - Professional Invoice Management System

A comprehensive business management application for Peak Brew Trading LLC, specializing in imported Nepalese beer distribution. Built with modern React architecture, Firebase backend, and professional UI/UX design inspired by industry leaders.

## ✨ Key Features

### 🔐 **Advanced Authentication**
- Firebase Authentication with secure login
- User session management and security controls
- Role-based access control

### 👥 **Customer Management System**
- Complete customer database with business information
- Contact management and communication history
- Customer categorization and search capabilities
- Export/import customer data

### 📦 **Product Catalog Management**
- Comprehensive inventory management
- Stock tracking and low-stock alerts
- Product categorization and filtering
- Pricing and margin calculations
- Image management and product descriptions

### 📄 **Professional Invoice System**
- Multi-step invoice creation wizard
- Real-time calculations with discounts and taxes
- Professional PDF generation with company branding
- Invoice status tracking (Draft, Sent, Paid)
- Payment terms and due date management
- Cloud storage for invoice documents

### 📊 **Analytics Dashboard**
- Revenue tracking and growth metrics
- Customer and product performance analytics
- Interactive charts and data visualization
- Customizable date ranges and filters
- Export capabilities for reports

### ⚙️ **System Settings**
- User profile management
- Notification preferences
- System configuration options
- Security settings and two-factor authentication
- Data backup and restore capabilities

### 🎨 **Modern UI/UX**
- Animated navigation with React Aria Components
- Framer Motion animations and transitions
- Responsive design for all devices
- Professional color schemes and typography
- Intuitive user interface with accessibility features

## 🍺 Premium Beer Portfolio

### Yak Brand
- **Barahsinghe Pilsner** (330ml & 650ml) - 5% alcohol, $52/case
- **Barahsinghe Hazy IPA** (330ml) - 5.5% alcohol, $55/case (Out of Stock)

### Gorkha Brand  
- **Gorkha Premium** (330ml) - 5% alcohol, $55/case (Out of Stock)
- **Gorkha Strong** (500ml can) - 6% alcohol, $55/case (Out of Stock)

### Nepal Ice Brand
- **Nepal Ice Premium** (330ml) - 5.5% alcohol, $50/case

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with hooks and context
- **UI Components**: React Aria Components for accessibility
- **Animations**: Framer Motion for smooth interactions
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **PDF Generation**: jsPDF with professional templates
- **Icons**: Lucide React icon library
- **Form Handling**: React Hook Form for validation
- **Build Tool**: Vite for fast development and building

## 🚀 Installation & Setup

### System Requirements
- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Modern web browser

### Windows Setup (Recommended)
1. **Open Windows Command Prompt or PowerShell**
   ```cmd
   cd "C:\VIP\WEB PROD\Invoice Management APp\invoice"
   ```

2. **Install Dependencies**
   ```cmd
   npm install --legacy-peer-deps
   ```

3. **Start Development Server**
   ```cmd
   npm run dev
   ```

4. **Access Application**
   - Open browser to: http://localhost:5173
   - Login with Firebase authentication

### Alternative Setup (WSL/Linux)
If you encounter Rollup issues on WSL:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps --force
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Firebase Setup
The application comes pre-configured with Firebase:
- **Authentication**: Email/password login
- **Firestore**: Customer, product, and invoice data
- **Storage**: PDF document storage
- **Analytics**: Usage tracking

### Environment Variables
Create a `.env` file if you need custom configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

## 📱 Application Modules

### 1. Customer Management
- **Add/Edit Customers**: Complete business information forms
- **Search & Filter**: Advanced search capabilities
- **Export Data**: CSV export for external use
- **Business Types**: Restaurant, Bar, Retail, Distributor classifications

### 2. Product Catalog
- **Inventory Control**: Stock levels and reorder points
- **Pricing Management**: Cost tracking and margin calculations
- **Product Images**: Visual catalog with product photos
- **Availability Status**: Real-time stock status

### 3. Invoice System
- **3-Step Creation**: Customer → Products → Review workflow
- **Dynamic Calculations**: Real-time totals with taxes and discounts
- **PDF Generation**: Professional branded invoices
- **Status Tracking**: Complete invoice lifecycle management

### 4. Analytics
- **Financial Metrics**: Revenue, payments, and outstanding amounts
- **Performance Tracking**: Top customers and products
- **Growth Analysis**: Period-over-period comparisons
- **Export Reports**: Data export for external analysis

### 5. Settings
- **User Profile**: Personal information and preferences
- **Notifications**: Email and system notification controls
- **Security**: Two-factor authentication and session management
- **Data Management**: Backup and restore capabilities

## 🎯 Business Rules

- **No Tax Calculations**: As per company policy, no taxes are added to invoices
- **Case-Based Pricing**: All products sold by the case
- **Payment Terms**: Flexible terms from Net 15 to Net 60 days
- **Stock Management**: Automatic low-stock alerts
- **Professional Invoicing**: Branded PDF documents with company information

## 🔒 Security Features

- Firebase Authentication with email verification
- Secure document storage in Firebase Cloud Storage
- User session management and timeout controls
- Role-based access control for different user levels
- Data encryption in transit and at rest

## 📋 Usage Guide

1. **Initial Setup**
   - Login with Firebase authentication
   - Configure user profile and company settings
   - Import or add customer data

2. **Daily Operations**
   - Manage customer information and communications
   - Update product inventory and pricing
   - Create and send professional invoices
   - Track payments and outstanding amounts

3. **Reporting**
   - Monitor business performance through analytics
   - Generate reports for financial analysis
   - Export data for accounting systems

## 🆘 Troubleshooting

### Common Issues
1. **Rollup Build Errors**: Use Windows Command Prompt instead of WSL
2. **Firebase Connection**: Check internet connection and Firebase config
3. **PDF Generation**: Ensure sufficient browser memory for large invoices
4. **Performance**: Clear browser cache and restart development server

### Support
- Check the WINDOWS-SETUP.md file for detailed installation instructions
- Review Firebase console for backend issues
- Monitor browser console for client-side errors

## 📄 License

Proprietary software developed for Peak Brew Trading LLC. All rights reserved.

---

**Peak Brew Trading LLC** - *Bringing the finest Nepalese beer tradition to premium markets worldwide*
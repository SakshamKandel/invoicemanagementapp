import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Package, 
  FileText, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import peakBrewLogo from '../assets/peak brew.svg';

const tabs = [
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'products', label: 'Products', icon: Package, path: '/products' },
  { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
];

function Navigation({ children }) {
  const { logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/customers" className="flex items-center space-x-2">
                <img src={peakBrewLogo} alt="Peak Brew Logo" className="h-12 w-auto" />
                <span className="text-xl font-bold text-gray-900 hidden sm:block">Peak Brew Trading</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`
                    relative cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 outline-none rounded-lg flex items-center space-x-2
                    ${active ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}
                  `}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-red-500 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Navigation;
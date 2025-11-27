import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Package,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black selection:bg-brand-600 selection:text-white">
      {/* Editorial Navbar */}
      <nav className="bg-white border-b-4 border-brand-600 sticky top-0 z-50">
        <div className="max-w-[1760px] mx-auto px-6">
          <div className="flex justify-between items-center h-24">

            {/* Logo Section */}
            <Link to="/customers" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-brand-600 text-white flex items-center justify-center rounded-none group-hover:rotate-3 transition-transform duration-300 shadow-sharp-red">
                <img src={peakBrewLogo} alt="Peak Brew" className="h-8 w-8 invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black uppercase tracking-tighter leading-none text-black group-hover:text-brand-600 transition-colors">
                  Peak<br />Brew
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {tabs.map((tab) => {
                const active = isActive(tab.path);
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className="relative group py-2"
                  >
                    <span className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${active ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-600'}`}>
                      {tab.label}
                    </span>
                    <span className={`absolute -bottom-1 left-0 h-[2px] bg-brand-600 transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                );
              })}
            </div>

            {/* User & Actions */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Logged in as</p>
                <p className="text-sm font-black uppercase tracking-tight text-brand-600">{currentUser?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 border-2 border-gray-200 hover:border-brand-600 flex items-center justify-center transition-colors group"
                title="Log Out"
              >
                <LogOut className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-black hover:text-brand-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-24 z-40 bg-white"
          >
            <div className="p-6 flex flex-col gap-4">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-4 border-2 ${isActive(tab.path) ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-100 hover:border-brand-600 hover:text-brand-600'} transition-colors`}
                >
                  <span className="text-lg font-bold uppercase tracking-widest">{tab.label}</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ))}
              <div className="mt-auto pt-8 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">User</p>
                <p className="text-sm font-black uppercase tracking-tight mb-4 text-brand-600">{currentUser?.email}</p>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 border-2 border-brand-600 text-brand-600 font-bold uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-[1760px] mx-auto px-6 py-8">
        <div className="min-h-[calc(100vh-200px)]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Navigation;
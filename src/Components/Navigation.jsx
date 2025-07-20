import React, { useEffect, useState } from 'react';
import { Tab, TabList, Tabs } from 'react-aria-components';
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
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

function Navigation({ children, selectedTab, onTabChange }) {
  const { logout, currentUser } = useAuth();
  const [selectedKey, setSelectedKey] = useState(selectedTab || tabs[0].id);

  const onSelectionChange = (selectedKey) => {
    setSelectedKey(selectedKey);
    onTabChange?.(selectedKey);
  };

  useEffect(() => {
    if (selectedTab && selectedTab !== selectedKey) {
      setSelectedKey(selectedTab);
    }
  }, [selectedTab, selectedKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={peakBrewLogo} alt="Peak Brew Logo" className="h-8 w-auto" />
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
          <Tabs
            className="w-full"
            selectedKey={selectedKey}
            onSelectionChange={onSelectionChange}
          >
            <TabList className="flex space-x-1 py-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Tab 
                    key={tab.id}
                    id={tab.id}
                    className={({ isSelected }) => `
                      relative cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 outline-none rounded-lg
                      ${isSelected ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </Tab>
                );
              })}
            </TabList>
          </Tabs>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[calc(100vh-200px)]">
          {children?.[selectedKey] || (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                {(() => {
                  const currentTab = tabs.find(tab => tab.id === selectedKey);
                  const IconComponent = currentTab?.icon || Package;
                  return <IconComponent className="w-12 h-12 text-gray-400 mx-auto mb-4" />;
                })()}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {tabs.find(tab => tab.id === selectedKey)?.label} Module
                </h3>
                <p className="text-gray-500">
                  Content for {tabs.find(tab => tab.id === selectedKey)?.label} will be displayed here.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Navigation;
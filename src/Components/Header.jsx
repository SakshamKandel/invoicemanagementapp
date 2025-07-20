import React from 'react';
import { Button } from 'react-aria-components';
import { useAuth } from '../contexts/AuthContext';
import peakBrewLogo from '../assets/peak brew.svg';

const Header = () => {
  const { logout, currentUser } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <img src={peakBrewLogo} alt="Peak Brew" className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-gray-900">Peak Brew Trading</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {currentUser?.email}
            </span>
            <Button 
              onPress={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
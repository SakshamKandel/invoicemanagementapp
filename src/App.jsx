import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import Login from './Components/Login';
import Navigation from './Components/Navigation';
import CustomerManagement from './Components/CustomerManagement';
import ProductCatalog from './Components/ProductCatalog';
import InvoiceManagement from './Components/InvoiceManagement';
import Analytics from './Components/Analytics';
import DebugProducts from './Components/DebugProducts';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Login />;
  }
  
  return children;
}

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <InvoiceProvider>
      <div className="bg-gray-50 min-h-screen">
        <Router>
          <Navigation>
            <Routes>
              <Route path="/" element={<Navigate to="/customers" replace />} />
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute>
                    <CustomerManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products" 
                element={
                  <ProtectedRoute>
                    <ProductCatalog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoices" 
                element={
                  <ProtectedRoute>
                    <InvoiceManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/debug" 
                element={
                  <ProtectedRoute>
                    <DebugProducts />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/customers" replace />} />
            </Routes>
          </Navigation>
        </Router>
      </div>
    </InvoiceProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

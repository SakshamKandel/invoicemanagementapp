import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import Login from './Components/Login';
import Navigation from './Components/Navigation';
import CustomerManagement from './Components/CustomerManagement';
import ProductCatalog from './Components/ProductCatalog';
import InvoiceManagement from './Components/InvoiceManagement';
import Analytics from './Components/Analytics';

function AppContent() {
  const { currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('customers');

  if (!currentUser) {
    return <Login />;
  }

  const tabComponents = {
    customers: <CustomerManagement />,
    products: <ProductCatalog onNavigateToInvoices={() => setSelectedTab('invoices')} />,
    invoices: <InvoiceManagement />,
    analytics: <Analytics />,
  };

  return (
    <InvoiceProvider>
      <div className="bg-gray-50 min-h-screen">
        <Navigation selectedTab={selectedTab} onTabChange={setSelectedTab}>
          {tabComponents}
        </Navigation>
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

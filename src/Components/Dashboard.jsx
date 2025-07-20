import React, { useState } from 'react';
import { Button, TextField, Label, Input } from 'react-aria-components';
import Header from './Header';
import ProductCard from './ProductCard';
import InvoiceModal from './InvoiceModal';
import { products } from '../data/products';
import FadeContent from '../Animations/FadeContent/FadeContent';

const Dashboard = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');

  const brands = ['all', ...new Set(products.map(p => p.brand))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const handleAddToInvoice = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    
    if (existingProduct) {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromInvoice = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromInvoice(productId);
      return;
    }
    
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, quantity } : p
      )
    );
  };

  const totalAmount = selectedProducts.reduce((sum, product) => 
    sum + (product.pricePerCase * product.quantity), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Premium Nepalese Beer Collection
          </h2>
          <p className="text-gray-600 max-w-2xl">
            Select from our curated collection of premium imported beers from Nepal. 
            Each product represents the finest brewing traditions and quality.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="mb-6 space-y-4 lg:flex lg:space-y-0 lg:space-x-4">
              <TextField className="flex-1">
                <Label className="sr-only">Search products</Label>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </TextField>
              
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-40"
              >
                {brands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand === 'all' ? 'All Brands' : brand}
                  </option>
                ))}
              </select>
            </div>

            <FadeContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToInvoice={handleAddToInvoice}
                  />
                ))}
              </div>
            </FadeContent>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              </div>
            )}
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Invoice Items ({selectedProducts.length})
              </h3>
              
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items selected for invoice
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name} ({product.size})
                          </h4>
                          <p className="text-sm text-gray-500">
                            ${product.pricePerCase}/case × {product.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onPress={() => handleUpdateQuantity(product.id, product.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {product.quantity}
                          </span>
                          <Button
                            onPress={() => handleUpdateQuantity(product.id, product.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                          >
                            +
                          </Button>
                          <Button
                            onPress={() => handleRemoveFromInvoice(product.id)}
                            className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                    
                    <Button
                      onPress={() => setShowInvoiceModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      Generate Invoice
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {showInvoiceModal && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          selectedProducts={selectedProducts}
          totalAmount={totalAmount}
          onInvoiceGenerated={() => {
            setSelectedProducts([]);
            setShowInvoiceModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
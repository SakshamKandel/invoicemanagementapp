import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Package, 
  DollarSign, 
  Filter,
  Plus,
  FileText,
  ShoppingCart,
  X,
  Check
} from 'lucide-react';
import '../styles/FlipCard.css';
import { products as fixedProducts } from '../data/products';
import { useInvoice } from '../contexts/InvoiceContext';
import { 
  saveProductsToFirebase, 
  loadProductsFromFirebase, 
  updateProductStockInFirebase,
  clearAllProductsFromFirebase,
  debugFirebaseProducts 
} from '../services/firebaseService';

const ProductCatalog = ({ onNavigateToInvoices }) => {
  const [products, setProducts] = useState(fixedProducts);
  const [filteredProducts, setFilteredProducts] = useState(fixedProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Force reset filters on component mount
  useEffect(() => {
    console.log('Component mounted, forcing filter reset');
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedAvailability('all');
  }, []);

  // Load products from Firebase on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const firebaseProducts = await loadProductsFromFirebase();
        
        // If Firebase has corrupted data (not exactly 6 products), force reset
        if (!firebaseProducts || firebaseProducts.length !== 6) {
          console.warn('Firebase has incorrect number of products:', firebaseProducts?.length || 0, 'expected 6. Forcing reset.');
          await clearAllProductsFromFirebase();
          await saveProductsToFirebase(fixedProducts, true);
          setProducts(fixedProducts);
          setFilteredProducts(fixedProducts);
          console.log('🔄 Reset complete with default products');
        } else {
          console.log('✅ Using products from Firebase:', firebaseProducts.length, 'products');
          console.log('📋 Product availability status:');
          firebaseProducts.forEach(p => {
            console.log(`  ${p.name}: ${p.available ? '✅ Available' : '❌ Unavailable'}`);
          });
          setProducts(firebaseProducts);
          setFilteredProducts(firebaseProducts);
        }
        
        // Force reset filters after loading products
        setSearchQuery('');
        setSelectedBrand('all');
        setSelectedAvailability('all');
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts(fixedProducts);
        setFilteredProducts(fixedProducts);
      } finally {
        setIsProductsLoading(false);
      }
    };

    loadProducts();
  }, []);
  
  const { 
    selectedItems, 
    addItem, 
    removeItem, 
    updateItemQuantity, 
    clearItems, 
    openCreateInvoice,
    getTotalAmount,
    getTotalItems
  } = useInvoice();

  const brands = ['Yak', 'Gorkha', 'Nepal Ice'];

  // Debug current filter state
  useEffect(() => {
    console.log('Filter state changed:');
    console.log('  - Products count:', products.length);
    console.log('  - Search query:', searchQuery);
    console.log('  - Selected brand:', selectedBrand);
    console.log('  - Selected availability:', selectedAvailability);
    console.log('  - Filtered products:', filteredProducts.length);
  }, [searchQuery, selectedBrand, selectedAvailability, products, filteredProducts]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedBrand, selectedAvailability, products]);

  const handleStockStatusChange = (productId, isInStock) => {
    const updatedProducts = products.map(product =>
      product.id === productId ? { ...product, available: isInStock } : product
    );
    setProducts(updatedProducts);
  };

  const handleQuickStockToggle = async (productId) => {
    console.log(`🔄 Toggling stock for product ${productId}`);
    const product = products.find(p => p.id === productId);
    if (product) {
      const newAvailability = !product.available;
      console.log(`📦 Product ${product.name}: ${product.available ? 'available' : 'unavailable'} → ${newAvailability ? 'available' : 'unavailable'}`);
      
      // Update local state immediately for UI responsiveness
      const updatedProducts = products.map(p =>
        p.id === productId ? { ...p, available: newAvailability } : p
      );
      setProducts(updatedProducts);
      
      // Update in Firebase with error handling
      try {
        const success = await updateProductStockInFirebase(productId, newAvailability);
        if (success) {
          console.log(`✅ Stock change saved to Firebase successfully`);
        } else {
          console.error(`❌ Failed to save stock change to Firebase`);
          // Revert local state if Firebase update failed
          setProducts(products);
        }
      } catch (error) {
        console.error(`❌ Error updating stock in Firebase:`, error);
        // Revert local state if Firebase update failed
        setProducts(products);
      }
    }
  };


  const filterProducts = () => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }

    if (selectedAvailability !== 'all') {
      filtered = filtered.filter(product => 
        selectedAvailability === 'available' ? product.available : !product.available
      );
    }

    setFilteredProducts(filtered);
  };

  // Debug function to reset Firebase data
  const resetFirebaseData = async () => {
    try {
      console.log('=== RESETTING FIREBASE DATA ===');
      console.log('Original products:', fixedProducts.length);
      
      // First debug what's currently in Firebase
      await debugFirebaseProducts();
      
      // Clear and reset
      await clearAllProductsFromFirebase();
      await saveProductsToFirebase(fixedProducts, false); // Don't clear again since we just did
      setProducts(fixedProducts);
      
      // Reset all filters to show all products
      setSearchQuery('');
      setSelectedBrand('all');
      setSelectedAvailability('all');
      
      // Debug again to confirm
      console.log('After reset:');
      await debugFirebaseProducts();
      
      console.log('Firebase data reset successfully');
      console.log('Filters reset to show all products');
    } catch (error) {
      console.error('Error resetting Firebase data:', error);
    }
  };

  // Debug function to check current Firebase state
  const debugCurrentState = async () => {
    console.log('=== CURRENT STATE DEBUG ===');
    console.log('Local products state:', products.length);
    console.log('Filtered products:', filteredProducts.length);
    console.log('Current filters:');
    console.log('  - Search query:', searchQuery);
    console.log('  - Selected brand:', selectedBrand);
    console.log('  - Selected availability:', selectedAvailability);
    await debugFirebaseProducts();
  };

  // Function to reset just filters
  const resetFilters = () => {
    console.log('Resetting all filters to show all products');
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedAvailability('all');
  };

  // Emergency function to force show all products
  const forceShowAllProducts = () => {
    console.log('EMERGENCY: Forcing all products to show');
    
    // Use default products if needed
    const productsToShow = products.length > 0 ? products : fixedProducts;
    
    // Force reset everything
    setProducts(productsToShow);
    setFilteredProducts(productsToShow);
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedAvailability('all');
    
    console.log('Forced to show', productsToShow.length, 'products');
    productsToShow.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.brand}) - ${p.size}`);
    });
  };

  // Test function for stock persistence
  const testStockPersistence = async () => {
    console.log('🧪 Testing stock persistence...');
    
    // Toggle first product stock
    const firstProduct = products[0];
    if (firstProduct) {
      console.log(`Testing with ${firstProduct.name} (ID: ${firstProduct.id})`);
      await handleQuickStockToggle(firstProduct.id);
      
      // Wait a moment then check Firebase
      setTimeout(async () => {
        const firebaseProducts = await loadProductsFromFirebase();
        const updatedProduct = firebaseProducts.find(p => p.id === firstProduct.id);
        console.log(`🔍 Firebase check: ${updatedProduct.name} is ${updatedProduct.available ? 'available' : 'unavailable'}`);
      }, 2000);
    }
  };

  // Force update Firebase with correct image paths
  const forceUpdateImages = async () => {
    try {
      console.log('🖼️ Forcing update of Firebase products with correct image paths...');
      
      // Clear and reset with correct data
      await clearAllProductsFromFirebase();
      await saveProductsToFirebase(fixedProducts, false);
      
      // Reload the page to refresh everything
      window.location.reload();
    } catch (error) {
      console.error('Error forcing image update:', error);
    }
  };

  // Add debug functions for browser console
  window.resetProducts = resetFirebaseData;
  window.debugProducts = debugCurrentState;
  window.resetFilters = resetFilters;
  window.forceShowAll = forceShowAllProducts;
  window.testStockPersistence = testStockPersistence;
  window.forceUpdateImages = forceUpdateImages;

  const handleCreateInvoice = () => {
    const success = openCreateInvoice(() => {
      if (onNavigateToInvoices) {
        onNavigateToInvoices();
      }
    });
    
    if (!success) {
      return;
    }
  };



  // Show loading state
  if (isProductsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Premium Beer Collection</h1>
              <p className="text-base md:text-lg text-gray-600">Authentic Nepalese craft beers</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  {products.length} Premium Products
                </span>
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {brands.length} Brands
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search beers..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 text-sm md:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 justify-center sm:justify-start">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 font-medium text-sm md:text-base min-w-0 flex-1 sm:flex-none"
                >
                  <option value="all">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 font-medium text-sm md:text-base min-w-0 flex-1 sm:flex-none"
                >
                  <option value="all">All Availability</option>
                  <option value="available">In Stock</option>
                  <option value="unavailable">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      {selectedItems.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-3 md:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart ({getTotalItems()} items)
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="text-center sm:text-right order-3 sm:order-1">
                    <div className="text-sm text-gray-600">{selectedItems.length} products</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${getTotalAmount().toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={handleCreateInvoice}
                    className="flex items-center justify-center space-x-2 px-4 py-3 md:px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md order-1 sm:order-2 text-sm md:text-base"
                  >
                    <FileText className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Create Invoice</span>
                  </button>
                  <button
                    onClick={clearItems}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:bg-gray-100 rounded-lg self-center order-2 sm:order-3"
                    title="Clear all items"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 rounded-lg p-3 space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-sm md:text-base">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.brand})</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 flex items-center justify-center text-sm font-medium transition-all duration-200"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 flex items-center justify-center text-sm font-medium transition-all duration-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">@</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.customPrice || item.pricePerCase}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || item.pricePerCase;
                            updateItemQuantity(item.id, item.quantity, newPrice);
                          }}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <span className="text-gray-900 font-semibold min-w-[70px] md:min-w-[80px] text-right text-sm md:text-base">
                        ${(item.quantity * (item.customPrice || item.pricePerCase)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            <Package className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">No beers found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm md:text-base">
              Try adjusting your search or filters to find the perfect beer.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Product Cards Grid */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-8">
              <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-200 overflow-hidden flip-card ${
                        flippedCards.has(product.id) ? 'flipped' : ''
                      }`}
                      style={{ aspectRatio: '3/4', perspective: '1000px' }}
                      onClick={() => {
                        const newFlippedCards = new Set(flippedCards);
                        if (flippedCards.has(product.id)) {
                          newFlippedCards.delete(product.id);
                        } else {
                          newFlippedCards.add(product.id);
                        }
                        setFlippedCards(newFlippedCards);
                      }}
                    >
                      <div className="flip-card-inner relative w-full h-full transition-transform duration-500 preserve-3d">
                        {/* Front Side - Product Details */}
                        <div className="flip-card-front absolute inset-0 w-full h-full backface-hidden">
                          {/* Product Image */}
                          <div className="relative h-28 xs:h-32 sm:h-36 md:h-40 overflow-hidden rounded-t-xl">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain bg-white transition-transform duration-300"
                              style={{ 
                                objectFit: 'contain',
                                backgroundColor: '#ffffff',
                                padding: '4px sm:8px'
                              }}
                            />
                            <div className={`absolute top-1 xs:top-2 right-1 xs:right-2 px-1 xs:px-2 py-0.5 xs:py-1 rounded-full text-xs font-bold text-white ${
                              product.available ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              <span className="hidden xs:inline">{product.available ? 'In Stock' : 'Out of Stock'}</span>
                              <span className="xs:hidden">{product.available ? '✓' : '✗'}</span>
                            </div>
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-2 xs:p-3 sm:p-4 flex flex-col justify-between flex-1">
                            <div>
                              <h3 className="font-bold text-gray-900 text-xs xs:text-sm sm:text-base mb-1 line-clamp-2 leading-tight">
                                {product.name}
                              </h3>
                              <p className="text-xs text-gray-600 mb-1">
                                {product.brand}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {product.size}
                              </p>
                            </div>
                            
                            <div className="mt-auto">
                              <p className="font-bold text-blue-600 text-xs xs:text-sm">
                                ${product.pricePerCase}/case
                              </p>
                              <p className="text-xs text-gray-500 leading-tight">
                                {product.unitsPerCase} units
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Back Side - Stock Management */}
                        <div className="flip-card-back absolute inset-0 w-full h-full backface-hidden rotate-y-180 text-white rounded-xl flex flex-col items-center justify-center p-4">
                          <div className="text-center mb-4">
                            <h3 className="font-bold text-sm sm:text-base mb-2 text-shadow">
                              Stock Management
                            </h3>
                            <p className="text-xs opacity-90 text-shadow">
                              {product.name}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-4">
                            <div className="status-badge">
                              Currently: {product.available ? 'In Stock' : 'Out of Stock'}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStockToggle(product.id);
                              }}
                              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                            >
                              Mark as {product.available ? 'Out of Stock' : 'In Stock'}
                            </button>
                            
                            <p className="text-xs opacity-75 text-center text-shadow">
                              Click card to flip back
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Action Buttons */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 pt-4">
              {filteredProducts.map((product) => {
                const isSelected = selectedItems.find(item => item.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    disabled={!product.available}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-3 md:px-6 rounded-lg font-medium transition-all duration-200 border shadow-sm hover:shadow-md text-xs sm:text-sm md:text-base min-h-[40px] sm:min-h-[48px] ${
                      product.available
                        ? isSelected 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    ) : (
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    )}
                    <span className="truncate text-center">
                      {isSelected 
                        ? `Added (${isSelected.quantity})` 
                        : `Add ${product.name.length > 15 ? product.name.substring(0, 12) + '...' : product.name}`
                      }
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="text-center py-4 md:py-6">
              <p className="text-gray-600 text-base md:text-lg font-medium">
                Showing all {filteredProducts.length} premium beers
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductCatalog;
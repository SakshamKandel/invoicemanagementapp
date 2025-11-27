import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  DollarSign,
  Filter,
  Plus,
  FileText,
  ShoppingCart,
  X,
  Check,
  ArrowRight,
  Info,
  Trash2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import '../styles/FlipCard.css';
import { products as fixedProducts } from '../data/products';
import { useInvoice } from '../contexts/InvoiceContext';
import {
  saveProductsToFirebase,
  loadProductsFromFirebase,
  updateProductStockInFirebase,
  addProductToFirebase,
  deleteProductFromFirebase,
  uploadProductImage
} from '../services/optimizedFirebaseService';
import {
  clearAllProductsFromFirebase,
  debugFirebaseProducts
} from '../services/firebaseService';
import { auth } from '../firebase';

const ProductCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(fixedProducts);
  const [filteredProducts, setFilteredProducts] = useState(fixedProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Add Product State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    brand: '',
    description: '',
    pricePerCase: '',
    unitsPerCase: 24,
    size: '12oz',
    alcohol: '5.0%',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Default beer image
    available: true
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Force reset filters on component mount
  useEffect(() => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedAvailability('all');
  }, []);

  // Load products from Firebase on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const firebaseProducts = await loadProductsFromFirebase();

        if (!firebaseProducts || firebaseProducts.length < 8) {
          // Only reset if significantly fewer products than expected (initial load)
          // But if we have added products, we want to keep them.
          // For now, let's trust Firebase if it has data.
          if (!firebaseProducts || firebaseProducts.length === 0) {
            await clearAllProductsFromFirebase();
            await saveProductsToFirebase(fixedProducts, true);
            setProducts(fixedProducts);
            setFilteredProducts(fixedProducts);
          } else {
            setProducts(firebaseProducts);
            setFilteredProducts(firebaseProducts);
          }
        } else {
          setProducts(firebaseProducts);
          setFilteredProducts(firebaseProducts);
        }

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

  const brands = ['Barahsinghe', 'Gorkha', 'Nepal Ice', 'Arna', 'Other'];

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
    const product = products.find(p => p.id === productId);
    if (product) {
      const newAvailability = !product.available;
      const updatedProducts = products.map(p =>
        p.id === productId ? { ...p, available: newAvailability } : p
      );
      setProducts(updatedProducts);

      try {
        const success = await updateProductStockInFirebase(productId, newAvailability);
        if (!success) {
          setProducts(products);
        }
      } catch (error) {
        setProducts(products);
      }
    }
  };

  const handleDeleteProduct = async (productId, e) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await deleteProductFromFirebase(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product.');
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Current User:', auth.currentUser);
    if (!auth.currentUser) {
      alert('You must be logged in to upload images.');
      return;
    }

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      alert('Please upload a valid image file (PNG, JPG, WEBP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size is too large. Please upload an image smaller than 5MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const downloadURL = await uploadProductImage(file);
      setNewProductData(prev => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.name || !newProductData.pricePerCase) {
      alert('Please fill in at least the Name and Price.');
      return;
    }

    setIsSavingProduct(true);
    try {
      const productToAdd = {
        ...newProductData,
        pricePerCase: parseFloat(newProductData.pricePerCase),
        unitsPerCase: parseInt(newProductData.unitsPerCase),
        id: Date.now()
      };

      await addProductToFirebase(productToAdd);
      setProducts(prev => [...prev, productToAdd]);
      setIsAddProductModalOpen(false);
      setNewProductData({
        name: '',
        brand: '',
        description: '',
        pricePerCase: '',
        unitsPerCase: 24,
        size: '12oz',
        alcohol: '5.0%',
        image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        available: true
      });
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsSavingProduct(false);
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

  const handleCreateInvoice = () => {
    const success = openCreateInvoice(() => {
      navigate('/invoices');
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  if (isProductsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* Editorial Header */}
      <div className="border-b-4 border-brand-600 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter mb-2">
                Product<br />Catalog
              </h1>
              <div className="flex items-center gap-4 text-sm font-mono uppercase tracking-widest text-gray-500">
                <span>{products.length} SKUs</span>
                <span className="w-1 h-1 bg-brand-600 rounded-full"></span>
                <span>{brands.length} Brands</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center md:items-end w-full md:w-auto">
              {/* Add Product Button */}
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="flex-1 md:flex-none px-6 py-3 bg-brand-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-sharp-red hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </span>
              </button>

              {/* Cart Summary Widget */}
              {selectedItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-600 text-white p-4 min-w-[300px] shadow-sharp-red"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-100">Current Order</span>
                    <span className="text-xl font-black">${getTotalAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateInvoice}
                      className="flex-1 bg-white text-brand-600 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                    >
                      Checkout
                    </button>
                    <button
                      onClick={clearItems}
                      className="px-3 py-2 border border-brand-400 hover:border-white text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-4 md:mt-8 flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4 md:pt-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH CATALOG..."
                className="w-full pl-8 pr-4 py-2 bg-transparent border-none text-xl font-bold uppercase placeholder-gray-300 focus:ring-0 focus:placeholder-gray-200 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-gray-100 text-xs font-bold uppercase tracking-widest px-4 py-2 border-none outline-none focus:ring-0 cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="bg-gray-100 text-xs font-bold uppercase tracking-widest px-4 py-2 border-none outline-none focus:ring-0 cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="available">In Stock</option>
                <option value="unavailable">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fluid Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-bold uppercase tracking-widest">No Products Found</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const isSelected = selectedItems.find(item => item.id === product.id);
                return (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    layout
                    className="group relative bg-white border border-gray-100 hover:border-brand-600 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[4/5] bg-gray-50 p-8 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Status Badge */}
                      <div className={`absolute top-4 right-4 px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${product.available ? 'bg-brand-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
                        {product.available ? 'In Stock' : 'Sold Out'}
                      </div>

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleQuickStockToggle(product.id)}
                          className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-black hover:text-white transition-colors w-32"
                        >
                          {product.available ? 'Unavailable' : 'Available'}
                        </button>
                        <button
                          onClick={(e) => handleDeleteProduct(product.id, e)}
                          className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-red-700 transition-colors w-32 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{product.brand}</p>
                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price</p>
                          <p className="text-xl font-black">${product.pricePerCase}</p>
                        </div>

                        <button
                          onClick={() => addItem(product)}
                          disabled={!product.available}
                          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all shadow-sharp-red hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${!product.available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : isSelected
                              ? 'bg-brand-600 text-white hover:bg-black'
                              : 'bg-black text-white hover:bg-brand-600'
                            }`}
                        >
                          {isSelected ? `Added (${isSelected.quantity})` : 'Add to Order'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddProductModalOpen(false)}
                className="fixed inset-0 bg-white/90 backdrop-blur-xl"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row rounded-2xl"
              >
                {/* Left Side - Visual & Image Upload */}
                <div className="w-full md:w-2/5 bg-gray-900 p-8 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_60%)]"></div>
                  </div>

                  <div className="relative z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">New<br />Product</h2>
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Inventory Addition</p>
                  </div>

                  <div className="relative z-10 my-8 flex-1 flex flex-col justify-center">
                    <div className="aspect-video md:aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center relative group overflow-hidden transition-colors hover:bg-white/10 hover:border-white/40">
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold uppercase tracking-widest text-white">Uploading...</span>
                        </div>
                      ) : newProductData.image ? (
                        <>
                          <img src={newProductData.image} alt="Preview" className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Change Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-500 group-hover:text-white transition-colors">
                          <ImageIcon className="w-12 h-12" />
                          <span className="text-xs font-bold uppercase tracking-widest">Upload Visual</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Or use URL</p>
                      <div className="relative">
                        <input
                          value={newProductData.image}
                          onChange={(e) => setNewProductData({ ...newProductData, image: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-600 outline-none transition-colors"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Supported formats: PNG, JPG, WEBP.<br />
                      Maximum file size: 5MB.<br />
                      Ensure high resolution for best display.
                    </p>
                  </div>
                </div>

                {/* Right Side - Form Details */}
                <div className="flex-1 bg-white p-8 md:p-10 flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-2 text-brand-600">
                      <Package className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Product Details</span>
                    </div>
                    <button
                      onClick={() => setIsAddProductModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2 -mt-2"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleAddProduct} className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Product Name</label>
                        <input
                          required
                          value={newProductData.name}
                          onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                          className="w-full py-2 border-b border-gray-200 focus:border-brand-600 outline-none text-xl font-bold uppercase tracking-tight transition-colors placeholder-gray-200 text-black"
                          placeholder="E.G. BARAH LAGER"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Brand</label>
                          <select
                            value={newProductData.brand}
                            onChange={(e) => setNewProductData({ ...newProductData, brand: e.target.value })}
                            className="w-full py-2 border-b border-gray-200 focus:border-brand-600 outline-none text-sm font-bold uppercase transition-colors bg-transparent cursor-pointer text-black"
                          >
                            <option value="">Select Brand</option>
                            {brands.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Size</label>
                          <input
                            value={newProductData.size}
                            onChange={(e) => setNewProductData({ ...newProductData, size: e.target.value })}
                            className="w-full py-2 border-b border-gray-200 focus:border-brand-600 outline-none text-sm font-bold transition-colors placeholder-gray-200 text-black"
                            placeholder="e.g. 330ml"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                        <textarea
                          value={newProductData.description}
                          onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                          className="w-full py-2 border-b border-gray-200 focus:border-brand-600 outline-none text-sm font-medium transition-colors placeholder-gray-200 resize-none text-black"
                          rows="2"
                          placeholder="Enter product details..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Price / Case</label>
                          <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                            <input
                              required
                              type="number"
                              step="0.01"
                              value={newProductData.pricePerCase}
                              onChange={(e) => setNewProductData({ ...newProductData, pricePerCase: e.target.value })}
                              className="w-full pl-4 py-2 border-b border-gray-200 focus:border-brand-600 outline-none text-lg font-black transition-colors placeholder-gray-200 text-black"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Units / Case</label>
                          <input
                            type="number"
                            value={newProductData.unitsPerCase}
                            onChange={(e) => setNewProductData({ ...newProductData, unitsPerCase: e.target.value })}
                            className="w-full py-2 border-b border-gray-200 focus:border-brand-600 outline-none text-lg font-black transition-colors placeholder-gray-200 text-black"
                            placeholder="24"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setIsAddProductModalOpen(false)}
                        className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-lg text-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProduct}
                        className="px-8 py-3 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 rounded-lg flex items-center gap-2"
                      >
                        {isSavingProduct ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Add Product
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductCatalog;
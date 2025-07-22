import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, Send, Search, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useInvoice } from '../contexts/InvoiceContext';
import { products as catalogProducts } from '../data/products';
import { loadProductsFromFirebase } from '../services/firebaseService';

const CreateInvoice = ({ customers = [], onClose, onInvoiceCreated }) => {
  const { currentUser } = useAuth();
  const { selectedItems, getFormattedItems } = useInvoice();
  
  // Products state - load from Firebase to sync with ProductCatalog
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // Customer data
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // Invoice data
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Add payment method state
  
  // Items
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [manualPrice, setManualPrice] = useState('');
  const [useManualPrice, setUseManualPrice] = useState(false);
  
  // Calculations
  const [taxRate, setTaxRate] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load products from Firebase on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const firebaseProducts = await loadProductsFromFirebase();
        
        if (firebaseProducts && firebaseProducts.length > 0) {
          // Filter to only show available products
          const availableProducts = firebaseProducts.filter(product => product.available);
          setProducts(availableProducts);
        } else {
          // Fallback to catalog products if Firebase is empty
          const availableProducts = catalogProducts.filter(product => product.available);
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error('Error loading products for invoice:', error);
        // Fallback to catalog products
        const availableProducts = catalogProducts.filter(product => product.available);
        setProducts(availableProducts);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Generate invoice number
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setInvoiceNumber(`INV-${timestamp}-${random}`);
  }, []);

  // Load pre-selected items
  useEffect(() => {
    if (selectedItems && selectedItems.length > 0) {
      const formattedItems = selectedItems.map(item => ({
        id: Date.now() + Math.random(),
        productId: item.id,
        name: item.name,
        description: item.name, // Use product name as description
        quantity: item.quantity || 1,
        price: item.pricePerCase,
        total: (item.quantity || 1) * item.pricePerCase
      }));
      setItems(formattedItems);
    }
  }, [selectedItems]);

  // Calculate due date (30 days from issue date)
  useEffect(() => {
    if (issueDate) {
      const issue = new Date(issueDate);
      const due = new Date(issue);
      due.setDate(due.getDate() + 30);
      setDueDate(due.toISOString().split('T')[0]);
    }
  }, [issueDate]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.businessName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Select customer from dropdown
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setBusinessName(customer.businessName || '');
    setContactPerson(customer.contactPerson || '');
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setAddress(customer.address || '');
    setCity(customer.city || '');
    setState(customer.state || '');
    setZipCode(customer.zipCode || '');
    setCustomerSearch('');
  };

  // Clear customer selection
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setBusinessName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
  };

  // Add item to invoice
  const handleAddItem = () => {
    console.log('Add Item clicked');
    console.log('Selected Product:', selectedProduct);
    console.log('Quantity:', quantity);
    console.log('Products array:', products);
    
    if (!selectedProduct || quantity <= 0) {
      console.log('Missing product or invalid quantity');
      setError('Please select a product and enter a valid quantity');
      return;
    }

    const product = products.find(p => p.id.toString() === selectedProduct.toString());
    console.log('Found product:', product);
    
    if (!product) {
      console.log('Product not found');
      setError('Selected product not found');
      return;
    }

    const price = useManualPrice && manualPrice ? parseFloat(manualPrice) : product.pricePerCase;
    const newItem = {
      id: Date.now() + Math.random(),
      productId: product.id,
      name: product.name,
      description: product.name, // Use product name as description
      quantity: parseInt(quantity),
      price: price,
      total: parseInt(quantity) * price
    };

    console.log('New item to add:', newItem);
    setItems(prevItems => {
      const updatedItems = [...prevItems, newItem];
      console.log('Updated items array:', updatedItems);
      return updatedItems;
    });
    
    // Clear form
    setSelectedProduct('');
    setQuantity(1);
    setManualPrice('');
    setUseManualPrice(false);
    setError(''); // Clear any previous errors
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  // Update item price
  const handleUpdatePrice = (itemId, newPrice) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, price: newPrice, total: item.quantity * newPrice }
        : item
    ));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Save invoice
  const handleSaveInvoice = async (status = 'draft') => {
    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    if (!businessName.trim()) {
      setError('Please fill in business name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const invoiceData = {
        invoiceNumber,
        customerData: {
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        },
        customerName: businessName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        customerAddress: `${address.trim()}${city.trim() ? ', ' + city.trim() : ''}${state.trim() ? ', ' + state.trim() : ''}${zipCode.trim() ? ' ' + zipCode.trim() : ''}`.trim(),
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate,
        tax: taxAmount,
        total,
        notes: notes.trim(),
        paymentMethod, // Add payment method to invoice data
        status,
        createdBy: currentUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'invoices'), invoiceData);
      onInvoiceCreated();
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[98vh] overflow-hidden mx-2 sm:mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Invoice</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {productsLoading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <span className="text-sm">Loading products...</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            
            {/* Left Column - Customer & Invoice Details */}
            <div className="space-y-6">
              
              {/* Customer Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                
                {!selectedCustomer ? (
                  <div className="space-y-4">
                    {/* Customer Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search existing customers..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Customer Dropdown */}
                    {customerSearch && filteredCustomers.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{customer.businessName}</div>
                            <div className="text-sm text-gray-600">{customer.email}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-center text-gray-500 text-sm">OR</div>

                    {/* Manual Customer Entry - Simplified */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter business name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter contact person"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter phone (optional)"
                        />
                      </div>

                    </div>
                  </div>
                ) : (
                  /* Selected Customer Display */
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedCustomer.businessName}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {selectedCustomer.contactPerson}
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {selectedCustomer.email}
                          </div>
                          {selectedCustomer.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {selectedCustomer.phone}
                            </div>
                          )}
                          {selectedCustomer.address && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {selectedCustomer.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleClearCustomer}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes..."
                />
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>

            {/* Right Column - Items */}
            <div className="space-y-6">
              
              {/* Add Items */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Items</h3>
                
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        console.log('Product selected:', e.target.value);
                        setSelectedProduct(e.target.value);
                        setError(''); // Clear any errors when selecting product
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a product ({products.length} in stock)</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.size}) - {product.brand} - ${product.pricePerCase}/case ({product.unitsPerCase} units)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          console.log('Quantity changed to:', newQuantity);
                          setQuantity(newQuantity);
                        }}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price Override
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={manualPrice}
                          onChange={(e) => {
                            setManualPrice(e.target.value);
                            setUseManualPrice(e.target.value !== '');
                          }}
                          placeholder={selectedProduct ? `$${products.find(p => p.id.toString() === selectedProduct.toString())?.pricePerCase || 0}` : 'Default price'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {manualPrice && (
                          <button
                            type="button"
                            onClick={() => {
                              setManualPrice('');
                              setUseManualPrice(false);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use catalog price
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || quantity <= 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item ({quantity} x {selectedProduct ? products.find(p => p.id.toString() === selectedProduct.toString())?.name || 'Product' : 'Select Product'})
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Invoice Items</h4>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-gray-600">@</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1 py-0.5 text-center border border-gray-300 rounded text-sm"
                            />
                          </div>
                          
                          <div className="font-medium text-gray-900">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Totals</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax Rate (%):</span>
                      <input
                        type="number"
                        step="0.01"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-right border border-gray-300 rounded text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${taxAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-300">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveInvoice('draft')}
              disabled={loading || items.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button
              onClick={() => handleSaveInvoice('sent')}
              disabled={loading || items.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Save & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
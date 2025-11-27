import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Save,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  Trash2,
  Check,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useInvoice } from '../contexts/InvoiceContext';
import { products as catalogProducts } from '../data/products';
import { loadProductsFromFirebase, saveInvoiceOptimized } from '../services/optimizedFirebaseService';

const CreateInvoice = ({ customers = [], onClose, onInvoiceCreated }) => {
  const { currentUser } = useAuth();
  const { selectedItems, getFormattedItems } = useInvoice();

  // Products state
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
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Items
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [manualPrice, setManualPrice] = useState('');

  // Calculations
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const firebaseProducts = await loadProductsFromFirebase();
        const availableProducts = (firebaseProducts && firebaseProducts.length > 0 ? firebaseProducts : catalogProducts)
          .filter(product => product.available);
        setProducts(availableProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts(catalogProducts.filter(product => product.available));
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

  // Load pre-selected items from cart
  useEffect(() => {
    if (selectedItems && selectedItems.length > 0) {
      const formattedItems = selectedItems.map(item => ({
        id: Date.now() + Math.random(),
        productId: item.id,
        name: item.name,
        description: item.name,
        size: item.size || '',
        volume: item.volume || '',
        brand: item.brand || '',
        quantity: item.quantity || 1,
        price: item.pricePerCase,
        total: (item.quantity || 1) * item.pricePerCase
      }));
      setItems(formattedItems);
    }
  }, [selectedItems]);

  // Calculate due date
  useEffect(() => {
    if (issueDate) {
      const issue = new Date(issueDate);
      const due = new Date(issue);
      due.setDate(due.getDate() + 30);
      setDueDate(due.toISOString().split('T')[0]);
    }
  }, [issueDate]);

  const filteredCustomers = customers.filter(customer =>
    customer.businessName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(customerSearch.toLowerCase())
  );

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

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    const product = products.find(p => p.id.toString() === selectedProduct.toString());
    if (!product) return;

    const price = manualPrice ? parseFloat(manualPrice) : product.pricePerCase;
    const newItem = {
      id: Date.now() + Math.random(),
      productId: product.id,
      name: product.name,
      description: product.name,
      size: product.size || '',
      brand: product.brand || '',
      quantity: parseInt(quantity),
      price: price,
      total: parseInt(quantity) * price
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity(1);
    setManualPrice('');
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

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
        customerAddress: `${address.trim()} ${city.trim()} ${state.trim()} ${zipCode.trim()}`.trim(),
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate,
        tax: taxAmount,
        total,
        notes: notes.trim(),
        paymentMethod,
        status,
        createdBy: currentUser?.uid || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      let savedInvoiceRef;
      try {
        savedInvoiceRef = await saveInvoiceOptimized(invoiceData);
      } catch (err) {
        savedInvoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);
      }

      const newInvoice = {
        id: savedInvoiceRef.id,
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onInvoiceCreated(newInvoice);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-white/90 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-7xl bg-white shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col h-full md:h-[90vh] border-4 border-brand-600"
      >
        {/* Header */}
        <div className="bg-brand-600 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">New Invoice</h2>
            <p className="text-brand-100 font-mono text-xs uppercase tracking-widest">
              {invoiceNumber} • {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row md:overflow-hidden h-auto md:h-full">
          {/* Left Column - Details */}
          <div className="w-full lg:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col md:overflow-y-auto h-auto md:h-full shrink-0">
            <div className="p-6 space-y-8">
              {/* Customer Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-600 border-b border-brand-200 pb-2">
                  <User className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Client Details</h3>
                </div>

                {!selectedCustomer ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="SEARCH CLIENTS..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 text-sm font-bold uppercase placeholder-gray-400 focus:border-brand-600 outline-none transition-colors"
                      />
                      {customerSearch && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                          {filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold uppercase"
                            >
                              {c.businessName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[10px] font-bold uppercase text-gray-400 tracking-widest">- OR -</div>

                    <div className="space-y-3">
                      <input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="BUSINESS NAME"
                        className="w-full px-4 py-2 bg-white border border-gray-200 text-sm font-bold uppercase focus:border-brand-600 outline-none"
                      />
                      <input
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="CONTACT PERSON"
                        className="w-full px-4 py-2 bg-white border border-gray-200 text-sm font-medium focus:border-brand-600 outline-none"
                      />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="EMAIL ADDRESS"
                        className="w-full px-4 py-2 bg-white border border-gray-200 text-sm font-medium focus:border-brand-600 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 border-l-4 border-brand-600 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-black uppercase tracking-tight">{selectedCustomer.businessName}</h4>
                      <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-brand-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1 text-xs font-mono text-gray-500">
                      <p>{selectedCustomer.contactPerson}</p>
                      <p>{selectedCustomer.email}</p>
                      <p>{selectedCustomer.address}, {selectedCustomer.city}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-600 border-b border-brand-200 pb-2">
                  <Calendar className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Terms & Dates</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 text-sm font-medium focus:border-brand-600 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 text-sm font-medium focus:border-brand-600 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-sm font-bold uppercase focus:border-brand-600 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="card">Credit Card</option>
                    <option value="transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Items & Totals */}
          <div className="flex-1 flex flex-col bg-white h-auto md:h-full">
            {/* Add Item Bar */}
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-4 py-3 md:py-2 bg-white border border-gray-200 text-sm font-bold uppercase focus:border-brand-600 outline-none rounded-none"
                  >
                    <option value="">Select Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.size}) - ${p.pricePerCase}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto flex-1">
                    <div className="w-full">
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 md:py-2 bg-white border border-gray-200 text-sm font-bold text-center focus:border-brand-600 outline-none"
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Price Override</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(e.target.value)}
                          placeholder="Auto"
                          className="w-full pl-6 pr-4 py-3 md:py-2 bg-white border border-gray-200 text-sm font-bold focus:border-brand-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddItem}
                    disabled={!selectedProduct}
                    className="w-full md:w-auto px-6 py-3 md:py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px] md:h-[38px] shrink-0"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 md:overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-xl font-bold uppercase tracking-widest">No Items Added</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-gray-100 hover:border-brand-200 transition-colors group">
                      <div className="flex-1 w-full sm:w-auto">
                        <h4 className="text-sm font-black uppercase tracking-tight">{item.name}</h4>
                        <p className="text-xs text-gray-500 font-mono">{item.brand} • {item.size}</p>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="w-24 text-right">
                          <p className="text-sm font-black">${item.total.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">${item.price}/case</p>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Totals */}
            <div className="p-6 bg-gray-900 text-white border-t border-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Tax Rate</span>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-16 bg-gray-800 border-none text-xs font-bold text-center text-white focus:ring-1 focus:ring-brand-600 rounded px-2 py-1"
                    />
                    <span className="text-xs font-bold text-gray-500">%</span>
                  </div>
                  {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Amount</p>
                    <p className="text-3xl font-black tracking-tighter">${total.toFixed(2)}</p>
                  </div>

                  <button
                    onClick={() => handleSaveInvoice('paid')}
                    disabled={loading || items.length === 0}
                    className="px-8 py-4 bg-brand-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors shadow-sharp-red hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <Check className="w-4 h-4" />
                        Finalize Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateInvoice;
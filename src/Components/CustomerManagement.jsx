import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  User,
  Filter,
  Download,
  X,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const CustomerManagement = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    businessType: 'restaurant',
    notes: ''
  });

  const businessTypes = [
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'bar', label: 'Bar/Pub' },
    { id: 'retail', label: 'Retail Store' },
    { id: 'distributor', label: 'Distributor' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, selectedFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const customerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(c => c.businessType === selectedFilter);
    }
    setFilteredCustomers(filtered);
  };

  const resetForm = () => {
    setFormData({
      businessName: '', contactPerson: '', email: '', phone: '',
      address: '', address2: '', city: '', state: '', zipCode: '', country: 'USA',
      businessType: 'restaurant', notes: ''
    });
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(customer);
    } else {
      setSelectedCustomer(null);
      resetForm();
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    resetForm();
    setError('');
  };

  const handleEdit = (customer) => {
    handleOpenModal(customer);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.businessName?.trim() || !formData.contactPerson?.trim() || !formData.email?.trim()) {
      setError('Please fill in all required fields: Business Name, Contact Person, and Email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const customerData = {
        ...formData,
        updatedAt: new Date()
      };

      if (selectedCustomer) {
        await updateDoc(doc(db, 'customers', selectedCustomer.id), customerData);
      } else {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          createdBy: currentUser.uid,
          createdAt: new Date()
        });
      }
      await fetchCustomers();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
        await fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Failed to delete customer');
      }
    }
  };
  
  const exportCustomers = () => {
    const csvContent = [
      ['Business Name', 'Contact Person', 'Email', 'Phone', 'Business Type', 'City', 'State'].join(','),
      ...filteredCustomers.map(c =>
        [c.businessName, c.contactPerson, c.email, c.phone, c.businessType, c.city, c.state].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomerCard = ({ customer }) => {
    const getBusinessTypeColor = (type) => {
      const colors = {
        restaurant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        bar: 'bg-amber-100 text-amber-800 border-amber-200',
        retail: 'bg-blue-100 text-blue-800 border-blue-200',
        distributor: 'bg-purple-100 text-purple-800 border-purple-200',
        hotel: 'bg-rose-100 text-rose-800 border-rose-200',
        other: 'bg-gray-100 text-gray-800 border-gray-200'
      };
      return colors[type] || colors.other;
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 cursor-pointer relative"
      >
        {/* Card Header with Gradient */}
        <div className="h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getBusinessTypeColor(customer.businessType)} backdrop-blur-sm`}>
              {customer.businessType.charAt(0).toUpperCase() + customer.businessType.slice(1)}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 -mt-4 relative">
          {/* Business Avatar */}
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 border-4 border-white">
            <Building className="w-8 h-8 text-gray-600" />
          </div>

          {/* Business Info */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors truncate">
              {customer.businessName}
            </h3>
            <div className="flex items-center text-gray-600 mb-3">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm font-medium">{customer.contactPerson}</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center group/item hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">{customer.email}</p>
              </div>
            </div>
            
            <div className="flex items-center group/item hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">{customer.phone}</p>
              </div>
            </div>

            {(customer.city || customer.state) && (
              <div className="flex items-center group/item hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Business Type</span>
              <span className="text-sm font-semibold text-gray-900 capitalize">
                {customer.businessType}
              </span>
            </div>
            {customer.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(customer);
              }}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all duration-200 group/btn"
            >
              <Edit3 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              <span className="font-medium">Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(customer.id);
              }}
              className="flex items-center justify-center p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200 group/btn"
            >
              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Customer Management
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Manage your business relationships and customer information
                </p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="font-medium">{customers.length} Total Customers</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="font-medium">{filteredCustomers.length} Currently Showing</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                    <span className="font-medium">
                      {Array.from(new Set(customers.map(c => c.businessType))).length} Business Types
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={exportCustomers}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  <Download className="w-5 h-5" />
                  <span>Export Data</span>
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customers, contacts, or businesses..."
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">Filter by type:</span>
                </div>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium bg-white min-w-[140px]"
                >
                  <option value="all">All Types</option>
                  {businessTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                
                {/* Filter indicator */}
                {(searchQuery || selectedFilter !== 'all') && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    <div className="flex space-x-2">
                      {searchQuery && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Search: "{searchQuery}"
                        </span>
                      )}
                      {selectedFilter !== 'all' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Type: {businessTypes.find(t => t.id === selectedFilter)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-900 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery || selectedFilter !== 'all' ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Get started by adding your first customer to begin building your business relationships.'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Customer</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Customer' : 'Customers'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {searchQuery || selectedFilter !== 'all' 
                    ? 'Based on your current filters' 
                    : 'All your registered customers'}
                </p>
              </div>
              
              {/* View options could go here in the future */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-500">View:</span>
                <button className="p-2 bg-gray-900 text-white rounded-lg">
                  <Building className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCustomer ? 'Edit Customer Details' : 'Add New Customer'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedCustomer ? 'Update customer information and business details' : 'Enter customer information to get started'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Essential details about the customer and business</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        Business Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Mountain View Restaurant"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        Contact Person
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        Email Address
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center">
                        Phone Number
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Business location and shipping details</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Street Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={formData.address2}
                        onChange={(e) => handleInputChange('address2', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Suite 100, Building A"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="San Francisco"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">State</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="CA"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="94102"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-6">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                    <p className="text-sm text-gray-600 mt-1">Business classification and financial terms</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Business Type</label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        {businessTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Payment Terms</label>
                      <select
                        value={formData.paymentTerms}
                        onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        {paymentTerms.map((term) => (
                          <option key={term.id} value={term.id}>{term.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Tax ID (Optional)</label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Credit Limit</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.creditLimit}
                          onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-6">
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                    <p className="text-sm text-gray-600 mt-1">Any special instructions or important information</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Internal Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Add any special notes, preferences, or important details about this customer..."
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  selectedCustomer ? 'Update Customer' : 'Save Customer'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {error && !isModalOpen && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
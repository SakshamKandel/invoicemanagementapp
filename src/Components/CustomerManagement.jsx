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
  Calendar
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
  const [successMessage, setSuccessMessage] = useState('');

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
    taxId: '',
    creditLimit: 0,
    paymentTerms: '30',
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

  const paymentTerms = [
    { id: '15', label: 'Net 15 Days' },
    { id: '30', label: 'Net 30 Days' },
    { id: '45', label: 'Net 45 Days' },
    { id: '60', label: 'Net 60 Days' },
    { id: 'cod', label: 'Cash on Delivery' },
    { id: 'prepaid', label: 'Prepaid' }
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
      businessType: 'restaurant', taxId: '', creditLimit: 0, paymentTerms: '30', notes: ''
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
    setSuccessMessage('');
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
        creditLimit: parseFloat(formData.creditLimit) || 0,
        updatedAt: new Date()
      };

      if (selectedCustomer) {
        await updateDoc(doc(db, 'customers', selectedCustomer.id), customerData);
        setSuccessMessage('Customer updated successfully!');
      } else {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          createdBy: currentUser.uid,
          createdAt: new Date()
        });
        setSuccessMessage('Customer added successfully!');
      }
      await fetchCustomers();
      handleCloseModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const confirmMessage = `Are you sure you want to delete "${customer?.businessName}"?\n\nThis action cannot be undone and will permanently remove all customer data including:\n• Contact information\n• Address details\n• Business information\n• Payment terms\n• Notes`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'customers', customerId));
        await fetchCustomers();
        // Show success message briefly
        setError('');
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Failed to delete customer. Please try again.');
      } finally {
        setLoading(false);
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
        restaurant: 'bg-amber-100 text-amber-800 border-amber-200',
        bar: 'bg-purple-100 text-purple-800 border-purple-200',
        retail: 'bg-green-100 text-green-800 border-green-200',
        distributor: 'bg-blue-100 text-blue-800 border-blue-200',
        hotel: 'bg-pink-100 text-pink-800 border-pink-200',
        other: 'bg-gray-100 text-gray-800 border-gray-200'
      };
      return colors[type] || colors.other;
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 relative flex flex-col min-h-[400px]"
      >
        {/* Customer Image/Avatar Placeholder */}
        <div className="relative h-32 bg-red-500 p-4 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          
          {/* Business Type Badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getBusinessTypeColor(customer.businessType)}`}>
              {businessTypes.find(t => t.id === customer.businessType)?.label || customer.businessType}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Location */}
          <div className="flex items-center mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate">
                {customer.city || 'Unknown City'}{customer.state ? `, ${customer.state}` : ''}
              </span>
            </div>
          </div>

          {/* Business Name */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
            {customer.businessName}
          </h3>

          {/* Contact Person */}
          <div className="flex items-center text-gray-600 mb-3">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">{customer.contactPerson}</span>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>{customer.phone}</span>
            </div>
          </div>

          {/* Address Details */}
          {(customer.address || customer.address2) && (
            <div className="mb-4">
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {customer.address && <div>{customer.address}</div>}
                  {customer.address2 && <div>{customer.address2}</div>}
                  <div>
                    {customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state} {customer.zipCode}
                  </div>
                  {customer.country && customer.country !== 'USA' && <div>{customer.country}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Business Details */}
          <div className="space-y-2 mb-4">
            {customer.taxId && (
              <div className="flex items-center text-sm text-gray-600">
                <Building className="w-4 h-4 mr-2 text-gray-400" />
                <span>Tax ID: {customer.taxId}</span>
              </div>
            )}
            
            {/* Credit & Payment Terms */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              {customer.creditLimit > 0 && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="font-medium">Credit: ${customer.creditLimit.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                <span>Net {customer.paymentTerms} Days</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{customer.notes}</p>
            </div>
          )}

          {/* Action Buttons - Only Edit and Delete */}
          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-gray-100 mt-auto">
            <button
              onClick={() => handleEdit(customer)}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
              title="Edit customer"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
            <button
              onClick={() => handleDelete(customer.id)}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              title="Delete customer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Airbnb-style Navigation Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <span className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  {customers.length} Total
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {filteredCustomers.length} Showing
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={exportCustomers}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Type:</span>
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 font-medium bg-white shadow-sm"
              >
                <option value="all">All Types</option>
                {businessTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-16 h-16 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search or filters to find customers.'
                : 'Get started by adding your first customer to the system.'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add Your First Customer
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} 
                {searchQuery && ` matching "${searchQuery}"`}
              </h2>
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500">
                <button className="flex items-center space-x-1 hover:text-gray-700">
                  <span>Sort</span>
                </button>
              </div>
            </div>
            
            {/* Customer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredCustomers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Airbnb-style Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedCustomer ? 'Update customer information' : 'Add a new customer to your database'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Basic Information */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Business Name *</label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter business name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Contact Person *</label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Address Line 1</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Address Line 2</label>
                      <input
                        type="text"
                        value={formData.address2}
                        onChange={(e) => handleInputChange('address2', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Suite, apartment, etc. (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">State</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter ZIP"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Business Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Business Type</label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      >
                        {paymentTerms.map((term) => (
                          <option key={term.id} value={term.id}>{term.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Tax ID</label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter tax ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Credit Limit ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.creditLimit}
                        onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Additional Notes</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="Add any additional notes about this customer..."
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Saving...' : selectedCustomer ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {error && !isModalOpen && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
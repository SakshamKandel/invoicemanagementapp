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
  AlertCircle,
  ArrowRight,
  DollarSign,
  Check
} from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import {
  saveCustomerOptimized,
  loadCustomersPaginated,
} from '../services/optimizedFirebaseService';
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
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

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
    permitNumber: '',
    creditLimit: '',
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

  const fetchCustomers = async (loadMore = false) => {
    try {
      setLoading(true);
      const result = await loadCustomersPaginated(20, loadMore ? lastDoc : null);

      if (loadMore) {
        setCustomers(prev => [...prev, ...result.customers]);
      } else {
        setCustomers(result.customers);
        setLastDoc(null);
      }

      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);

    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
      try {
        const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const customerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(customerList);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
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
      businessType: 'restaurant', taxId: '', permitNumber: '', creditLimit: '', notes: ''
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
    if (!formData.businessName?.trim() || !formData.contactPerson?.trim() || !formData.email?.trim() || !formData.permitNumber?.trim()) {
      setError('Please fill in all required fields: Business Name, Contact Person, Email, and Permit Number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const customerData = {
        ...formData,
        createdBy: currentUser?.uid || 'unknown'
      };

      try {
        await saveCustomerOptimized(customerData, selectedCustomer?.id);
      } catch (optimizedError) {
        console.warn('Optimized save failed, using fallback:', optimizedError);
        if (selectedCustomer) {
          await updateDoc(doc(db, 'customers', selectedCustomer.id), {
            ...customerData,
            updatedAt: new Date()
          });
        } else {
          await addDoc(collection(db, 'customers'), {
            ...customerData,
            createdAt: new Date()
          });
        }
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

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* Editorial Header */}
      <div className="border-b-4 border-brand-600 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
                Customer<br />Directory
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono uppercase tracking-widest text-gray-500">
                <span>{customers.length} Records</span>
                <span className="w-1 h-1 bg-brand-600 rounded-full"></span>
                <span>Global Distribution</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={exportCustomers}
                className="px-6 py-3 border-2 border-gray-200 hover:border-brand-600 hover:text-brand-600 text-black font-bold uppercase tracking-widest text-xs transition-all"
              >
                Export Data
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-sharp-red hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Client
                </span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH DATABASE..."
                className="w-full pl-8 pr-4 py-2 bg-transparent border-none text-xl font-bold uppercase placeholder-gray-300 focus:ring-0 focus:placeholder-gray-200 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors ${selectedFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  All
                </button>
                {businessTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedFilter(type.id)}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors ${selectedFilter === type.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fluid List Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && customers.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredCustomers.map((customer) => (
                <motion.div
                  key={customer.id}
                  variants={itemVariants}
                  layout
                  className="group relative bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Avatar / Initials */}
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0">
                      {customer.businessName.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-black uppercase tracking-tight truncate max-w-full">
                          {customer.businessName}
                        </h3>
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest border border-brand-100 whitespace-nowrap">
                          {customer.businessType}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {customer.contactPerson}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {customer.city}, {customer.state}
                        </span>
                      </div>
                    </div>

                    {/* Contact Info (Hidden on mobile, visible on hover/desktop) */}
                    <div className="hidden md:flex flex-col items-end gap-1 text-sm text-gray-400 font-mono">
                      <span className="flex items-center gap-2">
                        {customer.email} <Mail className="w-3 h-3" />
                      </span>
                      <span className="flex items-center gap-2">
                        {customer.phone} <Phone className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Actions (Always visible on mobile, slide in on hover desktop) */}
                    <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 md:transform md:translate-x-4 md:group-hover:translate-x-0">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 bg-gray-100 md:bg-transparent hover:bg-black hover:text-white transition-colors rounded md:rounded-none"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 bg-gray-100 md:bg-transparent hover:bg-brand-600 hover:text-white transition-colors rounded md:rounded-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="hidden md:block w-px h-4 bg-gray-200 mx-2"></div>
                      <ArrowRight className="hidden md:block w-4 h-4 text-gray-300 group-hover:text-black" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {hasMore && filteredCustomers.length >= 20 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => fetchCustomers(true)}
              className="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-brand-600 hover:border-brand-600 transition-colors"
            >
              Load More Records
            </button>
          </div>
        )}
      </div>

      {/* Editorial Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-white/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white border-4 border-brand-600 shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] md:flex-row"
            >
              {/* Left Sidebar - Context */}
              <div className="hidden md:flex w-1/3 bg-brand-600 text-white p-8 flex-col justify-between relative overflow-hidden shrink-0">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white text-brand-600 flex items-center justify-center font-black text-xl mb-6">
                    {selectedCustomer ? selectedCustomer.businessName.substring(0, 2).toUpperCase() : <Plus className="w-6 h-6" />}
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 leading-none">
                    {selectedCustomer ? 'Edit\nProfile' : 'New\nClient'}
                  </h2>
                  <p className="text-brand-100 font-mono text-xs uppercase tracking-widest mt-4">
                    {selectedCustomer ? `ID: ${selectedCustomer.id}` : 'Create Record'}
                  </p>
                </div>

                <div className="relative z-10 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-200 mb-1">Required</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> Business Name</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> Contact Person</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> Email Address</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 bg-white rounded-full"></div> Permit Number</li>
                    </ul>
                  </div>
                  <p className="text-[10px] text-brand-200 leading-relaxed">
                    Ensure all tax and permit information is verified before saving.
                  </p>
                </div>

                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute bottom-[-20%] right-[-20%] w-[150%] h-[150%] border-[40px] border-white rounded-full"></div>
                </div>
              </div>

              {/* Right Content - Form */}
              <div className="flex-1 flex flex-col bg-white h-auto md:h-full">
                <div className="md:hidden bg-brand-600 text-white p-6 flex justify-between items-center shrink-0">
                  <h2 className="text-xl font-black uppercase tracking-tighter">
                    {selectedCustomer ? 'Edit Client' : 'New Client'}
                  </h2>
                  <button onClick={handleCloseModal}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 md:overflow-y-auto p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Identity Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-brand-600 mb-4">
                        <Building className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Business Identity</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Business Name</label>
                          <input
                            value={formData.businessName}
                            onChange={(e) => handleInputChange('businessName', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-xl font-black uppercase tracking-tight transition-colors placeholder-gray-200 text-black"
                            placeholder="ENTER BUSINESS NAME"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact Person</label>
                          <input
                            value={formData.contactPerson}
                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-bold transition-colors placeholder-gray-200 text-black"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Business Type</label>
                          <select
                            value={formData.businessType}
                            onChange={(e) => handleInputChange('businessType', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-bold uppercase bg-transparent cursor-pointer text-black"
                          >
                            {businessTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-brand-600 mb-4">
                        <Phone className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Contact Details</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                          <input
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-medium transition-colors placeholder-gray-200 text-black"
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                          <input
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-medium transition-colors placeholder-gray-200 text-black"
                            placeholder="(555) 000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-brand-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Location</h3>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Street Address</label>
                        <input
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-medium transition-colors placeholder-gray-200 text-black"
                          placeholder="Street & Number"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">City</label>
                          <input
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-medium transition-colors placeholder-gray-200 text-black"
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">State</label>
                          <input
                            value={formData.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-medium transition-colors placeholder-gray-200 text-black"
                            placeholder="State"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-brand-600 mb-4">
                        <DollarSign className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Financial & Legal</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Permit Number</label>
                          <input
                            value={formData.permitNumber}
                            onChange={(e) => handleInputChange('permitNumber', e.target.value)}
                            className="w-full py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-mono font-medium transition-colors placeholder-gray-200 text-black"
                            placeholder="PERMIT-000"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Credit Limit</label>
                          <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                            <input
                              type="number"
                              value={formData.creditLimit}
                              onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                              className="w-full pl-4 py-2 border-b-2 border-gray-100 focus:border-brand-600 outline-none text-sm font-bold transition-colors placeholder-gray-200 text-black"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-lg text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 rounded-lg flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Save Client
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerManagement;
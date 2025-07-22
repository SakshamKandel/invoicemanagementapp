import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye,
  Download,
  FileText,
  DollarSign,
  Calendar,
  Building,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Send
} from 'lucide-react';
import { 
  Modal, 
  ModalOverlay, 
  Dialog,
  Heading
} from 'react-aria-components';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  saveInvoiceOptimized, 
  loadInvoicesOptimized, 
  batchUpdateInvoiceStatus,
  subscribeToCollectionOptimized 
} from '../services/optimizedFirebaseService';
import CreateInvoice from './CreateInvoice';
import InvoicePDF from './InvoicePDF';
import InvoicePDFService from '../services/InvoicePDFService';
import { useInvoice } from '../contexts/InvoiceContext';
import { products as fixedProducts } from '../data/products';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState(fixedProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [totalInvoices, setTotalInvoices] = useState(0);
  
  const { 
    selectedItems, 
    isCreateInvoiceOpen, 
    openCreateInvoice,
    closeCreateInvoice, 
    clearItems,
    getTotalAmount,
    getTotalItems
  } = useInvoice();


  const dateFilterOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, dateFilter]);

  // Add effect to handle search/filter changes with fresh data
  useEffect(() => {
    const handleFilterChange = async () => {
      // Clear cache when filters change to ensure fresh data
      try {
        const { clearAllCaches } = await import('../services/optimizedFirebaseService');
        clearAllCaches();
      } catch (error) {
        console.warn('Could not clear cache:', error);
      }
      
      // Debounce the fetch to avoid too many requests
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 300);

      return () => clearTimeout(timeoutId);
    };

    // Only fetch fresh data if there are active filters/search
    if (searchQuery || dateFilter !== 'all') {
      const cleanup = handleFilterChange();
      return cleanup;
    }
  }, [searchQuery, dateFilter]);

  const fetchData = async (loadMore = false) => {
    setLoading(true);
    try {
      // Get current date for filtering
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Build filters based on current state
      const filters = {
        year: dateFilter === 'year' ? currentYear : undefined,
        month: dateFilter === 'month' ? currentMonth : undefined,
        searchTerm: searchQuery
      };

      // Try optimized loading first
      try {
        const result = await loadInvoicesOptimized(filters, 15, loadMore ? lastDoc : null);
        
        if (loadMore) {
          setInvoices(prev => [...prev, ...result.invoices]);
        } else {
          setInvoices(result.invoices);
          setLastDoc(null);
        }
        
        setHasMore(result.hasMore);
        setLastDoc(result.lastDoc);
        setTotalInvoices(prev => loadMore ? prev + result.invoices.length : result.invoices.length);
        
      } catch (optimizedError) {
        console.warn('Optimized loading failed, using fallback:', optimizedError);
        
        // Fallback to original method
        const [invoicesRes, customersRes, productsRes] = await Promise.all([
          getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'customers'), orderBy('businessName'))),
          getDocs(query(collection(db, 'products'), orderBy('name')))
        ]);
        
        setInvoices(invoicesRes.docs.map(d => ({ id: d.id, ...d.data() })));
        setCustomers(customersRes.docs.map(d => ({ id: d.id, ...d.data() })));
        setProducts(productsRes.docs.map(d => ({ id: d.id, ...d.data() })));
        setTotalInvoices(invoicesRes.docs.length);
      }
      
      // Load customers and products separately (cached)
      if (!loadMore) {
        const [customersRes, productsRes] = await Promise.all([
          getDocs(query(collection(db, 'customers'), orderBy('businessName'))),
          getDocs(query(collection(db, 'products'), orderBy('name')))
        ]);
        setCustomers(customersRes.docs.map(d => ({ id: d.id, ...d.data() })));
        setProducts(productsRes.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;
    if (searchQuery) {
      filtered = filtered.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Date filtering logic remains the same
    setFilteredInvoices(filtered);
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), { status: newStatus, updatedAt: new Date() });
      
      // Clear cache to ensure fresh data
      const { clearAllCaches } = await import('../services/optimizedFirebaseService');
      clearAllCaches();
      
      // Immediately update UI
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus, updatedAt: new Date() }
          : invoice
      ));
      
      // Update filtered list as well
      setFilteredInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus, updatedAt: new Date() }
          : invoice
      ));
      
      // Fetch fresh data in background
      setTimeout(() => fetchData(), 100);
      
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError('Failed to update invoice status.');
      
      // Refresh data on error to ensure consistency
      fetchData();
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'invoices', invoiceId));
        
        // Clear cache to ensure fresh data
        const { clearAllCaches } = await import('../services/optimizedFirebaseService');
        clearAllCaches();
        
        // Immediately update UI by removing from local state
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
        setFilteredInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
        
        // Fetch fresh data in background
        setTimeout(() => fetchData(), 100);
        
      } catch (err) {
        console.error('Error deleting invoice:', err);
        setError('Failed to delete invoice.');
        
        // Refresh data on error to ensure consistency
        fetchData();
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getStatusPill = (status) => {
    const statusMap = {
      paid: { icon: CheckCircle, color: 'green', label: 'Paid' },
      completed: { icon: CheckCircle, color: 'green', label: 'Completed' },
    };
    const { icon: Icon, color, label } = statusMap[status] || { icon: CheckCircle, color: 'green', label: 'Paid' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        <Icon className={`w-4 h-4 mr-1.5 text-${color}-500`} />
        {label}
      </span>
    );
  };

  const generatePDF = async (invoice) => {
    try {
      console.log('🚀 Starting professional PDF generation for invoice:', invoice.invoiceNumber);
      
      const pdfService = new InvoicePDFService();
      const filename = `Peak-Brew-Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      
      await pdfService.downloadPDF(invoice, filename);
      
      console.log(`✅ Professional PDF generated and downloaded: ${filename}`);
      
      return true;
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
      throw error;
    }
  };

  // Function to automatically download PDF after invoice creation
  const handleInvoiceCreated = async (newInvoice) => {
    try {
      closeCreateInvoice();
      clearItems();
      
      // Clear cache to ensure fresh data
      const { clearAllCaches } = await import('../services/optimizedFirebaseService');
      clearAllCaches();
      
      // If we receive the new invoice directly, add it immediately to the UI
      if (newInvoice) {
        console.log('🚀 New invoice received, updating UI immediately:', newInvoice.invoiceNumber);
        
        // Immediately update the local state with the new invoice
        setInvoices(prev => [newInvoice, ...prev]);
        setFilteredInvoices(prev => [newInvoice, ...prev]);
        
        // Auto-generate PDF for the new invoice
        try {
          console.log('🚀 Auto-generating PDF for invoice:', newInvoice.invoiceNumber);
          await generatePDF(newInvoice);
          console.log('✅ PDF auto-downloaded successfully');
        } catch (pdfError) {
          console.error('❌ Auto PDF generation failed:', pdfError);
        }
      }
      
      // Refresh data in background to ensure consistency
      setTimeout(async () => {
        try {
          await fetchData();
        } catch (error) {
          console.error('Background refresh failed:', error);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error in handleInvoiceCreated:', error);
      // Still close and refresh even if something fails
      closeCreateInvoice();
      clearItems();
      
      // Force refresh data
      setTimeout(() => fetchData(), 100);
    }
  };

  const InvoiceCard = ({ invoice }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Building className="w-4 h-4 mr-2 text-gray-400" />
              {invoice.customerName}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Total Amount:</span>
            <span className="font-bold text-lg text-gray-800">{formatCurrency(invoice.total || invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Issue Date:</span>
            <span className="font-medium">{formatDate(invoice.createdAt)}</span>
          </div>
          {invoice.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-medium capitalize">{invoice.paymentMethod}</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusPill(invoice.status)}
          </div>
          {invoice.status === 'paid' && (
            <button 
              onClick={() => updateInvoiceStatus(invoice.id, 'completed')} 
              className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium hover:bg-emerald-200 transition-colors"
              title="Mark as Completed"
            >
              Complete
            </button>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={() => { setSelectedInvoice(invoice); setIsPreviewModalOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors" title="Preview Invoice">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => generatePDF(invoice)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors" title="Download PDF">
            <Download className="w-4 h-4" />
          </button>
          {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors" title="Download Stored PDF"><FileText className="w-4 h-4" /></a>}
          <button onClick={() => deleteInvoice(invoice.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-gray-500">Create, manage, and track your invoices.</p>
          {selectedItems.length > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {getTotalItems()} items selected (${getTotalAmount().toFixed(2)})
              </div>
              <button 
                onClick={() => openCreateInvoice()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                Create Invoice with Selected Items
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <button 
            onClick={() => {
              // Clear cache and refresh data
              const refreshData = async () => {
                try {
                  const { clearAllCaches } = await import('../services/optimizedFirebaseService');
                  clearAllCaches();
                  await fetchData();
                } catch (error) {
                  console.error('Error refreshing data:', error);
                  fetchData(); // Fallback
                }
              };
              refreshData();
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Refresh Invoice List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={() => { clearItems(); openCreateInvoice(); }} 
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search invoices..." 
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" 
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              {dateFilterOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No invoices found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first invoice.</p>
          <button onClick={() => { clearItems(); openCreateInvoice(); }} className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600">Create Invoice</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredInvoices.map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)}
          </AnimatePresence>
        </div>
      )}

      <ModalOverlay isOpen={isCreateInvoiceOpen} onOpenChange={closeCreateInvoice} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
        <Modal className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          <CreateInvoice 
            customers={customers} 
            products={products} 
            onClose={() => {
              closeCreateInvoice();
              // Don't clear items automatically - let user decide
            }} 
            onInvoiceCreated={handleInvoiceCreated} 
          />
        </Modal>
      </ModalOverlay>

      <ModalOverlay isOpen={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
        <Modal className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[98vh] overflow-hidden mx-2 sm:mx-4">
          <Dialog className="outline-none p-3 sm:p-6 max-h-[98vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
              <Heading className="text-xl sm:text-2xl font-bold text-gray-800">Invoice Preview</Heading>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => selectedInvoice && generatePDF(selectedInvoice)} 
                  className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 sm:space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
                <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 text-gray-500 hover:text-red-500 rounded-full"><XCircle className="w-6 h-6" /></button>
              </div>
            </div>
            {selectedInvoice && <InvoicePDF invoice={selectedInvoice} isPreview={true} />}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
};

export default InvoiceManagement;

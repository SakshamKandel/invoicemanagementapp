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
  Send,
  ArrowUpRight,
  MoreHorizontal
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
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    };
    const { color, label } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${color}`}>
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
              <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">
                Invoice<br />Records
              </h1>
              <div className="flex items-center gap-4 text-sm font-mono uppercase tracking-widest text-gray-500">
                <span>{totalInvoices} Documents</span>
                <span className="w-1 h-1 bg-brand-600 rounded-full"></span>
                <span>Fiscal Year 2025</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const refreshData = async () => {
                    try {
                      const { clearAllCaches } = await import('../services/optimizedFirebaseService');
                      clearAllCaches();
                      await fetchData();
                    } catch (error) {
                      fetchData();
                    }
                  };
                  refreshData();
                }}
                className="px-6 py-3 border-2 border-gray-200 hover:border-brand-600 hover:text-brand-600 text-black font-bold uppercase tracking-widest text-xs transition-all"
              >
                Refresh
              </button>
              <button
                onClick={() => { clearItems(); openCreateInvoice(); }}
                className="px-6 py-3 bg-brand-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-sharp-red hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Invoice
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
                placeholder="SEARCH INVOICES..."
                className="w-full pl-8 pr-4 py-2 bg-transparent border-none text-xl font-bold uppercase placeholder-gray-300 focus:ring-0 focus:placeholder-gray-200 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-100 text-xs font-bold uppercase tracking-widest px-4 py-2 border-none outline-none focus:ring-0 cursor-pointer hover:bg-gray-200 transition-colors"
              >
                {dateFilterOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fluid List Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && filteredInvoices.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-bold uppercase tracking-widest">No Invoices Found</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  variants={itemVariants}
                  layout
                  className="group relative bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Status Indicator */}
                    <div className={`w-1 self-stretch ${invoice.status === 'paid' ? 'bg-green-500' : invoice.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                      <div className="col-span-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice #</p>
                        <h3 className="text-xl font-black text-black uppercase tracking-tight">{invoice.invoiceNumber}</h3>
                      </div>

                      <div className="col-span-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Client</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{invoice.customerName}</p>
                      </div>

                      <div className="col-span-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="text-sm font-mono text-gray-600">{formatDate(invoice.createdAt)}</p>
                      </div>

                      <div className="col-span-1 text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                        <p className="text-xl font-black text-black">{formatCurrency(invoice.total || invoice.totalAmount)}</p>
                      </div>
                    </div>

                    {/* Actions (Slide in on hover) */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-x-4 group-hover:translate-x-0">
                      {invoice.status !== 'paid' && invoice.status !== 'completed' && (
                        <button
                          onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                          className="p-2 hover:bg-green-500 hover:text-white transition-colors"
                          title="Mark Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedInvoice(invoice); setIsPreviewModalOpen(true); }}
                        className="p-2 hover:bg-black hover:text-white transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generatePDF(invoice)}
                        className="p-2 hover:bg-black hover:text-white transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="p-2 hover:bg-brand-600 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <ModalOverlay isOpen={isCreateInvoiceOpen} onOpenChange={closeCreateInvoice} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
        <Modal className="bg-white rounded-none border-4 border-brand-600 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          <CreateInvoice
            customers={customers}
            products={products}
            onClose={() => {
              closeCreateInvoice();
            }}
            onInvoiceCreated={handleInvoiceCreated}
          />
        </Modal>
      </ModalOverlay>

      {/* Preview Modal */}
      <ModalOverlay isOpen={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <Modal className="bg-white rounded-none border-4 border-brand-600 shadow-2xl w-full max-w-6xl max-h-[98vh] overflow-hidden flex flex-col">
          <Dialog className="outline-none flex flex-col h-full">
            <div className="bg-brand-600 text-white p-6 flex justify-between items-center shrink-0">
              <Heading className="text-2xl font-black uppercase tracking-tighter">Invoice Preview</Heading>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => selectedInvoice && generatePDF(selectedInvoice)}
                  className="px-4 py-2 bg-white text-brand-600 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  Download PDF
                </button>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-white hover:text-black transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {selectedInvoice && <InvoicePDF invoice={selectedInvoice} isPreview={true} />}
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
};

export default InvoiceManagement;

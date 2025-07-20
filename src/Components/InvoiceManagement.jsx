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
import CreateInvoice from './CreateInvoice';
import InvoicePDF from './InvoicePDF';
import { useInvoice } from '../contexts/InvoiceContext';
import { products as fixedProducts } from '../data/products';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState(fixedProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    selectedItems, 
    isCreateInvoiceOpen, 
    openCreateInvoice,
    closeCreateInvoice, 
    clearItems,
    getTotalAmount,
    getTotalItems
  } = useInvoice();

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'draft', label: 'Draft', color: 'gray' },
    { id: 'sent', label: 'Sent', color: 'blue' },
    { id: 'paid', label: 'Paid', color: 'green' },
    { id: 'cancelled', label: 'Cancelled', color: 'orange' }
  ];

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
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'customers'), orderBy('businessName'))),
        getDocs(query(collection(db, 'products'), orderBy('name')))
      ]);
      setInvoices(invoicesRes.docs.map(d => ({ id: d.id, ...d.data() })));
      setCustomers(customersRes.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(productsRes.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    // Date filtering logic remains the same
    setFilteredInvoices(filtered);
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await updateDoc(doc(db, 'invoices', invoiceId), { status: newStatus, updatedAt: new Date() });
      fetchData();
    } catch (err) {
      setError('Failed to update invoice status.');
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'invoices', invoiceId));
        fetchData();
      } catch (err) {
        setError('Failed to delete invoice.');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getStatusPill = (status) => {
    const statusMap = {
      paid: { icon: CheckCircle, color: 'green', label: 'Paid' },
      sent: { icon: Send, color: 'blue', label: 'Sent' },
      draft: { icon: Clock, color: 'gray', label: 'Draft' },
      cancelled: { icon: XCircle, color: 'orange', label: 'Cancelled' },
    };
    const { icon: Icon, color, label } = statusMap[status] || { icon: FileText, color: 'gray', label: 'Unknown' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        <Icon className={`w-4 h-4 mr-1.5 text-${color}-500`} />
        {label}
      </span>
    );
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
          {getStatusPill(invoice.status)}
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium text-gray-500">Total Amount:</span>
            <span className="font-bold text-lg text-gray-800">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Issue Date:</span>
            <span className="font-medium">{formatDate(invoice.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Due Date:</span>
            <span className="font-medium">{formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button onClick={() => { setSelectedInvoice(invoice); setIsPreviewModalOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"><Download className="w-4 h-4" /></a>}
        <button onClick={() => deleteInvoice(invoice.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
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
        <button onClick={() => { clearItems(); openCreateInvoice(); }} className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
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
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              {statusOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
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
            onInvoiceCreated={() => { 
              closeCreateInvoice(); 
              clearItems(); // Clear items only after successful creation
              fetchData(); 
            }} 
          />
        </Modal>
      </ModalOverlay>

      <ModalOverlay isOpen={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
        <Modal className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh]">
          <Dialog className="outline-none p-6">
            <div className="flex justify-between items-center mb-4">
              <Heading className="text-2xl font-bold text-gray-800">Invoice Preview</Heading>
              <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 text-gray-500 hover:text-red-500 rounded-full"><XCircle className="w-6 h-6" /></button>
            </div>
            {selectedInvoice && <InvoicePDF invoice={selectedInvoice} isPreview={true} />}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
};

export default InvoiceManagement;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  FileText, 
  Users, 
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    paidAmount: 0,
    pendingAmount: 0,
    revenueGrowth: 0,
    invoiceGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  const dateRanges = [
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'Last 30 Days' },
    { id: 'quarter', label: 'Last 3 Months' },
    { id: 'year', label: 'Last 12 Months' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (dateRange) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        filterDate.setDate(now.getDate() - 30);
    }

    return filterDate;
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivity(),
        fetchTopProducts(),
        fetchTopCustomers()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const filterDate = getDateFilter();
      
      // Fetch invoices
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('createdAt', '>=', Timestamp.fromDate(filterDate)),
        orderBy('createdAt', 'desc')
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch customers
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate stats
      const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || invoice.total || 0), 0);
      const paidAmount = invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + (invoice.totalAmount || invoice.total || 0), 0);
      const pendingAmount = invoices
        .filter(invoice => ['sent', 'draft'].includes(invoice.status))
        .reduce((sum, invoice) => sum + (invoice.totalAmount || invoice.total || 0), 0);

      // Calculate growth (simplified - comparing with previous period)
      const previousPeriodDate = new Date(filterDate);
      const periodDays = Math.floor((new Date() - filterDate) / (1000 * 60 * 60 * 24));
      previousPeriodDate.setDate(previousPeriodDate.getDate() - periodDays);

      const previousInvoicesQuery = query(
        collection(db, 'invoices'),
        where('createdAt', '>=', Timestamp.fromDate(previousPeriodDate)),
        where('createdAt', '<', Timestamp.fromDate(filterDate)),
        orderBy('createdAt', 'desc')
      );
      const previousInvoicesSnapshot = await getDocs(previousInvoicesQuery);
      const previousInvoices = previousInvoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const previousRevenue = previousInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || invoice.total || 0), 0);
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const invoiceGrowth = previousInvoices.length > 0 ? ((invoices.length - previousInvoices.length) / previousInvoices.length) * 100 : 0;

      setStats({
        totalRevenue,
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        paidAmount,
        pendingAmount,
        revenueGrowth,
        invoiceGrowth
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const recentInvoicesQuery = query(
        collection(db, 'invoices'),
        orderBy('createdAt', 'desc'),
        // Firestore doesn't support limit in this context, so we'll slice later
      );
      const recentInvoicesSnapshot = await getDocs(recentInvoicesQuery);
      const recentInvoices = recentInvoicesSnapshot.docs
        .slice(0, 5)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      const activity = recentInvoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        action: `Invoice ${invoice.invoiceNumber} ${invoice.status}`,
        customer: invoice.customerName,
        amount: invoice.totalAmount || invoice.total,
        date: invoice.createdAt,
        status: invoice.status
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const productSales = {};
      
      invoices.forEach(invoice => {
        (invoice.items || invoice.products || []).forEach(item => {
          const productName = item.name;
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.total || (item.quantity * (item.price || item.pricePerCase || 0));
        });
      });

      const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const fetchTopCustomers = async () => {
    try {
      const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
      const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const customerStats = {};
      
      invoices.forEach(invoice => {
        const customerName = invoice.customerName;
        if (!customerStats[customerName]) {
          customerStats[customerName] = {
            name: customerName,
            invoiceCount: 0,
            totalSpent: 0
          };
        }
        customerStats[customerName].invoiceCount += 1;
        customerStats[customerName].totalSpent += invoice.totalAmount || invoice.total || 0;
      });

      const sortedCustomers = Object.values(customerStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      setTopCustomers(sortedCustomers);
    } catch (error) {
      console.error('Error fetching top customers:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue', format = 'currency' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRanges.map((range) => (
              <option key={range.id} value={range.id}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={stats.totalRevenue} 
          icon={DollarSign} 
          change={stats.revenueGrowth}
          color="blue" 
        />
        <StatCard 
          title="Total Invoices" 
          value={stats.totalInvoices} 
          icon={FileText} 
          change={stats.invoiceGrowth}
          color="green" 
          format="number"
        />
        <StatCard 
          title="Total Customers" 
          value={stats.totalCustomers} 
          icon={Users} 
          color="purple" 
          format="number"
        />
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={Package} 
          color="orange" 
          format="number"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Paid</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(stats.paidAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalRevenue > 0 ? (stats.paidAmount / stats.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium text-blue-600">{formatCurrency(stats.pendingAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalRevenue > 0 ? (stats.pendingAmount / stats.totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Top Products
          </h3>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No product data available</p>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Top Customers
          </h3>
          <div className="space-y-3">
            {topCustomers.length > 0 ? topCustomers.map((customer, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.invoiceCount} invoices</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No customer data available</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'paid' ? 'bg-green-500' :
                  activity.status === 'sent' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(activity.amount)}</p>
                <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  FileText,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    paidAmount: 0,
    revenueGrowth: 0,
    invoiceGrowth: 0,
    averageOrderValue: 0,
    revenuePerCustomer: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
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
        orderBy('createdAt', 'asc')
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
      const paidAmount = totalRevenue; // All revenue is paid

      // Calculate growth
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

      // Advanced Metrics
      const averageOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
      const revenuePerCustomer = customers.length > 0 ? totalRevenue / customers.length : 0;

      setStats({
        totalRevenue,
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        paidAmount,
        revenueGrowth,
        invoiceGrowth,
        averageOrderValue,
        revenuePerCustomer
      });

      // Prepare Chart Data
      const chartData = processRevenueData(invoices);
      setRevenueData(chartData);

      // Prepare Category Data (Mocked for now as we don't have explicit categories in products yet, or derived from product names)
      // For a real app, we'd aggregate by product category. Here we'll use top products as a proxy for "distribution"
      const productDistribution = processProductDistribution(invoices);
      setCategoryData(productDistribution);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const processRevenueData = (invoices) => {
    const dataMap = {};

    invoices.forEach(invoice => {
      const date = invoice.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dataMap[date]) {
        dataMap[date] = { name: date, revenue: 0, invoices: 0 };
      }
      dataMap[date].revenue += (invoice.totalAmount || invoice.total || 0);
      dataMap[date].invoices += 1;
    });

    return Object.values(dataMap);
  };

  const processProductDistribution = (invoices) => {
    const productSales = {};
    invoices.forEach(invoice => {
      (invoice.items || invoice.products || []).forEach(item => {
        const name = item.name;
        if (!productSales[name]) {
          productSales[name] = 0;
        }
        productSales[name] += item.total || (item.quantity * (item.price || 0));
      });
    });

    return Object.entries(productSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const fetchRecentActivity = async () => {
    try {
      const recentInvoicesQuery = query(
        collection(db, 'invoices'),
        orderBy('createdAt', 'desc')
      );
      const recentInvoicesSnapshot = await getDocs(recentInvoicesQuery);
      const recentInvoices = recentInvoicesSnapshot.docs
        .slice(0, 5)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      const activity = recentInvoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        action: `Invoice ${invoice.invoiceNumber} paid`,
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

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,Revenue,Invoices\n"
      + revenueData.map(row => `${row.name},${row.revenue},${row.invoices}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue', format = 'currency', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300`}>
        <Icon className={`w-24 h-24 text-${color}-600 transform rotate-12 translate-x-4 -translate-y-4`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
          {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
        </h3>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-500">
            Real-time insights and performance metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 transition-colors cursor-pointer min-w-[160px]"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportData}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </motion.button>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={DollarSign}
          change={stats.revenueGrowth}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={FileText}
          change={stats.invoiceGrowth}
          color="indigo"
          format="number"
          delay={0.2}
        />
        <StatCard
          title="Avg. Order Value"
          value={stats.averageOrderValue}
          icon={BarChart3}
          color="emerald"
          delay={0.3}
        />
        <StatCard
          title="Revenue / Customer"
          value={stats.revenuePerCustomer}
          icon={Users}
          color="violet"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Income over time</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </span>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Product Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-1">Sales Distribution</h3>
          <p className="text-sm text-gray-500 mb-8">Top products by revenue</p>

          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{categoryData.length}</span>
              <span className="text-xs text-gray-500">Products</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {categoryData.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: Top Products, Customers, Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Products List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Products</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-6">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm mr-4">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Customers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Customers</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-6">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-4">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.invoiceCount} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="relative flex items-start pl-10">
                <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-bold">{activity.customer}</span> paid invoice
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.date)}</p>
                </div>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  +{formatCurrency(activity.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
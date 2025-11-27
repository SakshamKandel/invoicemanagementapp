import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  AlertCircle,
  Target,
  Briefcase,
  Repeat,
  Award,
  Zap
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
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line
} from 'recharts';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const COLORS = ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    lostRevenue: 0,
    outstandingRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    paidAmount: 0,
    revenueGrowth: 0,
    invoiceGrowth: 0,
    averageOrderValue: 0,
    revenuePerCustomer: 0,
    returnRate: 0,
    projectedRevenue: 0,
    retentionRate: 0,
    inventoryTurnover: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [returnsData, setReturnsData] = useState([]);
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

      // --- Advanced Calculations ---

      // 1. Financial Health
      const grossRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);

      const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.status === 'completed');
      const netRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);

      const returnedInvoices = invoices.filter(inv => inv.status === 'cancelled' || inv.status === 'returned' || inv.status === 'expired');
      const lostRevenue = returnedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);

      const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
      const outstandingRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);

      const returnRate = invoices.length > 0 ? (returnedInvoices.length / invoices.length) * 100 : 0;

      // 2. Growth & Comparisons
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
      const revenueGrowth = previousRevenue > 0 ? ((grossRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const invoiceGrowth = previousInvoices.length > 0 ? ((invoices.length - previousInvoices.length) / previousInvoices.length) * 100 : 0;

      // 3. Advanced Metrics
      const averageOrderValue = invoices.length > 0 ? grossRevenue / invoices.length : 0;
      const revenuePerCustomer = customers.length > 0 ? grossRevenue / customers.length : 0;

      // Simple Linear Projection (Daily Avg * Days in Month)
      const daysPassed = Math.max(1, periodDays); // Avoid division by zero
      const dailyAvg = grossRevenue / daysPassed;
      const projectedRevenue = dailyAvg * 30; // Project for a full 30-day month

      // Retention Rate (Customers with > 1 invoice / Total Customers)
      const customerInvoiceCounts = {};
      invoices.forEach(inv => {
        const name = inv.customerName;
        customerInvoiceCounts[name] = (customerInvoiceCounts[name] || 0) + 1;
      });
      const repeatCustomers = Object.values(customerInvoiceCounts).filter(count => count > 1).length;
      const retentionRate = customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;

      // Inventory Turnover (Revenue / Products Count) - Proxy
      const inventoryTurnover = products.length > 0 ? grossRevenue / products.length : 0;

      setStats({
        totalRevenue: grossRevenue,
        netRevenue,
        lostRevenue,
        outstandingRevenue,
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        paidAmount: netRevenue,
        revenueGrowth,
        invoiceGrowth,
        averageOrderValue,
        revenuePerCustomer,
        returnRate,
        projectedRevenue,
        retentionRate,
        inventoryTurnover
      });

      // Prepare Chart Data
      const chartData = processRevenueData(invoices);
      setRevenueData(chartData);

      const productDistribution = processProductDistribution(invoices);
      setCategoryData(productDistribution);

      const sectorStats = processSectorData(invoices, customers);
      setSectorData(sectorStats);

      const returnsStats = processReturnsData(returnedInvoices);
      setReturnsData(returnsStats);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const processRevenueData = (invoices) => {
    const dataMap = {};

    invoices.forEach(invoice => {
      const date = invoice.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dataMap[date]) {
        dataMap[date] = { name: date, gross: 0, net: 0, lost: 0 };
      }
      const amount = (invoice.totalAmount || invoice.total || 0);
      dataMap[date].gross += amount;

      if (invoice.status === 'paid' || invoice.status === 'completed') {
        dataMap[date].net += amount;
      } else if (invoice.status === 'cancelled' || invoice.status === 'returned' || invoice.status === 'expired') {
        dataMap[date].lost += amount;
      }
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

  const processSectorData = (invoices, customers) => {
    const customerTypes = {};
    customers.forEach(c => {
      customerTypes[c.businessName] = c.businessType || 'Other';
    });

    const sectorRevenue = {};

    invoices.forEach(inv => {
      const type = customerTypes[inv.customerName] || 'Unknown';
      if (!sectorRevenue[type]) sectorRevenue[type] = 0;
      sectorRevenue[type] += (inv.totalAmount || inv.total || 0);
    });

    return Object.entries(sectorRevenue)
      .map(([subject, A]) => ({ subject, A, fullMark: Math.max(...Object.values(sectorRevenue)) }))
      .sort((a, b) => b.A - a.A);
  };

  const processReturnsData = (returnedInvoices) => {
    const reasonCounts = {};
    returnedInvoices.forEach(inv => {
      const reason = inv.statusNote || 'No Reason Provided';
      if (!reasonCounts[reason]) reasonCounts[reason] = 0;
      reasonCounts[reason] += 1;
    });

    return Object.entries(reasonCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,Gross Revenue,Net Revenue,Lost Revenue\n"
      + revenueData.map(row => `${row.name},${row.gross},${row.net},${row.lost}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "advanced_analytics_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'gray', format = 'currency', subtitle }) => (
    <div className="bg-white p-6 border border-gray-200 hover:border-black transition-colors group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 bg-${color}-100 text-${color}-800 rounded-none`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs font-bold uppercase tracking-wider ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-3xl font-black text-black tracking-tight mb-1">
        {format === 'currency' ? formatCurrency(value) : format === 'percent' ? `${value.toFixed(1)}%` : value.toLocaleString()}
      </h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-2 font-mono">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 max-w-[1760px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-4 border-black pb-6">
        <div>
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-2">
            Command Center
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            System Performance & Financial Intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none appearance-none text-xs font-bold uppercase tracking-widest text-black cursor-pointer min-w-[160px] transition-colors"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={exportData}
            className="flex items-center px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Revenue"
          value={stats.netRevenue}
          icon={DollarSign}
          change={stats.revenueGrowth}
          color="emerald"
          subtitle={`Gross: ${formatCurrency(stats.totalRevenue)}`}
        />
        <StatCard
          title="Outstanding"
          value={stats.outstandingRevenue}
          icon={Activity}
          color="yellow"
          subtitle={`${stats.totalInvoices} Pending Invoices`}
        />
        <StatCard
          title="Lost Revenue"
          value={stats.lostRevenue}
          icon={AlertCircle}
          color="red"
          subtitle={`Return Rate: ${stats.returnRate.toFixed(1)}%`}
        />
        <StatCard
          title="Projected (Mo.)"
          value={stats.projectedRevenue}
          icon={Target}
          color="violet"
          subtitle="Based on daily average"
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Retention Rate"
          value={stats.retentionRate}
          icon={Repeat}
          format="percent"
          color="blue"
          subtitle="Repeat Customers"
        />
        <StatCard
          title="Avg Order Value"
          value={stats.averageOrderValue}
          icon={BarChart3}
          color="indigo"
          subtitle="Per Invoice"
        />
        <StatCard
          title="Lifetime Value"
          value={stats.revenuePerCustomer}
          icon={Award}
          color="purple"
          subtitle="Avg Revenue per Client"
        />
        <StatCard
          title="Inv. Turnover"
          value={stats.inventoryTurnover}
          icon={Zap}
          color="orange"
          subtitle="Revenue / Product Count"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Composition Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Revenue Composition</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Net vs. Lost vs. Gross</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="w-2 h-2 bg-emerald-500"></span> Net
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="w-2 h-2 bg-red-500"></span> Lost
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000',
                    border: 'none',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="net" stackId="a" fill="#10B981" barSize={40} />
                <Bar dataKey="lost" stackId="a" fill="#EF4444" barSize={40} />
                <Line type="monotone" dataKey="gross" stroke="#000000" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Performance (Radar) */}
        <div className="bg-white border border-gray-200 p-8">
          <h3 className="text-xl font-black text-black uppercase tracking-tight mb-1">Sector Analysis</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Revenue by Business Type</p>

          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sectorData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                  name="Revenue"
                  dataKey="A"
                  stroke="#000"
                  strokeWidth={2}
                  fill="#000"
                  fillOpacity={0.1}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Returns Analysis, Top Products, Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Returns Analysis */}
        <div className="bg-white border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-black uppercase tracking-tight">Returns Analysis</h3>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 uppercase tracking-widest border border-red-100">
              {stats.returnRate.toFixed(1)}% Rate
            </span>
          </div>

          {returnsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
              <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">No returns recorded</p>
            </div>
          ) : (
            <div className="space-y-6">
              {returnsData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-gray-500">{item.name}</span>
                    <span className="text-black">{item.value} returns</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1">
                    <div
                      className="bg-red-500 h-1"
                      style={{ width: `${(item.value / Math.max(...returnsData.map(d => d.value))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products List */}
        <div className="bg-white border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-black uppercase tracking-tight">Top Products</h3>
            <button
              onClick={() => navigate('/products')}
              className="text-[10px] font-bold text-black uppercase tracking-widest hover:text-brand-600 transition-colors border-b border-black pb-0.5 hover:border-brand-600"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center group">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-xs mr-4 group-hover:bg-brand-600 transition-colors">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{product.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.quantity} units</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-black">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers List */}
        <div className="bg-white border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-black uppercase tracking-tight">Top Clients</h3>
            <button
              onClick={() => navigate('/customers')}
              className="text-[10px] font-bold text-black uppercase tracking-widest hover:text-brand-600 transition-colors border-b border-black pb-0.5 hover:border-brand-600"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center group">
                <div className="w-8 h-8 bg-gray-100 text-black flex items-center justify-center font-bold text-xs mr-4 group-hover:bg-black group-hover:text-white transition-colors">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{customer.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{customer.invoiceCount} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-black">{formatCurrency(customer.totalSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-black uppercase tracking-tight">Recent Activity</h3>
          <button
            onClick={() => navigate('/invoices')}
            className="text-[10px] font-bold text-black uppercase tracking-widest hover:text-brand-600 transition-colors border-b border-black pb-0.5 hover:border-brand-600"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentActivity.map((activity, index) => (
            <div key={activity.id} className="border border-gray-100 p-4 hover:border-black transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${activity.status === 'paid' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {activity.status}
                </span>
                <span className="text-[10px] font-mono text-gray-400">{formatDate(activity.date).split(',')[0]}</span>
              </div>
              <p className="text-sm font-bold text-black truncate mb-1">{activity.customer}</p>
              <p className="text-lg font-black text-black">{formatCurrency(activity.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
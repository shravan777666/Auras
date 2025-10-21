import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import { salonService } from '../../services/salon';
import { revenueService } from '../../services/revenue';
import AddExpenseModal from '../../components/salon/AddExpenseModal';
import NextWeekFinancialForecast from '../../components/salon/NextWeekFinancialForecast';
import LoyaltyAnalyticsCard from '../../components/salon/LoyaltyAnalyticsCard';
import TopLoyaltyClients from '../../components/salon/TopLoyaltyClients';
import { 
  CreditCard, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Filter, 
  Download,
  Calendar,
  Tag,
  FileText,
  Loader2,
  Edit,
  Trash2,
  DollarSign,
  BarChart3,
  Users,
  Eye
} from 'lucide-react';

// Mini sparkline component
const Sparkline = ({ data, color = 'green' }) => {
  if (!data || data.length === 0) return null;
  
  // Normalize data to fit in a small space
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1; // Avoid division by zero
  
  // Create SVG path for the sparkline
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <polyline 
        points={points} 
        fill="none" 
        stroke={color === 'green' ? '#10B981' : '#EF4444'} 
        strokeWidth="2" 
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const FinancialDashboard = () => {
  const navigate = useNavigate();
  
  // Expense state (existing)
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyExpensesChange, setMonthlyExpensesChange] = useState(0);
  const [monthlyExpensesChangeStatus, setMonthlyExpensesChangeStatus] = useState('N/A');
  const [expenseTrend, setExpenseTrend] = useState([]);
  
  // Revenue state (new)
  const [revenueData, setRevenueData] = useState({});
  const [revenueRecords, setRevenueRecords] = useState([]);
  const [filteredRevenueRecords, setFilteredRevenueRecords] = useState([]);
  
  // UI state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [filter, setFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');

  // Fetch all financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        
        // Fetch expenses with trend analysis (existing)
        const expenseResponse = await salonService.getExpenses({ limit: 100 });
        const expensesData = expenseResponse.data?.expenses || [];
        const expenseTrendData = expenseResponse.data?.expenseTrend || [];
        
        // Fetch revenue data with trend analysis (new)
        const revenueResponse = await revenueService.getRevenueData();
        const revenueRecordsResponse = await revenueService.getRevenueRecords({ limit: 50 });
        
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
        setRevenueData(revenueResponse.data);
        setRevenueRecords(revenueRecordsResponse.data.records || []);
        setFilteredRevenueRecords(revenueRecordsResponse.data.records || []);
        
        // Set expense trend data
        setExpenseTrend(expenseTrendData);
        
        // Set monthly expenses comparison data
        setMonthlyExpenses(expenseResponse.data?.currentMonthExpenses || 0);
        setMonthlyExpensesChange(expenseResponse.data?.monthlyExpensesChange || 0);
        setMonthlyExpensesChangeStatus(expenseResponse.data?.monthlyExpensesChangeStatus || 'N/A');
        
        // Set total expenses
        setTotalExpenses(expenseResponse.data?.totalExpenses || 0);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Error fetching financial data:', error);
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  // Calculate net profit: Total Revenue - Total Expenses
  const netProfit = revenueService.calculateProfit(
    revenueData.totalRevenue || 0, 
    totalExpenses
  );
  const profitStatus = revenueService.getProfitStatus(netProfit);

  // Filter functions
  useEffect(() => {
    let filtered = [...expenses];
    if (filter !== 'all') {
      filtered = filtered.filter(expense => expense.category === filter);
    }
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(dateRange.start) && expenseDate <= new Date(dateRange.end);
      });
    }
    setFilteredExpenses(filtered);
  }, [filter, dateRange, expenses]);

  useEffect(() => {
    let filtered = [...revenueRecords];
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(dateRange.start) && recordDate <= new Date(dateRange.end);
      });
    }
    setFilteredRevenueRecords(filtered);
  }, [dateRange, revenueRecords]);

  const handleAddExpense = async (expenseData) => {
    try {
      await salonService.addExpense(expenseData);
      toast.success('Expense added successfully!');
      
      // Refresh the expense list
      const expenseResponse = await salonService.getExpenses({ limit: 100 });
      const expensesData = expenseResponse.data?.expenses || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      
      // Recalculate totals
      setTotalExpenses(expenseResponse.data?.totalExpenses || 0);
      setMonthlyExpenses(expenseResponse.data?.currentMonthExpenses || 0);
      setMonthlyExpensesChange(expenseResponse.data?.monthlyExpensesChange || 0);
      setMonthlyExpensesChangeStatus(expenseResponse.data?.monthlyExpensesChangeStatus || 'N/A');
      setExpenseTrend(expenseResponse.data?.expenseTrend || []);
      
      // Update categories
      const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleExportRevenue = () => {
    try {
      revenueService.exportToCSV(filteredRevenueRecords, 'revenue_records');
      toast.success('Revenue data exported successfully!');
    } catch (error) {
      toast.error('Failed to export revenue data');
    }
  };

  const handleEditExpense = (expense) => {
    if (operationLoading) return;
    if (!expense || !expense._id) {
      toast.error('Invalid expense data');
      return;
    }
    setEditingExpense(expense);
    setShowEditExpense(true);
  };

  const handleUpdateExpense = async (expenseData) => {
    if (operationLoading) return;
    if (!editingExpense || !editingExpense._id) {
      toast.error('No expense selected for update');
      return;
    }
    
    try {
      setOperationLoading(true);
      await salonService.updateExpense(editingExpense._id, expenseData);
      toast.success('Expense updated successfully!');
      setShowEditExpense(false);
      
      // Refresh data
      const expenseResponse = await salonService.getExpenses({ limit: 100 });
      const expensesData = expenseResponse.data?.expenses || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      setTotalExpenses(expenseResponse.data?.totalExpenses || 0);
      const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteExpense = (expense) => {
    if (operationLoading) return;
    if (!expense || !expense._id) {
      toast.error('Invalid expense data');
      return;
    }
    setDeletingExpense(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExpense = async () => {
    if (operationLoading) return;
    if (!deletingExpense || !deletingExpense._id) {
      toast.error('No expense selected for deletion');
      return;
    }
    
    try {
      setOperationLoading(true);
      await salonService.deleteExpense(deletingExpense._id);
      toast.success('Expense deleted successfully!');
      setShowDeleteConfirm(false);

      // Refresh data
      const expenseResponse = await salonService.getExpenses({ limit: 100 });
      const expensesData = expenseResponse.data?.expenses || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      setTotalExpenses(expenseResponse.data?.totalExpenses || 0);
      const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    } finally {
      setOperationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading financial data...</span>
      </div>
    );
  }

  // Format percentage change for display
  const formatPercentageChange = (change, status) => {
    if (change === "N/A" || status === "N/A") {
      return "N/A vs last month";
    }
    
    const formattedChange = Math.abs(typeof change === 'number' ? change.toFixed(1) : 0);
    const isPositive = status === "positive";
    
    return (
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'}{formattedChange}% vs last month
      </span>
    );
  };

  // Format average growth for display
  const formatAverageGrowth = (trendData) => {
    if (!trendData || trendData.length < 2) return "N/A";
    
    // Calculate average monthly growth
    let totalGrowth = 0;
    let validPeriods = 0;
    
    for (let i = 1; i < trendData.length; i++) {
      if (trendData[i-1] > 0) {
        const growth = ((trendData[i] - trendData[i-1]) / trendData[i-1]) * 100;
        totalGrowth += growth;
        validPeriods++;
      }
    }
    
    if (validPeriods === 0) return "N/A";
    
    const avgGrowth = totalGrowth / validPeriods;
    const isPositive = avgGrowth >= 0;
    
    return (
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{avgGrowth.toFixed(1)}% Avg Monthly Growth
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton fallbackPath="/salon/dashboard" className="mb-2" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
          <p className="text-gray-600">Comprehensive view of your salon's financial performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {revenueService.formatCurrency(revenueData.totalRevenue)}
                </p>
                {revenueData.revenueTrend && (
                  <div className="mt-1">
                    {formatAverageGrowth(revenueData.revenueTrend)}
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                {revenueData.revenueTrend ? (
                  <Sparkline data={revenueData.revenueTrend} color="green" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>
          </div>

          {/* This Month's Revenue */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month's Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {revenueService.formatCurrency(revenueData.monthlyRevenue)}
                </p>
                <div className="mt-1">
                  {formatPercentageChange(revenueData.monthlyRevenueChange, revenueData.monthlyRevenueChangeStatus)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${profitStatus.color}`}>
                  {revenueService.formatCurrency(netProfit)}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full ${profitStatus.bgColor} ${profitStatus.color}`}>
                  {profitStatus.status}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${profitStatus.bgColor}`}>
                {netProfit >= 0 ? (
                  <TrendingUp className={`h-6 w-6 ${profitStatus.color}`} />
                ) : (
                  <TrendingDown className={`h-6 w-6 ${profitStatus.color}`} />
                )}
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {revenueService.formatCurrency(totalExpenses)}
                </p>
                {expenseTrend && (
                  <div className="mt-1">
                    {formatAverageGrowth(expenseTrend)}
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                {expenseTrend && expenseTrend.length > 0 ? (
                  <Sparkline data={expenseTrend} color="red" />
                ) : (
                  <CreditCard className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* This Month's Expenses */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month's Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {revenueService.formatCurrency(monthlyExpenses)}
                </p>
                <div className="mt-1">
                  {formatPercentageChange(monthlyExpensesChange, monthlyExpensesChangeStatus)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Next Week Financial Forecast Card */}
        <div className="mb-8">
          <NextWeekFinancialForecast />
        </div>

        {/* Loyalty Program Analytics */}
        <div className="mb-8">
          <LoyaltyAnalyticsCard />
        </div>

        {/* Top Loyalty Clients */}
        <div className="mb-8">
          <TopLoyaltyClients />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'expenses'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Expense Records
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'revenue'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Revenue Records
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Start date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="End date"
                />
              </div>

              {/* Category Filter (for expenses) */}
              {activeTab === 'expenses' && (
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters */}
              {(dateRange.start || dateRange.end || filter !== 'all') && (
                <button
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setFilter('all');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'expenses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Expense Records</h2>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Expense</span>
                  </button>
                </div>

                {/* Expense Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExpenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {revenueService.formatDate(expense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {revenueService.formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditExpense(expense)}
                                disabled={operationLoading}
                                className={`text-primary-600 hover:text-primary-900 ${operationLoading && 'cursor-not-allowed'}`}
                                title="Edit expense"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(expense)}
                                disabled={operationLoading}
                                className={`text-red-600 hover:text-red-900 ${operationLoading && 'cursor-not-allowed'}`}
                                title="Delete expense"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'revenue' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Revenue Records</h2>
                  <button
                    onClick={handleExportRevenue}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Revenue</span>
                  </button>
                </div>

                {/* Revenue Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service/Sale</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRevenueRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {revenueService.formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.customer?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{record.service}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {revenueService.formatCurrency(record.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Expense Modal */}
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          onSubmit={handleAddExpense}
          categories={categories}
        />

        {/* Edit Expense Modal */}
        {showEditExpense && (
          <EditExpenseModal
            expense={editingExpense}
            onClose={() => {
              setShowEditExpense(false);
              setEditingExpense(null);
            }}
            onUpdate={handleUpdateExpense}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <DeleteConfirmModal
            expense={deletingExpense}
            onClose={() => {
              setShowDeleteConfirm(false);
              setDeletingExpense(null);
            }}
            onConfirm={confirmDeleteExpense}
          />
        )}
      </div>
    </div>
  );
};

// Edit Expense Modal Component
const EditExpenseModal = ({ expense, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    category: expense?.category || '',
    amount: expense?.amount || '',
    description: expense?.description || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = ['Supplies', 'Rent', 'Utilities', 'Marketing', 'Salaries', 'Equipment', 'Insurance', 'Maintenance', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.category || !formData.amount || !formData.description || !formData.date) {
      setError('All fields are required');
      return;
    }
    
    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    setLoading(true);
    try {
      await onUpdate({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    } catch (error) {
      console.error('Error in edit modal submit:', error);
      setError(error.message || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Edit Expense</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={loading}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="edit-category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <input
                type="number"
                id="edit-amount"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="edit-description"
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="edit-date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ expense, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in delete confirm:', error);
      setError(error.message || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Delete Expense</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={loading}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="text-sm">
                <p><strong>Category:</strong> {expense?.category}</p>
                <p><strong>Amount:</strong> ₹{expense?.amount?.toLocaleString()}</p>
                <p><strong>Description:</strong> {expense?.description}</p>
                <p><strong>Date:</strong> {expense?.date ? new Date(expense.date).toLocaleDateString() : ''}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
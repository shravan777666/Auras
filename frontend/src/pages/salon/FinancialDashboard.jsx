import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { salonService } from '../../services/salon';
import { revenueService } from '../../services/revenue';
import AddExpenseModal from '../../components/salon/AddExpenseModal';
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

const FinancialDashboard = () => {
  const navigate = useNavigate();
  
  // Expense state (existing)
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  
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
  const [activeTab, setActiveTab] = useState('expenses');

  // Fetch all financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        
        // Fetch expenses (existing)
        const expenseResponse = await salonService.getExpenses();
        const expensesData = expenseResponse.data || [];
        
        // Fetch revenue data (new)
        const revenueResponse = await revenueService.getRevenueData();
        const revenueRecordsResponse = await revenueService.getRevenueRecords({ limit: 50 });
        
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
        setRevenueData(revenueResponse.data);
        setRevenueRecords(revenueRecordsResponse.data.records || []);
        setFilteredRevenueRecords(revenueRecordsResponse.data.records || []);
        
        // Calculate totals
        const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        setTotalExpenses(total);
        
        // Calculate monthly expenses
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyExp = expensesData.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        }).reduce((sum, expense) => sum + (expense.amount || 0), 0);
        setMonthlyExpenses(monthlyExp);
        
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
      const expenseResponse = await salonService.getExpenses();
      const expensesData = expenseResponse.data || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      
      // Recalculate totals
      const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setTotalExpenses(total);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyExp = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      }).reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setMonthlyExpenses(monthlyExp);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading financial data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
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
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
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
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
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
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-red-600" />
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
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
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
                              <button className="text-primary-600 hover:text-primary-900">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
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
      </div>
    </div>
  );
};

export default FinancialDashboard;

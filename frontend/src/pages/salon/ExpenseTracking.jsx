import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { salonService } from '../../services/salon';
import { 
  CreditCard, 
  Plus, 
  TrendingUp, 
  Filter, 
  Download,
  Calendar,
  Tag,
  FileText,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';

const ExpenseTracking = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Fetch expense data from API
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        // Fetch expenses
        const expenseResponse = await salonService.getExpenses();
        console.log('Expense response data:', expenseResponse);
        const expensesData = expenseResponse.data || [];
        console.log('Expenses data array:', expensesData);
        
        // Log the structure of the first few expenses to understand their format
        if (expensesData.length > 0) {
          console.log('Sample expense structure:', expensesData[0]);
        }
        
        // Fetch expense summary for categories
        const summaryResponse = await salonService.getExpenseSummary();
        const summaryData = summaryResponse || [];
        
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
        
        // Calculate total expenses
        const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        setTotalExpenses(total);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expense data');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Filter expenses based on selected filter and date range
  useEffect(() => {
    let filtered = [...expenses];
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(expense => expense.category === filter);
    }
    
    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(dateRange.start) && expenseDate <= new Date(dateRange.end);
      });
    }
    
    setFilteredExpenses(filtered);
  }, [filter, dateRange, expenses]);

  const handleAddExpense = async (expenseData) => {
    try {
      await salonService.addExpense(expenseData);
      setShowAddExpense(false);
      toast.success('Expense added successfully!');
      
      // Refresh the expense list
      const expenseResponse = await salonService.getExpenses();
      const expensesData = expenseResponse.data || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      
      // Recalculate total expenses
      const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setTotalExpenses(total);
      
      // Update categories if new category was added
      const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleExport = () => {
    toast.success('Export functionality would be implemented here');
  };

  const handleEditExpense = (expense) => {
    console.log('Edit expense clicked:', expense);
    if (operationLoading) return; // Prevent action during operation
    if (!expense || !expense._id) {
      toast.error('Invalid expense data');
      return;
    }
    setEditingExpense(expense);
    setShowEditExpense(true);
  };

  const handleUpdateExpense = async (expenseData) => {
    if (operationLoading) return; // Prevent action during operation
    if (!editingExpense || !editingExpense._id) {
      toast.error('No expense selected for update');
      return;
    }
    
    try {
      setOperationLoading(true);
      const response = await salonService.updateExpense(editingExpense._id, expenseData);
      console.log('Expense update response:', response);
      
      // Close modal and reset state
      setShowEditExpense(false);
      setEditingExpense(null);
      
      // Refresh expense list
      const expenseResponse = await salonService.getExpenses();
      const expensesData = expenseResponse.data || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      
      // Recalculate totals
      const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setTotalExpenses(total);
      
      // Update categories
      const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
      setCategories(uniqueCategories);
      
      toast.success('Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteExpense = (expense) => {
    console.log('Delete expense clicked:', expense);
    if (operationLoading) return; // Prevent action during operation
    if (!expense || !expense._id) {
      toast.error('Invalid expense data');
      return;
    }
    setDeletingExpense(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExpense = async () => {
    if (operationLoading) return; // Prevent action during operation
    if (!deletingExpense || !deletingExpense._id) {
      toast.error('No expense selected for deletion');
      return;
    }
    
    try {
      setOperationLoading(true);
      const response = await salonService.deleteExpense(deletingExpense._id);
      console.log('Expense delete response:', response);
      
      // Close modal and reset state
      setShowDeleteConfirm(false);
      setDeletingExpense(null);
      
      // Refresh expense list
      const expenseResponse = await salonService.getExpenses();
      const expensesData = expenseResponse.data || [];
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      
      // Recalculate totals
      const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setTotalExpenses(total);
      
      // Update categories
      const uniqueCategories = [...new Set(expensesData.map(e => e.category))];
      setCategories(uniqueCategories);
      
      toast.success('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense: ' + (error.response?.data?.message || error.message));
    } finally {
      setOperationLoading(false);
    }
  };

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount || 0;
    return acc;
  }, {});

  // Calculate this month's expenses
  const calculateThisMonthExpenses = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= startOfMonth) {
        return sum + (expense.amount || 0);
      }
      return sum;
    }, 0);
  };

  const categoryKeys = Object.keys(expensesByCategory);
  const categoryTotals = Object.values(expensesByCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-2 text-gray-600">Loading expense data...</p>
        </div>
      </div>
    );
  }

  // Test function to verify modal functionality
  const testModal = () => {
    console.log('Test modal function called');
    setShowAddExpense(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
              <p className="mt-1 text-sm text-gray-500">Monitor and manage your salon expenses</p>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{totalExpenses.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{calculateThisMonthExpenses().toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{categoryKeys.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categoryKeys.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Expense Records</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">List of all recorded expenses</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (₹)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{expense.category}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{expense.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.receipt ? (
                            <button className="text-indigo-600 hover:text-indigo-900">View</button>
                          ) : (
                            <span className="text-gray-400">No receipt</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditExpense(expense)}
                              disabled={operationLoading}
                              className={`inline-flex items-center p-2 rounded-md ${
                                operationLoading 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors'
                              }`}
                              title={operationLoading ? "Operation in progress" : "Edit expense"}
                              aria-label="Edit expense"
                            >
                              <Edit size={16} className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense)}
                              disabled={operationLoading}
                              className={`inline-flex items-center p-2 rounded-md ${
                                operationLoading 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-600 hover:text-red-900 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors'
                              }`}
                              title={operationLoading ? "Operation in progress" : "Delete expense"}
                              aria-label="Delete expense"
                            >
                              <Trash2 size={16} className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No expenses found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onAdd={handleAddExpense}
        />
      )}

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
  );
};

// Add Expense Modal Component
const AddExpenseModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const categories = ['Supplies', 'Rent', 'Utilities', 'Marketing', 'Salaries', 'Equipment', 'Insurance', 'Maintenance', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    } catch (error) {
      console.error('Error in modal submit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Add New Expense</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                Add Expense
              </button>
            </div>
          </form>
        </div>
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

export default ExpenseTracking;
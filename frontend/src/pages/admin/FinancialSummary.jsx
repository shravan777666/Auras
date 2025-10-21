import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { 
  Calendar, 
  Download, 
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Store,
  IndianRupee,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { revenueService } from '../../services/revenue';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PLTrendChart from '../../components/admin/PLTrendChart';
import PLTrendBarChart from '../../components/admin/PLTrendBarChart';
import ContactSalonModal from '../../components/admin/ContactSalonModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

// Register Chart.js components for bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format currency in Indian format
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format percentage
const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Helper function to get color based on value
const getValueColor = (value) => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

// Helper function to get background color based on value
const getBgColor = (value) => {
  if (value > 0) return 'bg-green-100';
  if (value < 0) return 'bg-red-100';
  return 'bg-gray-100';
};

// Helper function to get arrow icon based on value
const getTrendIcon = (value) => {
  if (value > 0) return <TrendingUp className="h-4 w-4" />;
  if (value < 0) return <TrendingDown className="h-4 w-4" />;
  return null;
};

// Custom Date Range Modal Component
const DateRangeModal = ({ isOpen, onClose, onApply, startDate, endDate, setStartDate, setEndDate }) => {
  if (!isOpen) return null;

  const handleApply = () => {
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    onApply();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Select Custom Date Range</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, icon: Icon, color, isCurrency = true }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isCurrency ? formatCurrency(value) : value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${getValueColor(change)}`}>
              {getTrendIcon(change)}
              <span className="text-sm font-medium ml-1">
                {formatPercentage(change)} from previous period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ value, max = 100, color = 'bg-blue-500' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${color}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const FinancialSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(null);
  const [salonPerformance, setSalonPerformance] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  
  // State for filters
  const [timePeriod, setTimePeriod] = useState('30');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [showOnlyLossMaking, setShowOnlyLossMaking] = useState(false); // New filter state
  
  // State for contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedSalonForContact, setSelectedSalonForContact] = useState(null);
  
  // Chart states
  const [chartType, setChartType] = useState('line');
  const [expenseChartType, setExpenseChartType] = useState('pie');
  
  // Pagination for salon table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize dates for custom range
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setCustomEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch financial data
  useEffect(() => {
    fetchFinancialData();
  }, [timePeriod, customStartDate, customEndDate]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      let startDate, endDate;
      const today = new Date();
      
      if (timePeriod === 'custom') {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        endDate = today.toISOString().split('T')[0];
        const daysAgo = parseInt(timePeriod);
        const startDateObj = new Date();
        startDateObj.setDate(today.getDate() - daysAgo);
        startDate = startDateObj.toISOString().split('T')[0];
      }
      
      // Prepare params for API calls
      const params = {
        startDate,
        endDate
      };
      
      // Fetch all financial data in parallel
      const [
        financialSummary,
        salonPerformance,
        revenueTrendData,
        expenseData
      ] = await Promise.all([
        adminService.getFinancialSummary(params),
        adminService.getSalonPerformance(params),
        adminService.getRevenueTrendData(params),
        adminService.getExpenseBreakdown(params)
      ]);
      
      setFinancialData(financialSummary.data);
      setSalonPerformance(salonPerformance.data);
      setRevenueTrendData(revenueTrendData.data);
      setExpenseData(expenseData.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle time period change
  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    if (period !== 'custom') {
      setShowDateRangeModal(false);
    }
  };

  // Handle custom date range apply
  const handleCustomDateApply = () => {
    setTimePeriod('custom');
    setShowDateRangeModal(false);
  };

  // Handle export report
  const handleExportReport = (format) => {
    toast.success(`Exporting report as ${format}...`);
    // In a real implementation, this would generate and download the report
  };

  // Filter salon data based on search term and loss-making filter
  const filteredSalons = salonPerformance.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLossFilter = !showOnlyLossMaking || salon.profit < 0;
    return matchesSearch && matchesLossFilter;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSalons = filteredSalons.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSalons.length / itemsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle contact salon button click
  const handleContactSalon = (salon) => {
    setSelectedSalonForContact(salon);
    setShowContactModal(true);
  };

  if (loading) {
    return <LoadingSpinner text="Loading financial summary..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BackButton fallbackPath="/admin/dashboard" className="mr-4" />
              <h1 className="text-2xl font-bold text-gray-900">Financial Summary</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Period Filter */}
              <div className="relative">
                <select
                  value={timePeriod}
                  onChange={(e) => handleTimePeriodChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="custom">Custom Range</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => handleExportReport('PDF')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={financialData?.totalRevenue || 0} 
            change={financialData?.revenueChange || 0}
            icon={IndianRupee}
            color="bg-green-500"
          />
          
          <StatCard 
            title="Total Profit/Loss" 
            value={financialData?.totalProfit || 0} 
            change={financialData?.profitChange || 0}
            icon={TrendingUp}
            color={financialData?.totalProfit >= 0 ? "bg-green-500" : "bg-red-500"}
          />
          
          <StatCard 
            title="Profit Margin" 
            value={`${financialData?.profitMargin || 0}%`} 
            change={financialData?.marginChange || 0}
            icon={PieChart}
            color="bg-blue-500"
            isCurrency={false}
          />
          
          <StatCard 
            title="Avg. Revenue per Salon" 
            value={financialData?.avgRevenuePerSalon || 0} 
            icon={Store}
            color="bg-purple-500"
          />
        </div>

        {/* Profit/Loss Trend Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">P/L Trend</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-md text-sm ${
                  chartType === 'line' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Line Chart
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-md text-sm ${
                  chartType === 'bar' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bar Chart
              </button>
            </div>
          </div>
          
          {chartType === 'line' ? (
            <PLTrendChart 
              data={revenueTrendData} 
              loading={loading} 
              error={null} 
            />
          ) : (
            <PLTrendBarChart 
              data={revenueTrendData} 
              loading={loading} 
              error={null} 
            />
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Revenue: ₹{financialData?.totalRevenue?.toLocaleString() || '0'}</p>
            <p>Costs: ₹{financialData?.totalExpenses?.toLocaleString() || '0'}</p>
            <p>Net Profit/Loss: ₹{financialData?.totalProfit?.toLocaleString() || '0'}</p>
          </div>
        </div>

        {/* Salon Performance Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Salon P/L Performance</h2>
            <div className="flex flex-wrap gap-4">
              {/* Loss-Making Filter */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lossFilter"
                  checked={showOnlyLossMaking}
                  onChange={(e) => {
                    setShowOnlyLossMaking(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="lossFilter" className="ml-2 text-sm text-gray-700">
                  Show Only Loss-Making Salons
                </label>
              </div>
              
              {/* Search */}
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search salons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salon Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Costs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operating Costs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net P/L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSalons.map((salon) => (
                  <tr 
                    key={salon.id} 
                    className={`hover:bg-gray-50 ${
                      salon.profit < 0 ? 'bg-red-50 border-l-4 border-red-400' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {salon.name}
                        {salon.profit < 0 && (
                          <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(salon.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(salon.serviceCosts)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(salon.operatingCosts)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${salon.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(salon.profit)}
                      {salon.profit < 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          Loss of ₹{Math.abs(salon.profit).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 mr-2">
                          <ProgressBar value={salon.margin} max={20} />
                        </div>
                        <span className="text-sm text-gray-900">{salon.margin.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => navigate(`/admin/salon/${salon.id}/details`)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                      {salon.profit < 0 && (
                        <button
                          onClick={() => handleContactSalon(salon)}
                          className="text-red-600 hover:text-red-900 font-medium flex items-center"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Contact Salon
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSalons.length)} of {filteredSalons.length} results
              </div>
              <div className="flex space-x-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === i + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Date Range Modal */}
      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onApply={handleCustomDateApply}
        startDate={customStartDate}
        endDate={customEndDate}
        setStartDate={setCustomStartDate}
        setEndDate={setCustomEndDate}
      />
      
      {/* Contact Salon Modal */}
      <ContactSalonModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        salon={selectedSalonForContact}
      />
    </div>
  );
};

export default FinancialSummary;
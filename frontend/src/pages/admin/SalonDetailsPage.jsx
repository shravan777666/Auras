import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Store,
  IndianRupee
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SalonRevenueTrendChart from '../../components/admin/SalonRevenueTrendChart';
import SalonRevenueTrendBarChart from '../../components/admin/SalonRevenueTrendBarChart';
import SalonBookingsTable from '../../components/admin/SalonBookingsTable';
import toast from 'react-hot-toast';

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
          {change !== undefined && change !== null && (
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

const SalonDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salonData, setSalonData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  
  // State for filters
  const [timePeriod, setTimePeriod] = useState('30');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Chart states
  const [chartType, setChartType] = useState('line');
  const [expenseChartType, setExpenseChartType] = useState('pie');

  // Initialize dates for custom range
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setCustomEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch salon data
  useEffect(() => {
    fetchSalonData();
  }, [id]);

  // Fetch financial data based on time period
  useEffect(() => {
    if (salonData) {
      fetchFinancialData();
    }
  }, [timePeriod, customStartDate, customEndDate, salonData]);

  const fetchSalonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch actual salon data by ID
      const salonResponse = await adminService.getSalonById(id);
      
      if (!salonResponse?.success) {
        throw new Error('Salon not found');
      }
      
      const salon = salonResponse.data;
      
      setSalonData({
        id: salon._id,
        name: salon.salonName,
        owner: salon.ownerName,
        email: salon.email,
        phone: salon.contactNumber,
        address: salon.salonAddress,
        status: salon.approvalStatus
      });
    } catch (error) {
      console.error('Error fetching salon data:', error);
      setError('Failed to load salon data');
      toast.error('Failed to load salon data');
    }
  };

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
      
      // Fetch salon-specific financial data
      const [
        financialData,
        revenueTrendData,
        expenseData
      ] = await Promise.all([
        adminService.getSalonFinancialData(id, params),
        adminService.getSalonRevenueTrend(id, params),
        adminService.getSalonExpenseBreakdown(id, params)
      ]);
      
      setFinancialData(financialData.data);
      setRevenueTrendData(revenueTrendData.data);
      setExpenseData(expenseData.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError('Failed to load financial data');
      toast.error('Failed to load financial data');
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

  // Handle retry
  const handleRetry = () => {
    fetchSalonData();
  };

  if (loading && !salonData) {
    return <LoadingSpinner text="Loading salon details..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/admin/financial-summary')}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Summary
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case when no salon data is found
  if (!loading && !salonData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Salon Not Found</h3>
          <p className="text-gray-600 mb-6">The requested salon details could not be found.</p>
          <button
            onClick={() => navigate('/admin/financial-summary')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Financial Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/financial-summary')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Financial Summary
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{salonData?.name || 'Salon Details'}</h1>
                <p className="text-sm text-gray-500 mt-1">Detailed financial performance for this salon</p>
              </div>
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
        {loading && (
          <div className="mb-6">
            <LoadingSpinner text="Updating data..." />
          </div>
        )}

        {/* Salon Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Salon Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">{salonData?.owner || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{salonData?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{salonData?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {salonData?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

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
            value={financialData?.profitMargin ? `${financialData.profitMargin.toFixed(1)}%` : '0%'} 
            change={financialData?.marginChange || 0}
            icon={PieChart}
            color="bg-blue-500"
            isCurrency={false}
          />
          
          <StatCard 
            title="Avg. Revenue/Day" 
            value={financialData?.avgRevenuePerDay || 0} 
            icon={Store}
            color="bg-purple-500"
          />
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Revenue Trend</h2>
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
            <SalonRevenueTrendChart 
              data={revenueTrendData} 
              loading={loading} 
              error={null} 
            />
          ) : (
            <SalonRevenueTrendBarChart 
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

        {/* Salon Bookings */}
        <div className="mb-8">
          <SalonBookingsTable salonId={id} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default SalonDetailsPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import { salonService } from '../../services/salon';
import { revenueService } from '../../services/revenue';
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Scissors,
  Calendar,
  DollarSign,
  PieChart,
  Activity,
  Filter
} from 'lucide-react';

// Mini chart component for sparklines
const SparklineChart = ({ data, color = 'green' }) => {
  if (!data || data.length === 0) return null;
  
  const validData = data.filter(value => typeof value === 'number' && !isNaN(value) && isFinite(value));
  if (validData.length === 0) return null;
  
  const minValue = Math.min(...validData);
  const maxValue = Math.max(...validData);
  const range = maxValue - minValue || 1;
  
  const points = validData.map((value, index) => {
    const x = (index / (validData.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  if (!points) return null;
  
  return (
    <svg viewBox="0 0 100 40" className="w-full h-10">
      <polyline 
        points={points} 
        fill="none" 
        stroke={color === 'green' ? '#10B981' : color === 'blue' ? '#3B82F6' : '#EF4444'} 
        strokeWidth="2" 
      />
    </svg>
  );
};

// Stat card component
const StatCard = ({ title, value, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    green: 'border-green-500 bg-green-50',
    blue: 'border-blue-500 bg-blue-50',
    purple: 'border-purple-500 bg-purple-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50'
  };
  
  return (
    <div className={`p-6 rounded-xl shadow-sm border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ml-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-white shadow">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Simple bar chart component
const SimpleBarChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          No data available
        </div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(item => item.value), 0);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 ml-4">
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div 
                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.value}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple pie chart component
const SimplePieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          No data available
        </div>
      </div>
    );
  }
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  
  // Generate colors for each segment
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex flex-col md:flex-row items-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const angle = (percentage / 100) * 360;
              const endAngle = startAngle + angle;
              
              // Convert angles to radians
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;
              
              // Calculate coordinates
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              
              // Large arc flag
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
              
              startAngle = endAngle;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                />
              );
            })}
            <circle cx="50" cy="50" r="15" fill="white" />
          </svg>
        </div>
        <div className="mt-4 md:mt-0 md:ml-6 flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // Default to 30 days
  const [reportData, setReportData] = useState({
    financial: {},
    services: [],
    staff: [],
    customers: {}
  });
  
  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Get date range for filtering
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));
        
        const dateParams = {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        };
        
        // Fetch financial data
        const financialResponse = await salonService.getExpenseSummary();
        
        // Fetch service data
        const serviceResponse = await salonService.getRevenueByService();
        
        // Fetch staff data
        const staffResponse = await salonService.getSalonStaff();
        
        // Fetch appointment data for customer insights (using endDate as the date parameter)
        const appointmentResponse = await salonService.getAppointments({
          date: dateParams.endDate
        });
        
        // Process financial data to match expected structure
        const processedFinancialData = {
          totalRevenue: serviceResponse.reduce((sum, service) => sum + (service.revenue || 0), 0),
          totalExpenses: financialResponse?.total || 0,
          expenseBreakdown: financialResponse?.summary || []
        };
        
        // Process service data to match expected structure
        const processedServiceData = serviceResponse.map(service => ({
          ...service,
          appointmentCount: service.bookings || 0
        }));
        
        setReportData({
          financial: processedFinancialData,
          services: processedServiceData,
          staff: staffResponse?.data || [],
          customers: {
            totalAppointments: appointmentResponse?.meta?.totalItems || 0
          }
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [timeRange]);
  
  // Handle export report
  const handleExportReport = (format) => {
    toast.success(`Exporting report as ${format}...`);
    // In a real implementation, this would generate and download the report
  };
  
  // Calculate financial metrics
  const calculateFinancialMetrics = () => {
    const totalRevenue = reportData.financial?.totalRevenue || 0;
    const totalExpenses = reportData.financial?.totalExpenses || 0;
    const netProfit = revenueService.calculateProfit(totalRevenue, totalExpenses);
    const profitStatus = revenueService.getProfitStatus(netProfit);
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitStatus
    };
  };
  
  const financialMetrics = calculateFinancialMetrics();
  
  // Prepare service data for charts
  const serviceChartData = reportData.services.map(service => ({
    label: service.name,
    value: service.revenue
  }));
  
  // Prepare expense data for charts
  const expenseChartData = reportData.financial?.expenseBreakdown?.map(expense => ({
    label: expense.category,
    value: expense.totalAmount
  })) || [];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <BackButton fallbackPath="/salon/dashboard" />
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <BackButton fallbackPath="/salon/dashboard" />
            <h1 className="text-2xl font-bold text-gray-900 ml-4">Reports & Analytics</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <button
              onClick={() => handleExportReport('PDF')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={revenueService.formatCurrency(financialMetrics.totalRevenue)}
            icon={<DollarSign className="h-6 w-6 text-green-500" />}
            color="green"
          />
          
          <StatCard
            title="Net Profit/Loss"
            value={revenueService.formatCurrency(financialMetrics.netProfit)}
            icon={<TrendingUp className="h-6 w-6 text-blue-500" />}
            color={financialMetrics.netProfit >= 0 ? 'green' : 'red'}
          />
          
          <StatCard
            title="Total Appointments"
            value={reportData.customers.totalAppointments}
            icon={<Calendar className="h-6 w-6 text-purple-500" />}
            color="purple"
          />
          
          <StatCard
            title="Active Staff"
            value={reportData.staff.length}
            icon={<Users className="h-6 w-6 text-yellow-500" />}
            color="yellow"
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SimpleBarChart 
            data={serviceChartData} 
            title="Revenue by Service" 
          />
          
          <SimplePieChart 
            data={expenseChartData} 
            title="Expense Breakdown" 
          />
        </div>
        
        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Services</h3>
              <Scissors className="h-5 w-5 text-blue-500" />
            </div>
            
            {reportData.services && reportData.services.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.services.slice(0, 5).map((service, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {service.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {revenueService.formatCurrency(service.revenue)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {service.appointmentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No service data available
              </div>
            )}
          </div>
          
          {/* Staff Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Staff Overview</h3>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            
            {reportData.staff && reportData.staff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.staff.slice(0, 5).map((staff, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {staff.name?.charAt(0) || 'S'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{staff.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{staff.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {staff.position || 'Staff'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            staff.employmentStatus === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {staff.employmentStatus || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No staff data available
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Insights */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Report Insights</h3>
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Financial Health</h4>
              <p className="text-sm text-blue-800">
                Your salon is currently {financialMetrics.netProfit >= 0 ? 'profitable' : 'operating at a loss'}. 
                Focus on high-revenue services to improve profitability.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Service Performance</h4>
              <p className="text-sm text-green-800">
                {reportData.services.length > 0 
                  ? `${reportData.services[0]?.name || 'A service'} is your top performer.`
                  : 'Analyze service performance to identify opportunities.'}
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Staff Productivity</h4>
              <p className="text-sm text-purple-800">
                You have {reportData.staff.length} active staff members. 
                Ensure proper workload distribution for optimal performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
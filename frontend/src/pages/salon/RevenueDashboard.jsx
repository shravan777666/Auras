import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { salonService } from '../../services/salon';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const RevenueDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pieChartCanvasRef = useRef(null);
  const barChartCanvasRef = useRef(null);
  const currentChartRef = useRef(null);

  useEffect(() => {
    // Temporarily bypass auth for testing
    // if (!user || user.type !== 'salon') {
    //   navigate('/login');
    //   return;
    // }
    fetchRevenueData();

    // Auto-refresh every 30 seconds
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(fetchRevenueData, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      // Cleanup chart on unmount
      if (currentChartRef.current) {
        currentChartRef.current.destroy();
      }
    };
  }, [user, navigate, autoRefresh]);

  // Effect to create/update chart when data or chart type changes
  useEffect(() => {
    updateChart();
    return () => {
      // Cleanup previous chart
      if (currentChartRef.current) {
        currentChartRef.current.destroy();
      }
    };
  }, [revenueData, chartType]);

  const fetchRevenueData = async () => {
    try {
      // Only show loading spinner on initial load, not on auto-refresh
      if (revenueData.length === 0) {
        setLoading(true);
      }
      const data = await salonService.getRevenueByService();
      const normalized = Array.isArray(data)
        ? data.map((d) => ({
            service: d.service || d._id || 'Unknown',
            total_revenue: Number(d.total_revenue ?? d.total ?? 0),
            transaction_count: Number(d.transaction_count ?? d.count ?? 0),
            percentage: Number(d.percentage ?? 0),
          }))
        : [];
      setRevenueData(normalized);
      const total = normalized.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
      const count = normalized.reduce((sum, item) => sum + (item.transaction_count || 0), 0);
      setTotalRevenue(total);
      setTotalCount(count);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setRevenueData([]);
      setTotalRevenue(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const updateChart = () => {
    // Destroy existing chart
    if (currentChartRef.current) {
      currentChartRef.current.destroy();
    }

    const serviceLabels = revenueData.map(item => item.service);
    const revenueAmounts = revenueData.map(item => item.total_revenue);
    const colorArray = [
      '#3B82F6', // blue-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#06B6D4', // cyan-500
      '#84CC16', // lime-500
      '#F97316', // orange-500
      '#EC4899', // pink-500
      '#6B7280', // gray-500
    ].slice(0, revenueData.length);

    let canvas;
    if (chartType === 'pie') {
      canvas = pieChartCanvasRef.current;
    } else {
      canvas = barChartCanvasRef.current;
    }

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const chartConfig = {
      type: chartType,
      data: {
        labels: serviceLabels,
        datasets: [{
          label: chartType === 'bar' ? 'Revenue' : undefined,
          data: revenueAmounts,
          backgroundColor: colorArray,
          borderColor: colorArray.map(color => color.replace('500', '700')),
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.y || context.parsed;
                const percentage = revenueData[context.dataIndex]?.percentage || 0;
                const count = revenueData[context.dataIndex]?.transaction_count || 0;
                return [
                  `Revenue: ₹${value.toLocaleString()}`,
                  `Transactions: ${count}`,
                  `Percentage: ${percentage}%`
                ];
              },
            },
          },
        },
        ...(chartType === 'bar' && {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                },
              },
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 0,
              },
            },
          },
        }),
      },
    };

    currentChartRef.current = new ChartJS(ctx, chartConfig);
  };



  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/salon/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Revenue by Service</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto {autoRefresh ? 'On' : 'Off'}
              </button>
              <button
                onClick={fetchRevenueData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Service</p>
                <p className="text-lg font-bold text-gray-900">
                  {revenueData.length > 0 ? revenueData[0].service : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Revenue Breakdown</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('pie')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  chartType === 'pie'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Pie Chart
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Bar Chart
              </button>
            </div>
          </div>

          <div className="h-96">
            {revenueData.length > 0 ? (
              <canvas
                ref={chartType === 'pie' ? pieChartCanvasRef : barChartCanvasRef}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No services available</p>
                  <p className="text-gray-400 text-sm">Complete some appointments to see revenue breakdown</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueData.length > 0 ? (
                  revenueData.map((item, index) => (
                    <tr key={item.service} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.total_revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.transaction_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span>{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-lg">No services available</p>
                        <p className="text-sm">Revenue data will appear here once appointments are completed</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
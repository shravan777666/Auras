import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import { reviewService } from '../../services/review';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  BarChart2, 
  MapPin, 
  Phone, 
  Mail,
  Store,
  Edit,
  CheckCircle,
  Star,
  PlusCircle,
  UserCog,
  FileBarChart2,
  Image,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { PieChart, BarChart3, RefreshCw } from 'lucide-react';
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
import { Pie, Bar } from 'react-chartjs-2';
import LogoutButton from '../../components/auth/LogoutButton';
import AddServiceModal from '../../components/salon/AddServiceModal';
import AssignStaffModal from '../../components/salon/AssignStaffModal';

// A reusable card for displaying statistics
const StatCard = ({ icon, title, value, color, onClick }) => (
  <div
    className={`bg-white p-6 rounded-lg shadow-md flex items-center gap-4 border-l-4 ${color} ${onClick ? 'cursor-pointer hover:shadow-lg transition-all' : ''}`}
    onClick={onClick}
  >
    {icon}
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// Card for Staff Availability Calendar
const AvailabilityCard = ({ color, onClick }) => (
  <div 
    className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color} col-span-full cursor-pointer hover:shadow-lg transition-all`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Staff Availability Calendar</h3>
      </div>
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <span>View Calendar</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
    <p className="text-gray-600 mt-2">View and manage your staff's availability and appointments</p>
  </div>
);

// Expense Tracking Card Component
const ExpenseTrackingCard = ({ expenses = [], totalExpenses = 0, onAddExpense, onViewDetails }) => {
  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount || 0;
    return acc;
  }, {});

  const expenseCategories = Object.keys(expensesByCategory);
  const expenseValues = Object.values(expensesByCategory);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Expense Tracking</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddExpense}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Expense
          </button>
          <button
            onClick={onViewDetails}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            View Details
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-xl font-bold text-blue-700">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-xl font-bold text-green-700">₹{(totalExpenses * 0.5).toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Categories</p>
          <p className="text-xl font-bold text-purple-700">{expenseCategories.length}</p>
        </div>
      </div>
      
      {expenseCategories.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Expenses by Category</h3>
          <div className="space-y-2">
            {expenseCategories.map((category, index) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{category}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(expenseValues[index] / totalExpenses) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">₹{expenseValues[index].toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>No expenses recorded yet</p>
          <button 
            onClick={onAddExpense}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Add your first expense
          </button>
        </div>
      )}
    </div>
  );
};

const SalonDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartType, setChartType] = useState('pie');
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
  );

  const heroImages = [
    'https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg',
    'https://unsplash.com/photos/a-woman-getting-her-hair-done-in-a-salon-lK8oXGycy88',
    '	https://pixabay.com/photos/makeup-salon-care-skin-glamour-7055671/',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, [heroImages.length]);

  const handleServiceAdded = () => {
    fetchDashboardData();
  };

  const handleAssignStaff = (appointment) => {
    setSelectedAppointment(appointment);
    setIsAssignStaffModalOpen(true);
  };

  const handleStaffAssigned = () => {
    // Refresh the pending appointments
    fetchPendingAppointments();
    // Close the modal
    setIsAssignStaffModalOpen(false);
    setSelectedAppointment(null);
    // Show success message
    toast.success('Staff assigned successfully! Calendar will refresh automatically.');
  };

  const fetchDashboardData = async () => {
    try {
      const response = await salonService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch dashboard data.');
      }
    } catch (err) {
      setError('An error occurred while fetching data.');
      toast.error(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      setLoadingRevenue(true);
      const data = await salonService.getRevenueByService();
      // Normalize expected shape: [{ service, total_revenue, transaction_count, percentage }]
      const normalized = Array.isArray(data)
        ? data.map((d) => ({
            service: d.service || d._id || 'Unknown',
            total_revenue: Number(d.total_revenue ?? d.total ?? 0),
            transaction_count: Number(d.transaction_count ?? d.count ?? 0),
            percentage: Number(d.percentage ?? 0),
          }))
        : [];
      setRevenueData(normalized);
      setTotalRevenue(normalized.reduce((sum, i) => sum + (i.total_revenue || 0), 0));
    } catch (e) {
      console.warn('Failed to load revenue data:', e?.message || e);
      setRevenueData([]);
      setTotalRevenue(0);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      setLoadingAppointments(true);
      console.log('Fetching pending appointments...');
      
      // Fetch only pending appointments for the current salon
      const res = await salonService.getAppointments({ 
        page: 1, 
        limit: 20, // Increased limit to show more appointments
        status: 'Pending' 
      });
      
      console.log('Appointments API response:', res);
      
      if (res && res.success) {
        // Filter appointments to ensure they belong to this salon
        const pendingAppointments = res.data || [];
        setUpcoming(pendingAppointments);
        setLastUpdated(new Date());
        console.log(`Fetched ${pendingAppointments.length} pending appointments for salon:`, pendingAppointments);
      } else {
        console.warn('Failed to fetch pending appointments:', res?.message);
        setUpcoming([]);
      }
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
      toast.error('Failed to fetch pending appointments');
      setUpcoming([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    // Check if coming from setup completion
    if (location.state?.fromSetup) {
      setShowWelcome(true);
      // Auto hide welcome message after 5 seconds
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchRevenueData();
    // Optional auto-refresh every 60s without affecting other features
    const interval = setInterval(fetchRevenueData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pending appointments for upcoming section with auto-refresh
  useEffect(() => {
    fetchPendingAppointments();
    
    // Set up auto-refresh every 30 seconds for live data
    const refreshInterval = setInterval(() => {
      fetchPendingAppointments();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Fetch recent reviews for this salon
  useEffect(() => {
    const loadReviews = async () => {
      try {
        // Determine salonId from dashboard data once available
        const salonId = dashboardData?.salonInfo?._id || dashboardData?.salonInfo?.id;
        if (!salonId) return; // wait until dashboard loads
        const res = await reviewService.listBySalon(salonId, { page: 1, limit: 5 });
        if (res?.success) {
          // Normalize data for rendering
          const items = (res.data || []).map((r) => ({
            id: r._id,
            rating: r.rating,
            comment: r.comment || '',
            date: r.createdAt,
            customer: r.userId?.name || 'Customer',
          }));
          setReviews(items);
        }
      } catch (e) {
        console.warn('Failed to load reviews:', e?.message || e);
      }
    };
    loadReviews();
  }, [dashboardData]);

  // Fetch expense data
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        // Fetch expense summary for the dashboard card
        const summaryResponse = await salonService.getExpenseSummary();
        const summaryData = summaryResponse || [];
        
        // For the dashboard card, we'll show a summary
        // In a real implementation, you might want to fetch recent expenses
        const recentExpenses = summaryData.slice(0, 5); // Show top 5 categories
        const total = summaryData.reduce((sum, item) => sum + (item.total_amount || 0), 0);
        
        setExpenses(recentExpenses);
        setTotalExpenses(total);
      } catch (error) {
        console.error('Error fetching expense data:', error);
        // Use mock data as fallback
        const mockExpenses = [
          { id: 1, category: 'Supplies', amount: 5000, date: '2023-05-15', description: 'Hair products' },
          { id: 2, category: 'Rent', amount: 25000, date: '2023-05-01', description: 'Monthly rent' },
          { id: 3, category: 'Utilities', amount: 8000, date: '2023-05-10', description: 'Electricity and water' },
          { id: 4, category: 'Marketing', amount: 3000, date: '2023-05-20', description: 'Social media ads' },
          { id: 5, category: 'Salaries', amount: 80000, date: '2023-05-05', description: 'Staff salaries' },
        ];
        
        setExpenses(mockExpenses);
        setTotalExpenses(mockExpenses.reduce((sum, expense) => sum + expense.amount, 0));
      }
    };

    fetchExpenses();
  }, []);

  const handleAddExpense = () => {
    navigate('/salon/expenses');
  };

  const handleViewExpenseDetails = () => {
    navigate('/salon/expenses');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center">No dashboard data available.</div>;
  }

  const { salonInfo, statistics } = dashboardData;
  const workingDays = Array.isArray(salonInfo?.businessHours?.workingDays)
    ? salonInfo.businessHours.workingDays.join(', ')
    : 'Working days not specified';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-72 mb-8 rounded-lg overflow-hidden flex items-center justify-center text-white">
        {heroImages.map((src, index) => (
          <img
            key={src}
            src={src}
            alt="Salon background"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white">Welcome, {salonInfo.salonName}!</h1>
                    <p className="text-gray-200 mt-1">Here is your salon's performance at a glance.</p>
                </div>
                <LogoutButton />
            </header>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner after Setup Completion */}
        {showWelcome && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white relative">
            <button 
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-12 w-12 text-white" />
              <div>
                <h3 className="text-2xl font-bold mb-2">🎉 Congratulations! Your salon is now live!</h3>
                <p className="text-green-100">
                  Your salon setup has been completed successfully. You can now start managing appointments, 
                  adding services, and growing your business. Welcome to Auracare!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Salon Overview */}
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Store className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">{salonInfo.salonName}</h2>
                  <p className="text-pink-100">Salon Details</p>
                </div>
              </div>
              <button onClick={() => navigate('/salon/edit-profile')} className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{salonInfo.contactNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{salonInfo.email}</span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="text-gray-700">
                    {salonInfo.salonAddress ? (
                      typeof salonInfo.salonAddress === 'string' ? (
                        <p>{salonInfo.salonAddress}</p>
                      ) : (
                        <div>
                          <p>{salonInfo.salonAddress.street}</p>
                          <p>{salonInfo.salonAddress.city}, {salonInfo.salonAddress.state}</p>
                          <p>{salonInfo.salonAddress.postalCode}</p>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-500">Address not provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Business Hours</h3>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="text-gray-700">
                    {salonInfo.businessHours ? (
                      <div>
                        <p>{salonInfo.businessHours.openTime} - {salonInfo.businessHours.closeTime}</p>
                        <p className="text-sm text-gray-500 mt-1">{workingDays}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Business hours not set</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {salonInfo.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">About</h3>
                <p className="text-gray-700 leading-relaxed">{salonInfo.description}</p>
              </div>
            )}

            {/* Salon Image if available */}
            {salonInfo.salonImage && (
              <div className="mt-6">
                <div className="relative w-full h-56 sm:h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img src={salonInfo.salonImage} alt="Salon" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 rounded text-gray-700 flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span className="text-xs">Salon Image</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expense Tracking Card - Added after Statistics Grid */}
        <ExpenseTrackingCard 
          expenses={expenses}
          totalExpenses={totalExpenses}
          onAddExpense={handleAddExpense}
          onViewDetails={handleViewExpenseDetails}
        />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={<BarChart2 size={32} className="text-blue-500" />} 
            title="Monthly Revenue" 
            value={`₹${statistics.monthlyRevenue.toFixed(2)}`} 
            color="border-blue-500"
          />
          <StatCard 
            icon={<Briefcase size={32} className="text-green-500" />} 
            title="Total Services" 
            value={statistics.totalServices} 
            color="border-green-500"
            onClick={() => navigate('/salon/services')}
          />
          <StatCard 
            icon={<Users size={32} className="text-purple-500" />} 
            title="Total Staff" 
            value={statistics.totalStaff} 
            color="border-purple-500"
            onClick={() => navigate('/salon/staff')}
          />
          <StatCard 
            icon={<Calendar size={32} className="text-indigo-500" />} 
            title="Total Appointments" 
            value={statistics.totalAppointments} 
            color="border-indigo-500"
          />
          <StatCard 
            icon={<Clock size={32} className="text-yellow-500" />} 
            title="Pending Appointments" 
            value={statistics.pendingAppointments} 
            color="border-yellow-500"
          />
          <StatCard
            icon={<Calendar size={32} className="text-red-500" />}
            title="Staff Availability Calendar"
            value={statistics.todayAppointments}
            color="border-red-500"
          />
          <StatCard
            icon={<BarChart2 size={32} className="text-green-500" />}
            title="Revenue Dashboard"
            value={`₹${statistics.monthlyRevenue.toFixed(2)}`}
            color="border-green-500"
            onClick={() => navigate('/salon/revenue')}
          />
          <AvailabilityCard
            color="border-teal-500"
            onClick={() => navigate('/salon/staff-availability')}
          />
        </div>



        Revenue Breakdown (Services vs Revenue)
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Revenue Breakdown</h2>
              <p className="text-sm text-gray-500">By service (Total: ₹{totalRevenue.toLocaleString()})</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-2 text-sm rounded-lg flex items-center ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <PieChart className="h-4 w-4 mr-2" /> Pie
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-2 text-sm rounded-lg flex items-center ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <BarChart3 className="h-4 w-4 mr-2" /> Bar
              </button>
              <button
                onClick={fetchRevenueData}
                disabled={loadingRevenue}
                className="px-3 py-2 text-sm rounded-lg flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingRevenue ? 'animate-spin' : ''}`} />
                {loadingRevenue ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="h-96">
            {loadingRevenue ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : revenueData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No revenue data yet</div>
            ) : (
              chartType === 'pie' ? (
                <Pie data={{
                  labels: revenueData.map(i => i.service),
                  datasets: [{
                    data: revenueData.map(i => i.total_revenue),
                    backgroundColor: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#84CC16','#F97316','#EC4899','#6B7280'].slice(0, revenueData.length),
                    borderWidth: 2,
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed;
                          const item = revenueData[context.dataIndex];
                          return ` ₹${value.toLocaleString()} • ${item.transaction_count} tx • ${item.percentage || 0}%`;
                        }
                      }
                    }
                  }
                }} />
              ) : (
                <Bar data={{
                  labels: revenueData.map(i => i.service),
                  datasets: [{
                    label: 'Revenue',
                    data: revenueData.map(i => i.total_revenue),
                    backgroundColor: '#3B82F6',
                  }]
                }} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed.y;
                          const item = revenueData[context.dataIndex];
                          return ` ₹${value.toLocaleString()} • ${item.transaction_count} tx`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (v) => `₹${v.toLocaleString()}`
                      }
                    }
                  }
                }} />
              )
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Pending Appointments</h2>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchPendingAppointments}
                disabled={loadingAppointments}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAppointments ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => navigate('/salon/appointments')}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loadingAppointments && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Staff</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(upcoming || []).map((appt) => {
                  // Debug logging to see the actual data structure
                  console.log('Appointment data:', appt);
                  console.log('Customer data:', appt.customerId);
                  
                  // Handle populated customer data from backend
                  let customerName = 'Unknown Customer';
                  let customerEmail = 'No email';
                  
                  if (appt.customerId) {
                    if (typeof appt.customerId === 'object' && appt.customerId.name) {
                      // Customer data is populated by backend
                      customerName = appt.customerId.name;
                      customerEmail = appt.customerId.email || 'No email';
                    } else if (typeof appt.customerId === 'string') {
                      // Fallback if customer data is not populated
                      customerName = `Customer ID: ${appt.customerId.slice(-6)}`;
                      customerEmail = 'No email';
                    } else {
                      // Handle null or undefined customerId
                      customerName = 'Unknown Customer';
                      customerEmail = 'No email';
                    }
                  }
                  
                  const services = appt.services || [];
                  const appointmentDate = appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : 'N/A';
                  const appointmentTime = appt.appointmentTime || 'N/A';
                  const totalAmount = appt.finalAmount || appt.totalAmount || 0;
                  const bookingId = appt._id;
                  const customerNotes = appt.customerNotes || '';
                  const specialRequests = appt.specialRequests || '';
                  
                  return (
                    <tr key={appt._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{customerName}</div>
                          <div className="text-gray-500 text-xs">ID: {bookingId.slice(-6)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{customerEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {services.length > 0 ? (
                            <div>
                              <div className="font-medium text-gray-900">
                                {services[0].serviceName || services[0].serviceId?.name || 'Service'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ₹{services[0].price || services[0].serviceId?.price || 0}
                              </div>
                              {services.length > 1 && (
                                <div className="text-xs text-gray-500">
                                  +{services.length - 1} more service{services.length > 2 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No services</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{appointmentDate}</div>
                          <div className="text-gray-500">{appointmentTime}</div>
                          {appt.estimatedDuration && (
                            <div className="text-xs text-gray-400">{appt.estimatedDuration} mins</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div>₹{totalAmount}</div>
                        {(customerNotes || specialRequests) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {customerNotes && <div>Note: {customerNotes.slice(0, 30)}{customerNotes.length > 30 ? '...' : ''}</div>}
                            {specialRequests && <div>Special: {specialRequests.slice(0, 30)}{specialRequests.length > 30 ? '...' : ''}</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          {appt.status || 'Pending'}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(appt.createdAt || appt.dateCreated).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleAssignStaff(appt)}
                          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Assign Staff
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!upcoming || upcoming.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="text-gray-500">
                        <div className="text-sm font-medium">No pending appointments</div>
                        <div className="text-xs mt-1">All appointments are up to date!</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Show count of pending appointments */}
          {upcoming && upcoming.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
              <span>Showing {Math.min(upcoming.length, 20)} pending appointment{upcoming.length !== 1 ? 's' : ''}</span>
              {upcoming.length >= 20 && (
                <span className="text-indigo-600 font-medium">View all to see more</span>
              )}
            </div>
          )}
        </div>

        {/* Recent Reviews and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {reviews.length === 0 && (
                <div className="text-sm text-gray-500">No reviews yet.</div>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-4 flex items-start gap-3">
                  <div className="flex items-center gap-1 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">{r.customer}</p>
                      <p className="text-xs text-gray-400">{r.date ? new Date(r.date).toLocaleDateString() : ''}</p>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md h-max">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition"
              >
                <span className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Add New Service</span>
              </button>
              <button
                onClick={() => navigate('/salon/staff')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <span className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Manage Staff</span>
              </button>
              <button
                onClick={() => navigate('/salon/staff/new')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                <span className="flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Add New Staff</span>
              </button>
              <button
                onClick={() => navigate('/salon/reports')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                <span className="flex items-center gap-2"><FileBarChart2 className="h-5 w-5" /> View Reports</span>
              </button>
              <button
                onClick={() => navigate('/salon/expenses')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <span className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Track Expenses</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddServiceModal 
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onServiceAdded={handleServiceAdded}
      />

      <AssignStaffModal
        isOpen={isAssignStaffModalOpen}
        onClose={() => {
          setIsAssignStaffModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onStaffAssigned={handleStaffAssigned}
        onRefresh={() => {
          // This will be used to refresh the calendar if needed
          console.log('Staff assignment completed - calendar should refresh');
        }}
      />
    </div>
  );
};

export default SalonDashboard;
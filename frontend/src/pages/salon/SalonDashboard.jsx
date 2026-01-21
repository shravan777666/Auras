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
  CreditCard,
  RefreshCw,
  Zap,
  XCircle,
  Home,
  PieChart,
  BarChart3,
  User,
  Settings,
  Bell,
  FileText,
  ShoppingCart,
  QrCode,
  Package
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
import { Pie, Bar } from 'react-chartjs-2';
import LogoutButton from '../../components/auth/LogoutButton';
import AddServiceModal from '../../components/salon/AddServiceModal';
import AddPackageModal from '../../components/salon/AddPackageModal';
import AddProductModal from '../../components/salon/AddProductModal';
import AssignStaffModal from '../../components/salon/AssignStaffModal';
import ClientRecommendations from '../../components/salon/ClientRecommendations';
import NeedsAttentionAlerts from '../../components/salon/NeedsAttentionAlerts';
import PendingScheduleRequests from '../../components/salon/PendingScheduleRequests';
import StaffFeedbackInbox from '../../components/salon/StaffFeedbackInbox';
import BackButton from '../../components/common/BackButton';
import PayrollProcessingCard from '../../components/salon/PayrollProcessingCard';
import PayrollSummaryTable from '../../components/salon/PayrollSummaryTable';
import QueueManagement from '../../components/salon/QueueManagement';
import GiftCardRecipientsComponent from '../../components/salon/GiftCardRecipients';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// A reusable card for displaying statistics
const StatCard = ({ icon, title, value, color, onClick }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 border-l-4 ${color} ${onClick ? 'cursor-pointer hover:border-l-8' : ''}`}
    onClick={onClick}
  >
    <div className="p-3 rounded-lg bg-gray-100">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// Card for Staff Availability Calendar
const AvailabilityCard = ({ color, onClick }) => (
  <div 
    className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${color} col-span-full cursor-pointer`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-gray-100">
          <Calendar className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Staff Availability Calendar</h3>
          <p className="text-gray-600 mt-1">View and manage your staff's availability and appointments</p>
        </div>
      </div>
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <span>View Calendar</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
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

  // Calculate this month's expenses
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const thisMonthExpenses = expenses.reduce((sum, expense) => {
    const expenseDate = new Date(expense.date);
    if (expenseDate >= startOfMonth) {
      return sum + (expense.amount || 0);
    }
    return sum;
  }, 0);

  const expenseCategories = Object.keys(expensesByCategory);
  const expenseValues = Object.values(expensesByCategory);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Expense Tracking</h2>
            <p className="text-sm text-gray-500">Monitor your business expenses</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddExpense}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Expense
          </button>
          <button
            onClick={onViewDetails}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <FileBarChart2 className="h-4 w-4" />
            View Details
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-900">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <p className="text-sm text-green-700">This Month</p>
          <p className="text-2xl font-bold text-green-900">₹{thisMonthExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-700">Categories</p>
          <p className="text-2xl font-bold text-purple-900">{expenseCategories.length}</p>
        </div>
      </div>
      
      {expenseCategories.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {expenseCategories.map((category, index) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{category}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(expenseValues[index] / totalExpenses) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">₹{expenseValues[index].toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 rounded-lg border border-dashed border-gray-300">
          <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="font-medium mb-2">No expenses recorded yet</p>
          <button 
            onClick={onAddExpense}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
          >
            <PlusCircle className="h-4 w-4" />
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
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // New state for navigation tabs

  const heroImages = [
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://as2.ftcdn.net/v2/jpg/10/81/22/61/1000_F_1081226132_MOnJE4ctYT6Ll7nFVWm2nTjPMLHZZlNA.jpg',
    'https://as2.ftcdn.net/v2/jpg/02/98/51/45/1000_F_298514548_ImO2ETdz8mebG7redKCpB7a57lEPAutI.jpg',
  ];

  // Navigation tabs configuration
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: User },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'products', label: 'Products', icon: ShoppingCart },
    { id: 'giftcards', label: 'Gift Cards', icon: CreditCard },
    { id: 'queue', label: 'Queue', icon: QrCode },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
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

  const handlePackageAdded = () => {
    fetchDashboardData();
  };

  const handleAssignStaff = (appointment) => {
    setSelectedAppointment(appointment);
    setIsAssignStaffModalOpen(true);
  };

  const handleStaffAssigned = () => {
    // Refresh the pending appointments
    fetchPendingAppointments();
    fetchDashboardData(); // This will update the statistics including pending appointments count
    // Close the modal
    setIsAssignStaffModalOpen(false);
    setSelectedAppointment(null);
    // Show success message
    toast.success('Staff assigned successfully! Appointment moved to Approved status.');
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

  // Fetch pending appointments for upcoming section with auto-refresh
  useEffect(() => {
    fetchPendingAppointments();
    fetchDashboardData(); // This will update the statistics including pending appointments count
    
    // Set up auto-refresh every 2 minutes for live data
    const refreshInterval = setInterval(() => {
      fetchPendingAppointments();
      fetchDashboardData(); // This will update the statistics including pending appointments count
    }, 120000);
    
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
        const expenseResponse = await salonService.getExpenses({ limit: 100 });
        const expensesData = expenseResponse.data?.expenses || [];
        
        // Calculate total expenses
        const total = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        
        // For the dashboard card, we'll show recent expenses
        const recentExpenses = expensesData.slice(0, 5); // Show top 5 recent expenses
        
        setExpenses(recentExpenses);
        setTotalExpenses(total);
      } catch (error) {
        console.error('Error fetching expense data:', error);
        // Use empty data instead of mock data
        setExpenses([]);
        setTotalExpenses(0);
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

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'appointments':
        return renderAppointmentsContent();
      case 'staff':
        return renderStaffContent();
      case 'services':
        return renderServicesContent();
      case 'packages':
        return renderPackagesContent();
      case 'products':
        return renderProductsContent();
      case 'giftcards':
        return renderGiftCardsContent();
      case 'finance':
        return renderFinanceContent();
      case 'reports':
        return renderReportsContent();
      case 'queue':
        return renderQueueContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderOverviewContent();
    }
  };

  // Overview content (important content shown on front page)
  const renderOverviewContent = () => {
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
      <div className="space-y-8">
        {/* Welcome Banner after Setup Completion */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white relative animate-fade-in">
            <button 
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-12 w-12 text-white flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold mb-3">🎉 Congratulations! Your salon is now live!</h3>
                <p className="text-green-100 text-lg">
                  Your salon setup has been completed successfully. You can now start managing appointments, 
                  adding services, and growing your business. Welcome to Auracare!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Needs Attention Alerts - Added immediately after Welcome Banner */}
        <NeedsAttentionAlerts />

        {/* Pending Schedule Requests - Added after Needs Attention Alerts */}
        <PendingScheduleRequests />

        {/* Client Recommendations Section - Added after Pending Schedule Requests */}
        <div className="mb-8">
          <ClientRecommendations />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<DollarSign size={24} className="text-blue-600" />} 
            title="Monthly Revenue" 
            value={`₹${statistics.monthlyRevenue.toFixed(2)}`} 
            color="border-blue-500"
          />
          <StatCard 
            icon={<Briefcase size={24} className="text-green-600" />} 
            title="Total Services" 
            value={statistics.totalServices} 
            color="border-green-500"
            onClick={() => navigate('/salon/services')}
          />
          <StatCard 
            icon={<ShoppingCart size={24} className="text-blue-600" />} 
            title="Total Products" 
            value={0} 
            color="border-blue-500"
            onClick={() => navigate('/salon/products')}
          />
          <StatCard 
            icon={<Users size={24} className="text-purple-600" />} 
            title="Total Staff" 
            value={statistics.totalStaff} 
            color="border-purple-500"
            onClick={() => navigate('/salon/staff')}
          />
          <StatCard 
            icon={<Calendar size={24} className="text-indigo-600" />} 
            title="Pending Appointments" 
            value={statistics.pendingAppointments} 
            color="border-indigo-500"
          />
        </div>

        {/* Staff Availability Calendar */}
        <AvailabilityCard 
          color="border-indigo-500"
          onClick={() => navigate('/salon/staff-availability')}
        />

        {/* Expense Tracking Card - Added after Statistics Grid */}
        <ExpenseTrackingCard 
          expenses={expenses}
          totalExpenses={totalExpenses}
          onAddExpense={handleAddExpense}
          onViewDetails={handleViewExpenseDetails}
        />

        {/* Payroll Processing Card */}
        <PayrollProcessingCard />

        {/* Payroll Summary Table */}
        <PayrollSummaryTable />

        {/* Staff Feedback Inbox */}
        <StaffFeedbackInbox salonId={salonInfo?._id} />

        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pending Appointments</h2>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchPendingAppointments}
                disabled={loadingAppointments}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAppointments ? 'animate-spin' : ''}`} />
                {loadingAppointments ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => navigate('/salon/appointments')}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition"
              >
                <Calendar className="h-4 w-4" />
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loadingAppointments && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <tr key={appt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserCog className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customerName}</div>
                            <div className="text-sm text-gray-500">{customerEmail}</div>
                            <div className="text-xs text-gray-400 mt-1">ID: {bookingId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                                <div className="text-xs text-gray-500 mt-1">
                                  +{services.length - 1} more service{services.length > 2 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No services</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{appointmentDate}</div>
                          <div className="text-gray-500">{appointmentTime}</div>
                          {appt.estimatedDuration && (
                            <div className="text-xs text-gray-400 mt-1">{appt.estimatedDuration} mins</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="font-bold">₹{totalAmount}</div>
                        {(customerNotes || specialRequests) && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs">
                            {customerNotes && <div className="truncate">Note: {customerNotes}</div>}
                            {specialRequests && <div className="truncate">Special: {specialRequests}</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {appt.status || 'Pending'}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(appt.createdAt || appt.dateCreated).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleAssignStaff(appt)}
                          className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                        >
                          <UserCog className="h-3 w-3" />
                          Assign Staff
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!upcoming || upcoming.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                        <div className="text-gray-500">
                          <div className="text-lg font-medium mb-1">No pending appointments</div>
                          <div className="text-sm">All appointments are up to date!</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Show count of pending appointments */}
          {upcoming && upcoming.length > 0 && (
            <div className="mt-6 text-sm text-gray-600 flex items-center justify-between">
              <span>Showing {Math.min(upcoming.length, 20)} pending appointment{upcoming.length !== 1 ? 's' : ''}</span>
              {upcoming.length >= 20 && (
                <button 
                  onClick={() => navigate('/salon/appointments')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  View all
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Reviews and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Reviews</h2>
                  <p className="text-sm text-gray-500">Customer feedback on your services</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/salon/reviews')}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                View all
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {reviews.length === 0 && (
                <div className="text-center py-8 rounded-lg border border-dashed border-gray-300">
                  <Star className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 font-medium">No reviews yet</p>
                  <p className="text-sm text-gray-400 mt-1">Encourage customers to leave feedback</p>
                </div>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserCog className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{r.customer}</p>
                        <p className="text-xs text-gray-400">{r.date ? new Date(r.date).toLocaleDateString() : ''}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-max">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-500">Manage your salon efficiently</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <PlusCircle className="h-5 w-5" /> 
                  Add New Service
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5" /> 
                  Add New Product
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/services')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5" /> 
                  Manage All Services
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/products')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5" /> 
                  Manage Products
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/staff')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <UserCog className="h-5 w-5" /> 
                  Manage Staff
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/staff/new')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <UserCog className="h-5 w-5" /> 
                  Add New Staff
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/reports')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <FileBarChart2 className="h-5 w-5" /> 
                  View Reports
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/expenses')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" /> 
                  Track Expenses
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/salon/notifications')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <Mail className="h-5 w-5" /> 
                  Staff Replies
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Add Gift Cards button */}
              <button
                onClick={() => setActiveTab('giftcards')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-yellow-600 text-white hover:bg-yellow-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" /> 
                  Gift Cards
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Add Queue Management button */}
              <button
                onClick={() => setActiveTab('queue')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-indigo-700 text-white hover:bg-indigo-800 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" /> 
                  Queue Management
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Add Cancellations button */}
              <button
                onClick={() => navigate('/salon/cancellations')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <XCircle className="h-5 w-5" /> 
                  Cancellations
                </span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Appointments content
  const renderAppointmentsContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Appointments Management</h2>
          <button
            onClick={() => navigate('/salon/appointments')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            View All Appointments
          </button>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Manage all your salon appointments from this section.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>View and manage pending appointments</li>
            <li>Assign staff to appointments</li>
            <li>Track appointment history</li>
            <li>Handle cancellations and rescheduling</li>
          </ul>
        </div>
      </div>
    );
  };

  // Staff content
  const renderStaffContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/salon/staff')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Manage Staff
            </button>
            <button
              onClick={() => navigate('/salon/staff/new')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add New Staff
            </button>
          </div>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Manage your salon staff and their availability.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Add and remove staff members</li>
            <li>Set staff availability and working hours</li>
            <li>Assign services to staff members</li>
            <li>View staff performance and schedules</li>
          </ul>
        </div>
      </div>
    );
  };

  // Services content
  const renderServicesContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsAddServiceModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add New Service
            </button>
            <button
              onClick={() => setIsAddPackageModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Add Package
            </button>
            <button
              onClick={() => navigate('/salon/services')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Manage All Services
            </button>
          </div>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Manage the services your salon offers.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Add, edit, and remove services</li>
            <li>Set pricing and duration for each service</li>
            <li>Assign services to staff members</li>
            <li>Organize services by category</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-800 font-medium">Full CRUD Operations Available</p>
            <p className="text-blue-700 text-sm mt-1">Click "Manage All Services" to view, edit, and delete existing services.</p>
          </div>
        </div>
      </div>
    );
  };

  // Packages content
  const renderPackagesContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Package Management</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsAddPackageModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Add New Package
            </button>
            <button
              onClick={() => navigate('/salon/packages')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Manage All Packages
            </button>
          </div>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Manage the occasion-based packages your salon offers.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create packages for special occasions like weddings, birthdays, corporate events</li>
            <li>Bundle multiple services together at discounted prices</li>
            <li>Set pricing and duration for each package</li>
            <li>Organize packages by occasion type and target audience</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-800 font-medium">Full CRUD Operations Available</p>
            <p className="text-blue-700 text-sm mt-1">Click "Manage All Packages" to view, edit, and delete existing packages.</p>
          </div>
        </div>
      </div>
    );
  };

  // Products content
  const renderProductsContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <button
            onClick={() => navigate('/salon/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Manage All Products
          </button>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Manage the retail products your salon offers.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Add, edit, and remove products</li>
            <li>Set pricing and inventory levels</li>
            <li>Organize products by category</li>
            <li>Track product sales and performance</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-800 font-medium">Full CRUD Operations Available</p>
            <p className="text-blue-700 text-sm mt-1">Click "Manage All Products" to view, edit, and delete existing products.</p>
          </div>
        </div>
      </div>
    );
  };

  // Finance content
  const renderFinanceContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Financial Management</h2>
          <button
            onClick={() => navigate('/salon/expenses')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            View Financial Details
          </button>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Track and manage your salon's finances.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Track income and expenses</li>
            <li>Monitor revenue by service</li>
            <li>Manage payroll for staff</li>
            <li>Generate financial reports</li>
          </ul>
        </div>
      </div>
    );
  };

  // Reports content
  const renderReportsContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <button
            onClick={() => navigate('/salon/reports')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            View Detailed Reports
          </button>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Access detailed reports and analytics for your salon.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>View revenue reports</li>
            <li>Analyze service performance</li>
            <li>Track staff productivity</li>
            <li>Review customer feedback trends</li>
          </ul>
        </div>
      </div>
    );
  };

  // Queue content
  const renderQueueContent = () => {
    if (!salonInfo) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Queue Management</h2>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p>Loading salon information...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Queue Management</h2>
        </div>
        <QueueManagement salonId={salonInfo._id} />
      </div>
    );
  };

  // Settings content
  const renderSettingsContent = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={() => navigate('/salon/edit-profile')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
        <div className="text-gray-600">
          <p className="mb-4">Manage your salon settings and preferences.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Update salon information and contact details</li>
            <li>Set business hours and working days</li>
            <li>Configure notification preferences</li>
            <li>Manage account security settings</li>
          </ul>
        </div>
      </div>
    );
  };

  // Gift Cards content
  const renderGiftCardsContent = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gift Cards</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/salon/gift-card-redemption')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Redeem Gift Card
              </button>
              <button
                onClick={() => navigate('/salon/gift-cards')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Manage Gift Cards
              </button>
            </div>
          </div>
          <div className="text-gray-600">
            <p className="mb-4">Create and manage digital gift cards for your salon.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create gift cards with custom names, amounts, and expiry dates</li>
              <li>Set usage types (services only, products only, or both)</li>
              <li>Define terms and conditions for each gift card</li>
              <li>Track gift card redemptions and manage active/inactive cards</li>
              <li>Verify and redeem gift cards when customers use them</li>
            </ul>
          </div>
        </div>
        
        {/* Gift Card Recipients Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gift Card Recipients</h2>
          </div>
          <GiftCardRecipientsComponent salonId={dashboardData?.salonInfo?._id} />
        </div>
      </div>
    );
  };

  if (loading && activeTab === 'overview') {
    return <LoadingSpinner />;
  }

  if (error && activeTab === 'overview') {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!dashboardData && activeTab === 'overview') {
    return <div className="text-center">No dashboard data available.</div>;
  }

  const { salonInfo } = dashboardData || {};
  const workingDays = Array.isArray(salonInfo?.businessHours?.workingDays)
    ? salonInfo.businessHours.workingDays.join(', ')
    : 'Working days not specified';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-60 mb-8 rounded-2xl overflow-hidden flex items-center justify-center text-white shadow-lg">
        {heroImages.map((src, index) => (
          <img
            key={src}
            src={src}
            alt="Salon background"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center">
                  <BackButton fallbackPath="/salon/dashboard" className="mr-4 text-white" />
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome, {salonInfo?.salonName}!</h1>
                    <p className="text-gray-200">Here is your salon's performance at a glance.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate('/salon/edit-profile')}
                    className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium border border-white/20 text-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                  <LogoutButton />
                </div>
            </header>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Horizontal Navigation Bar */}
        <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>

      <AddServiceModal 
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onServiceAdded={handleServiceAdded}
      />

      <AddPackageModal 
        isOpen={isAddPackageModalOpen}
        onClose={() => setIsAddPackageModalOpen(false)}
        onPackageAdded={handlePackageAdded}
        salonId={dashboardData?.salonInfo?._id}
      />

      <AddProductModal 
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onProductAdded={() => {
          setIsAddProductModalOpen(false);
          // Refresh products if needed
        }}
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
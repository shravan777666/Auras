import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff';
import { staffNotificationService } from '../../services/staffNotification';
import { staffInvitationService } from '../../services/staffInvitation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import UpcomingAppointmentsCard from '../../components/staff/UpcomingAppointmentsCard';
import NextClientCountdown from '../../components/staff/NextClientCountdown';
import PayrollRecordsCard from '../../components/staff/PayrollRecordsCard';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Scissors,
  BarChart,
  Settings,
  Edit2,
  Bell,
  Plus,
  MessageSquare,
  Mail,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import PeerShiftSwapReview from '../../components/ScheduleRequestForms/PeerShiftSwapReview';
import BackButton from '../../components/common/BackButton';
import FeedbackSubmissionModal from '../../components/staff/FeedbackSubmissionModal';

ChartJS.register(ArcElement, Tooltip, Legend);

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

// A reusable card for displaying sections
const DashboardCard = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
    {children}
  </div>
);

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [showPeerReview, setShowPeerReview] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Load notifications and invitations
  const loadNotifications = async () => {
    try {
      // Load notifications
      const response = await staffNotificationService.getNotifications({ 
        limit: 5, 
        unreadOnly: false 
      });
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
      
      // Check for pending invitations
      const invitationResponse = await staffInvitationService.getPendingInvitations();
      setPendingInvitations(invitationResponse.length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Don't show error toast for notifications as it's not critical
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await staffService.getDashboardData();
        if (response.success) {
          setDashboardData(response.data);
        } else {
          const errorMsg = response.message || 'Failed to fetch dashboard data.';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (err) {
        console.error('Staff Dashboard Error:', err);
        const errorMsg = err.response?.data?.message || err.message || 'An error occurred while fetching data.';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    loadNotifications();
  }, [refreshTrigger]);

  useEffect(() => {
    // Set up auto-refresh
    const refreshInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleBookNewAppointment = () => {
    navigate('/staff/book-appointment');
  };

  const handleSendReminder = () => {
    toast.success('Reminder sent successfully!');
  };

  const handleEditProfile = () => {
    navigate('/staff/edit-profile');
  };

  // Add new handler functions for schedule requests
  const handleBlockTime = () => {
    navigate('/staff/schedule');
    // In a real implementation, we would open a modal or pass state to show the block time form
  };

  const handleRequestTimeOff = () => {
    navigate('/staff/schedule');
    // In a real implementation, we would open a modal or pass state to show the leave request form
  };

  const handleRequestShiftSwap = () => {
    navigate('/staff/schedule');
    // In a real implementation, we would open a modal or pass state to show the shift swap form
  };

  // Add handler for peer review
  const handlePeerReview = () => {
    setShowPeerReview(true);
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackModal(true);
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

  const { staffInfo, statistics, todayAppointments, upcomingClients, performance } = dashboardData;

  const getClientProfileImage = (clientName) => {
    // This is a placeholder for a function that would fetch the client's profile image
    // For now, it returns a placeholder image
    return `https://ui-avatars.com/api/?name=${clientName}&background=random&color=fff&rounded=true`;
  };

  const getDoughnutChartData = () => {
    if (!performance?.services) return null;
    const labels = Object.keys(performance.services);
    const data = Object.values(performance.services);
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#a4de6c']; // Example colors

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const doughnutData = getDoughnutChartData();

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex-shrink-0 border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Salon Name</h1>
          </div>
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <img
                src={staffInfo.profilePicture || `https://ui-avatars.com/api/?name=${staffInfo.name}&background=random&color=fff&rounded=true`}
                alt={staffInfo.name}
                className="w-24 h-24 rounded-full object-cover shadow-sm mb-2"
              />
              <p className="text-lg font-semibold text-gray-800">{staffInfo.name}</p>
              <button
                onClick={handleEditProfile}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
          <nav className="flex-grow">
            <ul>
              <li className="mb-4">
                <button onClick={() => navigate('/staff/schedule')} className="w-full text-left flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <User size={20} /> My Schedule
                </button>
              </li>
              <li className="mb-4">
                <button onClick={() => navigate('/staff/services')} className="w-full text-left flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <Scissors size={20} /> Services
                </button>
              </li>
              <li className="mb-4">
                <button onClick={() => navigate('/staff/report')} className="w-full text-left flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <BarChart size={20} /> Reports
                </button>
              </li>
              <li className="mb-4">
                <button 
                  onClick={() => navigate('/staff/broadcasts')} 
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={20} /> Broadcasts
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </li>
              <li className="mb-4">
                <button 
                  onClick={handlePeerReview}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus size={20} /> Shift Swap Requests
                  </div>
                  {/* We could add a count here if needed */}
                </button>
              </li>
              <li className="mb-4">
                <button onClick={() => navigate('/staff/invitations')} className="w-full text-left flex items-center justify-between p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail size={20} /> Invitations
                  </div>
                  {pendingInvitations > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {pendingInvitations}
                    </span>
                  )}
                </button>
              </li>
              <li className="mb-4">
                <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <Settings size={20} /> Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BackButton fallbackPath="/staff/dashboard" className="mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {staffInfo.name}!</h1>
                <p className="text-gray-600">Ready for a productive day?</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <img
                src={staffInfo.profilePicture || `https://ui-avatars.com/api/?name=${staffInfo.name}&background=random&color=fff&rounded=true`}
                alt={staffInfo.name}
                className="w-16 h-16 rounded-full object-cover shadow-sm"
              />
              <button
                onClick={handleEditProfile}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Edit2 size={16} className="mr-1" />
                Edit Profile
              </button>
            </div>
          </div>
        </header>

        {/* Next Client Countdown - MOST PROMINENT POSITION */}
        <NextClientCountdown />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Calendar size={32} className="text-blue-500" />}
            title="Total Appointments"
            value={statistics.totalAppointments}
            color="border-blue-500"
          />
          <StatCard
            icon={<Clock size={32} className="text-yellow-500" />}
            title="Today's Appointments"
            value={statistics.todayAppointments}
            color="border-yellow-500"
          />
          <StatCard
            icon={<TrendingUp size={32} className="text-indigo-500" />}
            title="Upcoming Appointments"
            value={statistics.upcomingAppointments}
            color="border-indigo-500"
          />
          <StatCard
            icon={<CheckCircle size={32} className="text-green-500" />}
            title="Completed Appointments"
            value={statistics.completedAppointments}
            color="border-green-500"
          />
        </div>

        {/* Dashboard Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardCard title="Today's Schedule" className="h-full">
              {todayAppointments && todayAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {todayAppointments.map((appointment, index) => (
                    <li key={index} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{appointment.clientName}</p>
                        <p className="text-sm text-gray-500">{appointment.service}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-600">{appointment.time}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">You have no appointments scheduled for today.</p>
              )}
              
              {/* Add Schedule Request Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Schedule Requests</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleBlockTime}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                  >
                    Block Break/Lunch Time
                  </button>
                  <button
                    onClick={handleRequestTimeOff}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                  >
                    Request Time Off
                  </button>
                  <button
                    onClick={handleRequestShiftSwap}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors"
                  >
                    Request Shift Swap
                  </button>
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="lg:col-span-1">
            <DashboardCard title="Performance Snapshot" className="h-full">
              <div className="flex flex-col items-center">
                <div className="w-full h-40 flex items-center justify-center">
                  {doughnutData ? (
                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                  ) : (
                    <p className="text-gray-500 text-sm">No performance data available.</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-center mt-4 text-sm gap-4">
                  {doughnutData?.labels.map((label, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: doughnutData.datasets[0].backgroundColor[index] }}></span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                {performance?.clientRating && (
                  <div className="mt-4 flex items-center gap-2">
                    <p className="text-gray-600 font-medium">Client Rating:</p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < performance.clientRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
          
          {/* Payroll Records Card */}
          <div className="lg:col-span-1">
            <PayrollRecordsCard />
          </div>
        </div>

        {/* Recent Broadcasts Section */}
        <div className="mt-8">
          <DashboardCard title="Recent Broadcasts & Notifications">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </span>
              </div>
              <button
                onClick={() => navigate('/staff/broadcasts')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
            
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => {
                  const formatted = staffNotificationService.formatNotificationData(notification);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'
                      }`}
                      onClick={() => {
                        // Check if this is a shift swap notification
                        if (notification.subject.includes('Shift Swap Request')) {
                          handlePeerReview();
                        } else {
                          navigate('/staff/broadcasts');
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.subject}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${formatted.categoryColor}`}>
                              {staffNotificationService.getCategoryDisplayName(notification.category)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            From: {notification.sender.salonName}
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="ml-4 text-xs text-gray-500">
                          {formatted.timeAgo}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {notifications.length > 3 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => navigate('/staff/broadcasts')}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View {notifications.length - 3} more notification{notifications.length - 3 > 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No broadcasts or notifications yet.</p>
                <p className="text-gray-400 text-xs mt-1">
                  Salon owners will send you messages and announcements here.
                </p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Quick Actions and Upcoming Client Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <DashboardCard title="Quick Actions">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleBookNewAppointment}
                className="flex-1 min-w-[200px] flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors"
              >
                <Plus size={24} className="text-gray-600 mb-2" />
                <span className="font-semibold text-gray-800">Book New Appointment</span>
              </button>
              <button
                onClick={handleSendReminder}
                className="flex-1 min-w-[200px] flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors"
              >
                <Bell size={24} className="text-gray-600 mb-2" />
                <span className="font-semibold text-gray-800">Send Reminder</span>
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="flex-1 min-w-[200px] flex flex-col items-center p-6 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors"
              >
                <MessageSquare size={24} className="text-gray-600 mb-2" />
                <span className="font-semibold text-gray-800">Submit Feedback</span>
              </button>
            </div>
          </DashboardCard>

          <DashboardCard title="Upcoming Client Spotlight">
            {upcomingClients && upcomingClients.length > 0 ? (
              <ul className="space-y-4">
                {upcomingClients.map((client, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <img
                      src={getClientProfileImage(client.name)}
                      alt={client.name}
                      className="w-16 h-16 rounded-full object-cover shadow-sm"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{client.name}</p>
                      <p className="text-sm text-gray-500">
                        {client.preferences || 'No preferences listed.'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No upcoming clients to spotlight.</p>
            )}
          </DashboardCard>
        </div>
      </main>
      
      {/* Peer Shift Swap Review Modal */}
      <PeerShiftSwapReview
        isOpen={showPeerReview}
        onClose={() => setShowPeerReview(false)}
        onActionComplete={() => {
          // Refresh notifications when an action is completed
          loadNotifications();
        }}
      />

      <FeedbackSubmissionModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
};

export default StaffDashboard;
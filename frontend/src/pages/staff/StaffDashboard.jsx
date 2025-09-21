import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import UpcomingAppointmentsCard from '../../components/staff/UpcomingAppointmentsCard';
import { toast } from 'react-hot-toast';
import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';

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

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await staffService.getDashboardData();
        console.log('Staff Dashboard Response:', response);
        
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
        
        // Handle specific error cases
        if (err.response?.status === 403) {
          if (errorMsg.includes('Staff setup required')) {
            setError('Please complete your staff profile setup to access the dashboard.');
          } else if (errorMsg.includes('Staff access required')) {
            setError('You need staff permissions to access this dashboard.');
          } else {
            setError(errorMsg);
          }
        } else if (err.response?.status === 401) {
          setError('Please log in to access the dashboard.');
        } else if (err.response?.status === 404) {
          setError('Staff profile not found. Please contact support.');
        } else {
          setError(errorMsg);
        }
        
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up auto-refresh for appointments every 30 seconds
    const refreshInterval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCompletedAppointmentsClick = () => {
    navigate('/staff/completed-appointments');
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

  const { staffInfo, statistics, assignedSalon } = dashboardData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {staffInfo.name}!</h1>
        <p className="text-gray-600">
          {assignedSalon ? `You are currently assigned to ${assignedSalon.salonName}.` : 'You are not currently assigned to a salon.'}
        </p>
      </header>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          onClick={handleCompletedAppointmentsClick}
        />
      </div>

      {/* Upcoming Appointments */}
      <div className="mt-8">
        <UpcomingAppointmentsCard onRefresh={refreshTrigger} />
      </div>
    </div>
  );
};

export default StaffDashboard;

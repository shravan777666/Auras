import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staff';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';

// A reusable card for displaying statistics
const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md flex items-center gap-4 border-l-4 ${color}`}>
    {icon}
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const StaffDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

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
        />
      </div>

      {/* Placeholder for future charts or tables */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
        <p className="text-gray-500">Future implementation: A list of today's appointments will be displayed here.</p>
      </div>
    </div>
  );
};

export default StaffDashboard;

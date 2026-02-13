import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  Star, 
  Award, 
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  MessageCircle,
  LogOut,
  Tag
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import freelancerService from '../../services/freelancerService';
import toast from 'react-hot-toast';

const FreelancerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    earnings: 0,
    rating: 0,
    reviews: 0
  });
  const [profile, setProfile] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('available'); // Default to available
  const [error, setError] = useState(null);

  // Load freelancer dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await freelancerService.getDashboardStats();
        setStats(statsResponse.data || {
          totalAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          earnings: 0,
          rating: 0,
          reviews: 0
        });
        
        // Fetch freelancer profile
        const profileResponse = await freelancerService.getProfile();
        setProfile(profileResponse.data);
        
        // Fetch recent appointments
        const appointmentsResponse = await freelancerService.getRecentAppointments();
        setRecentAppointments(appointmentsResponse.data || []);
        
        // Fetch availability status
        const scheduleResponse = await freelancerService.getSchedule();
        setAvailabilityStatus(scheduleResponse.data?.availabilityStatus || 'available');
        
      } catch (error) {
        console.error('Error loading freelancer dashboard:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
        
        // Set default values on error
        setStats({
          totalAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          earnings: 0,
          rating: 0,
          reviews: 0
        });
        setRecentAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading freelancer dashboard..." />;
  }

  const statsCards = [
    {
      title: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600',
      change: '+12% from last month'
    },
    {
      title: 'Completed',
      value: stats?.completedAppointments || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      change: '+8% from last month'
    },
    {
      title: 'Pending',
      value: stats?.pendingAppointments || 0,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
      change: '-3 from last month'
    },
    {
      title: 'Earnings',
      value: `₹${stats?.earnings || 0}`,
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600',
      change: '+15% from last month'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Freelancer'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                onClick={() => {
                  // Navigate to freelancer setup page to edit profile
                  navigate('/freelancer/setup');
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                onClick={async () => {
                  try {
                    // Call the logout function from auth context
                    await logout();
                    // Redirect to home page after logout
                    navigate('/');
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Approval Status</p>
                <p className={`text-sm font-semibold ${user?.approvalStatus === 'approved' ? 'text-green-600' : user?.approvalStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {user?.approvalStatus?.charAt(0)?.toUpperCase() + user?.approvalStatus?.slice(1) || 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Overview</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{user?.name || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Service Location</p>
                    <p className="font-medium">{profile?.serviceLocation || profile?.location || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium">{profile?.yearsOfExperience || profile?.experience || 'N/A'} years</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium ml-1">{stats?.rating || 0}</span>
                      <span className="text-gray-400 ml-1">({stats?.reviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || []).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                  >
                    {typeof skill === 'string' ? skill : skill?.name || 'Skill'}
                  </span>
                ))}
                {(!profile?.skills || profile.skills.length === 0) && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-medium rounded-full">
                    No skills added yet
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/freelancer/appointments"
                  className="w-full flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Appointments
                </Link>
                <Link
                  to="/freelancer/services"
                  className="w-full flex items-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Services
                </Link>
                <Link
                  to="/freelancer/messages"
                  className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Appointments and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Appointments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                <Link 
                  to="/freelancer/appointments" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentAppointments && recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment) => {
                    const customerName = typeof appointment.customer === 'string' 
                      ? appointment.customer 
                      : appointment.customer?.name || 'Unknown';
                    const services = typeof appointment.services === 'string'
                      ? appointment.services
                      : 'Service';
                    
                    return (
                  <div key={appointment.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            {customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customerName}</p>
                            <p className="text-sm text-gray-600">{services}</p>
                          </div>
                        </div>
                        
                        <div className="ml-13 space-y-1">
                          <p className="text-sm font-medium text-gray-900">₹{appointment.finalAmount || appointment.amount || 0}</p>
                          <p className="text-xs text-gray-500">{appointment.date || 'N/A'} at {appointment.time || 'N/A'}</p>
                          <div className="flex items-center mt-1">
                            {(appointment.status === 'Completed' || appointment.status === 'completed') && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                            {appointment.status === 'Approved' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </span>
                            )}
                            {(appointment.status === 'Pending' || appointment.status === 'pending') && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </span>
                            )}
                            {(appointment.status === 'Rejected' || appointment.status === 'rejected' || appointment.status === 'Cancelled' || appointment.status === 'cancelled') && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelled
                              </span>
                            )}
                            {appointment.rating && typeof appointment.rating === 'number' && (
                              <div className="flex items-center ml-2">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600 ml-1">{appointment.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Approve/Reject buttons for Pending appointments */}
                      {(appointment.status === 'Pending' || appointment.status === 'pending') && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={async () => {
                              try {
                                await freelancerService.approveAppointment(appointment.id);
                                toast.success('Appointment approved successfully');
                                // Refresh appointments
                                const data = await freelancerService.getRecentAppointments();
                                setRecentAppointments(data.data || []);
                              } catch (error) {
                                console.error('Error approving appointment:', error);
                                toast.error(error.response?.data?.message || 'Failed to approve appointment');
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await freelancerService.rejectAppointment(appointment.id);
                                toast.success('Appointment rejected');
                                // Refresh appointments
                                const data = await freelancerService.getRecentAppointments();
                                setRecentAppointments(data.data || []);
                              } catch (error) {
                                console.error('Error rejecting appointment:', error);
                                toast.error(error.response?.data?.message || 'Failed to reject appointment');
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No appointments yet</p>
                    <p className="text-sm mt-1">Your recent appointments will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Status</h3>
              <div className={`flex items-center justify-between p-4 rounded-lg border ${availabilityStatus === 'available' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center">
                  {availabilityStatus === 'available' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-3" />
                  )}
                  <div>
                    <p className={`font-medium ${availabilityStatus === 'available' ? 'text-green-800' : 'text-red-800'}`}>
                      {availabilityStatus === 'available' ? 'Available for bookings' : 'Unavailable for bookings'}
                    </p>
                    <p className={`text-sm ${availabilityStatus === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                      {availabilityStatus === 'available' ? 'Accepting new appointments' : 'Not accepting appointments'}
                    </p>
                  </div>
                </div>
                <button 
                  className={`px-4 py-2 text-white text-sm rounded-lg ${availabilityStatus === 'available' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  onClick={async () => {
                    try {
                      const newStatus = availabilityStatus === 'available' ? 'unavailable' : 'available';
                      await freelancerService.updateAvailability(newStatus);
                      setAvailabilityStatus(newStatus);
                      toast.success('Availability updated successfully');
                    } catch (error) {
                      console.error('Error updating availability:', error);
                      toast.error('Failed to update availability');
                    }
                  }}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
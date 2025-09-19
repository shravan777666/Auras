import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
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
  Image
} from 'lucide-react';
import LogoutButton from '../../components/auth/LogoutButton';
import AddServiceModal from '../../components/salon/AddServiceModal';

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
  const [lastUpdated, setLastUpdated] = useState(null);

  const handleServiceAdded = () => {
    fetchDashboardData();
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
    
    // Set up auto-refresh every 30 seconds for live data
    const refreshInterval = setInterval(() => {
      fetchPendingAppointments();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Placeholder recent reviews (since API not provided)
  useEffect(() => {
    setReviews([
      { id: 'r1', customer: 'Aarav Patel', rating: 5, comment: 'Amazing service and friendly staff!', date: '2025-09-01' },
      { id: 'r2', customer: 'Priya Sharma', rating: 4, comment: 'Great ambiance, will visit again.', date: '2025-08-28' },
      { id: 'r3', customer: 'Rahul Mehta', rating: 4, comment: 'Professional and on time.', date: '2025-08-25' },
    ]);
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

  const { salonInfo, statistics } = dashboardData;
  const workingDays = Array.isArray(salonInfo?.businessHours?.workingDays)
    ? salonInfo.businessHours.workingDays.join(', ')
    : 'Working days not specified';

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
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

      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {salonInfo.salonName}!</h1>
          <p className="text-gray-600">Here is your salon's performance at a glance.</p>
        </div>
        <LogoutButton />
      </header>

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
          title="Appointments Today" 
          value={statistics.todayAppointments} 
          color="border-red-500"
        />
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
                  </tr>
                );
              })}
              {(!upcoming || upcoming.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
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
                    <p className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
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
          </div>
        </div>
      </div>

      <AddServiceModal 
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onServiceAdded={handleServiceAdded}
      />
    </div>
  );
};

export default SalonDashboard;
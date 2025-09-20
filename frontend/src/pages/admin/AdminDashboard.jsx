import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Users, 
  Store, 
  Calendar, 
  DollarSign,
  User,
  LogOut,
  Home,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

// Utility function to determine file type
const getFileType = (url) => {
  if (!url) return 'unknown';
  const extension = url.split('.').pop().toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const pdfExtensions = ['pdf'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (pdfExtensions.includes(extension)) return 'pdf';
  return 'unknown';
};

// Document Card Component
const DocumentCard = ({ title, url, type, bgColor, buttonColor }) => {
  const [imageError, setImageError] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const openFullScreen = () => {
    if (type === 'image') {
      setIsFullScreenOpen(true);
    } else {
      window.open(url, '_blank');
    }
  };

  const renderContent = () => {
    if (type === 'image' && !imageError) {
      return (
        <>
          <img
            src={url}
            alt={title}
            className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={openFullScreen}
            onError={handleImageError}
          />
          {/* Full screen modal for images */}
          {isFullScreenOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100]" onClick={() => setIsFullScreenOpen(false)}>
              <div className="relative max-w-[90vw] max-h-[90vh]">
                <img
                  src={url}
                  alt={title}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => setIsFullScreenOpen(false)}
                  className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      );
    } else if (type === 'pdf') {
      return (
        <div className={`w-full h-48 ${bgColor} rounded-lg flex flex-col items-center justify-center mb-3`}>
          <div className="text-6xl mb-2">📄</div>
          <span className="text-sm text-gray-600 font-medium">PDF Document</span>
        </div>
      );
    } else {
      // Fallback for unknown types or image errors
      return (
        <div className={`w-full h-48 ${bgColor} rounded-lg flex flex-col items-center justify-center mb-3`}>
          <div className="text-6xl mb-2">
            {type === 'image' ? '🖼️' : '📄'}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {imageError ? 'Failed to load image' : 'Document'}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-4 shadow-md hover:shadow-lg transition-all duration-200">
      <h3 className="font-semibold text-gray-800 mb-3 text-center">{title}</h3>
      {renderContent()}
      <button
        onClick={openFullScreen}
        className={`w-full ${buttonColor} text-white py-2 px-4 rounded-lg transition-colors font-medium`}
      >
        {type === 'image' && !imageError ? 'View Full Size' : type === 'pdf' ? 'Open PDF' : 'View Document'}
      </button>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, unit = '', onClick }) => {
  const Icon = icon;
  return (
    <div 
      className={`bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-l-4 ${color} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{unit}{value.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-gray-100 rounded-xl">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
    </div>
  );
};

// Quick Action Button Component
const ActionButton = ({ title, icon, onClick }) => {
  const Icon = icon;
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="flex items-center">
        <Icon className="h-6 w-6 text-primary-600 mr-4" />
        <span className="text-lg font-semibold text-gray-700">{title}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSalons: 0,
    totalStaff: 0,
    totalRevenue: 0
  });
  const [showSalonListModal, setShowSalonListModal] = useState(false);
  const [allSalonsData, setAllSalonsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [showPendingStaffModal, setShowPendingStaffModal] = useState(false);
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchPendingStaffCount();

    // Listen for salon approval events to refresh stats in real-time
    const handleSalonApproved = () => {
      console.log('Salon approved event received, refreshing dashboard stats...');
      fetchDashboardStats();
    };

    window.addEventListener('salonApproved', handleSalonApproved);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('salonApproved', handleSalonApproved);
    };
  }, []);

  useEffect(() => {
    setFilteredSalons(
      allSalonsData.filter(salon =>
        salon.salonName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, allSalonsData]);
  
  const fetchDashboardStats = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('=== FETCHING DASHBOARD STATS ===');
      console.log('Current API Base URL:', import.meta.env.VITE_API_URL);
      console.log('Current Frontend Port:', window.location.port);
      console.log('Attempt:', retryCount + 1);
      
      const data = await adminService.getDashboardStats();
      console.log('=== DASHBOARD STATS RESPONSE ===', data);
      
      // Fallback: If totalSalons is 0, try the dedicated endpoint
      let totalSalons = data.totalSalons || 0;
      if (totalSalons === 0) {
        console.log('=== TRYING FALLBACK TOTAL SALON COUNT ===');
        try {
          const salonCountData = await adminService.getApprovedSalonsCount();
          console.log('=== FALLBACK SALON COUNT RESPONSE (approved only) ===', salonCountData);
          totalSalons = salonCountData.count ?? 0;
        } catch (fallbackError) {
          console.error('Fallback salon count failed:', fallbackError);
        }
      }
      
      const updatedStats = {
        totalSalons: totalSalons,
        totalStaff: data.totalStaff || 0,
        totalRevenue: data.totalRevenue || 0
      };
      
      setStats(updatedStats);
      console.log('=== FINAL STATS SET ===', updatedStats);
      
      // Show success message if salon count is now correct
      if (totalSalons > 0) {
        console.log(`✅ Successfully loaded ${totalSalons} salons`);
      } else {
        console.warn('⚠️ Total salons is still 0 - check database or API');
      }
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Retry logic for timeout errors with exponential backoff
      if (error.code === 'ECONNABORTED' && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying dashboard stats fetch... Attempt ${retryCount + 1} in ${delay}ms`);
        setTimeout(() => fetchDashboardStats(retryCount + 1), delay);
        return;
      }
      
      // Set fallback data on persistent errors
      setStats({
        totalSalons: 0,
        totalStaff: 0,
        totalRevenue: 0
      });
      
      // Show user-friendly error message
      if (error.code === 'ECONNABORTED') {
        toast.error('Dashboard loading slowly. Using cached data.', { duration: 4000 });
      } else {
        toast.error('Dashboard temporarily unavailable. Showing fallback data.', { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSalonsDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllSalonsDetails();
      setAllSalonsData(data.salons || []);
      setShowSalonListModal(true);
    } catch (error) {
      console.error('Error fetching all salon details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingStaffCount = async () => {
    try {
      console.log('Fetching pending staff count...');
      const response = await adminService.getPendingStaff();
      console.log('Pending staff response:', response);
      const count = Array.isArray(response) ? response.length : (response?.data ? response.data.length : 0);
      console.log('Setting pending staff count to:', count);
      setPendingStaffCount(count);
    } catch (error) {
      console.error('Error fetching pending staff count:', error);
      setPendingStaffCount(0);
    }
  };

  const fetchPendingStaff = async (retryCount = 0) => {
    try {
      setLoading(true);
      console.log('Fetching pending staff for modal...');
      const response = await adminService.getPendingStaff();
      console.log('=== FETCHED PENDING STAFF DATA ===');
      console.log('Staff Data:', response);
      if (response && response.length > 0) {
        console.log('First staff member:', response[0]);
        console.log('First staff profile picture:', response[0].profilePicture);
        console.log('First staff documents:', response[0].documents);
      }
      setPendingStaff(response || []);
      setPendingStaffCount(response ? response.length : 0);
      setShowPendingStaffModal(true);
    } catch (error) {
      console.error('Error fetching pending staff:', error);
      
      // Retry logic for timeout errors
      if (error.code === 'ECONNABORTED' && retryCount < 2) {
        console.log(`Retrying pending staff fetch... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchPendingStaff(retryCount + 1), 2000);
        return;
      }
      
      // Show user-friendly error message
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to fetch pending staff. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStaff = async (staffId) => {
    try {
      await adminService.approveStaff(staffId);
      toast.success('Staff member approved successfully!');
      // Refresh the pending staff list
      const response = await adminService.getPendingStaff();
      setPendingStaff(response.data || []);
      setPendingStaffCount(response.data ? response.data.length : 0);
      // Refresh dashboard stats
      fetchDashboardStats();
    } catch (error) {
      console.error('Error approving staff:', error);
      toast.error('Failed to approve staff member');
    }
  };

  const handleViewDocuments = (staff) => {
    console.log('=== VIEWING DOCUMENTS FOR STAFF ===');
    console.log('Staff data:', staff);
    console.log('Profile Picture:', staff.profilePicture);
    console.log('Documents:', staff.documents);
    console.log('Certificates:', staff.documents?.certificates);
    console.log('Government ID:', staff.documents?.governmentId);
    setSelectedStaff(staff);
    setShowDocumentModal(true);
  };

  const handleRejectStaff = (staff) => {
    setSelectedStaff(staff);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmRejectStaff = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      await adminService.rejectStaff(selectedStaff._id, { reason: rejectionReason });
      toast.success('Staff member rejected successfully!');
      setShowRejectModal(false);
      setRejectionReason('');
      // Refresh the pending staff list
      const response = await adminService.getPendingStaff();
      setPendingStaff(response.data || []);
      setPendingStaffCount(response.data ? response.data.length : 0);
      // Refresh dashboard stats
      fetchDashboardStats();
    } catch (error) {
      console.error('Error rejecting staff:', error);
      toast.error('Failed to reject staff member');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <div className="text-xs text-gray-500">
                {/* Frontend: {window.location.port} | API: {import.meta.env.VITE_API_URL} */}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Home className="h-5 w-5 text-gray-600" />
              </Link>
              <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <LogOut className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Admin'}!</h2>
            <p className="mt-1 text-md text-gray-500">Here's a summary of your application's activity.</p>
          </div>
          <button 
            onClick={() => navigate('/admin/salons')}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Store className="h-5 w-5 mr-2" />
            Manage Salons
          </button>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div onClick={() => navigate('/admin/salons')} className="cursor-pointer relative">
            <StatCard title="Total Salons" value={stats.totalSalons} icon={Store} color="border-primary-500" />
            {/* Debug Button */}
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  console.log('🔍 Direct salon count test...');
                  const data = await adminService.getApprovedSalonsCount();
                  console.log('📊 Direct approved salon count result:', data);
                  const count = data.count ?? 0;
                  alert(`Direct API call result: ${count} salons`);
                  // Update the stats with the direct result
                  setStats(prev => ({ ...prev, totalSalons: count }));
                } catch (error) {
                  console.error('❌ Direct salon count failed:', error);
                  alert(`API Error: ${error.message}`);
                }
              }}
              className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
              title="Test direct salon count API"
            >
              🔄
            </button>
          </div>
          <div onClick={() => navigate('/admin/staff')} className="cursor-pointer">
            <StatCard title="Total Staff" value={stats.totalStaff} icon={Users} color="border-secondary-500" />
          </div>
          <StatCard title="Total Revenue" value={stats.totalRevenue} icon={DollarSign} color="border-warning-500" unit="₹" />
        </div>

        

        {/* Pending Staff Approvals Card */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Pending Staff Approvals</h3>
              <button
                onClick={fetchPendingStaff}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                disabled={loading || pendingStaffCount === 0}
              >
                {pendingStaffCount === 0 ? 'No Pending Staff' : `View ${pendingStaffCount} Pending`}
              </button>
            </div>
            <p className="text-gray-600 mb-4">Staff members waiting for admin approval to access their dashboard.</p>
            <div className="text-3xl font-bold text-orange-600">
              {pendingStaffCount}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionButton 
              title="Pending Approvals" 
              icon={Store} 
              onClick={() => navigate('/admin/pending-approvals')} 
            />
            <ActionButton title="Manage Salons" icon={Store} onClick={() => navigate('/admin/salons')} />
            <ActionButton title="Manage Staff" icon={Users} onClick={() => navigate('/admin/staff')} />
          </div>
        </div>
      </main>

      {/* Salon List Modal */}
      {showSalonListModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-full max-w-4xl md:max-w-5xl lg:max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] flex flex-col">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">All Salons ({allSalonsData.length})</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search salons by name..."
                className="p-2 border border-gray-300 rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto flex-grow">
              {filteredSalons.length > 0 ? (
                <div className="grid gap-6">
                  {filteredSalons.map((salon) => (
                    <div key={salon._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{salon.salonName}</h4>
                          <p className="text-sm text-gray-600">Owner: {salon.ownerName || 'N/A'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            salon.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {salon.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {salon.approvalStatus || 'Approved'}
                          </span>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600"><strong>Email:</strong> {salon.email || 'N/A'}</p>
                          <p className="text-sm text-gray-600"><strong>Contact:</strong> {salon.contactNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600"><strong>Staff Count:</strong> {salon.staff?.length || 0}</p>
                          <p className="text-sm text-gray-600"><strong>Services Count:</strong> {salon.services?.length || 0}</p>
                        </div>
                      </div>

                      {/* Address */}
                      {salon.salonAddress && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600"><strong>Address:</strong> 
                            {typeof salon.salonAddress === 'string' 
                              ? salon.salonAddress 
                              : `${salon.salonAddress.street || ''}, ${salon.salonAddress.city || ''}, ${salon.salonAddress.state || ''} ${salon.salonAddress.postalCode || ''}`
                            }
                          </p>
                        </div>
                      )}

                      {/* Business Hours */}
                      {salon.businessHours && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600"><strong>Business Hours:</strong> 
                            {salon.businessHours.openTime} - {salon.businessHours.closeTime}
                          </p>
                          {salon.businessHours.workingDays && salon.businessHours.workingDays.length > 0 && (
                            <p className="text-sm text-gray-600"><strong>Working Days:</strong> {salon.businessHours.workingDays.join(', ')}</p>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {salon.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600"><strong>Description:</strong> {salon.description}</p>
                        </div>
                      )}

                      {/* Services */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {salon.services && salon.services.length > 0 ? (
                            salon.services.slice(0, 5).map((service, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-md">
                                {service.name} {service.price ? `(₹${service.price})` : ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No services listed</span>
                          )}
                          {salon.services && salon.services.length > 5 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                              +{salon.services.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Staff */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Staff:</p>
                        <div className="flex flex-wrap gap-2">
                          {salon.staff && salon.staff.length > 0 ? (
                            salon.staff.slice(0, 3).map((staff, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-secondary-100 text-secondary-800 rounded-md">
                                {staff.name} ({staff.employmentStatus})
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No staff assigned</span>
                          )}
                          {salon.staff && salon.staff.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                              +{salon.staff.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No salons found.</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSalonListModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Staff Modal */}
      {showPendingStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pending Staff Approvals ({pendingStaff.length})</h2>
              <button
                onClick={() => setShowPendingStaffModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {pendingStaff.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <p className="text-gray-500 text-lg">No pending staff approvals</p>
                <p className="text-gray-400 text-sm">All staff members have been processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingStaff.map((staff, index) => (
                  <div key={staff._id} className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {staff.approvalStatus || 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'Date not available'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {staff.profilePicture ? (
                              <img
                                src={staff.profilePicture}
                                alt={staff.name || 'Profile'}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-xl">👤</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-gray-800">{staff.name || 'Name not provided'}</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-16">Email:</span> 
                            <span className="text-blue-600">{staff.email || 'Not provided'}</span>
                          </p>
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-16">Phone:</span> 
                            <span>{staff.contactNumber || 'Not provided'}</span>
                          </p>
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-16">Role:</span> 
                            <span className="capitalize">{staff.role || 'Staff'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-20">Position:</span> 
                            <span>{staff.position || 'Not specified'}</span>
                          </p>
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-20">Experience:</span> 
                            <span>
                              {staff.experience?.years ? `${staff.experience.years} years` : 'Not specified'}
                              {staff.experience?.description && ` - ${staff.experience.description}`}
                            </span>
                          </p>
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-20">Skills:</span> 
                            <span className="text-xs">
                              {Array.isArray(staff.skills) ? staff.skills.join(', ') : (staff.skills || 'Not specified')}
                            </span>
                          </p>
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium w-20">Salon:</span> 
                            <span className="text-xs">{staff.assignedSalon?.salonName || 'Not assigned'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800 flex items-center">
                          <span className="mr-2">📄</span>
                          Uploaded Documents
                        </h4>
                        <button
                          onClick={() => handleViewDocuments(staff)}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          View All Documents
                        </button>
                      </div>
                      
                      {/* Quick preview: only ID Proof */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <div className="flex flex-col items-center">
                          {staff.documents?.governmentId ? (
                            <div 
                              className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80"
                              onClick={() => window.open(staff.documents.governmentId, '_blank')}
                            >
                              <span className="text-lg">🆔</span>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-lg">🆔</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-600 mt-1">ID</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-3 border-t border-orange-200">
                      <button
                        onClick={() => handleApproveStaff(staff._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <span>✓</span>
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectStaff(staff)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1"
                      >
                        <span>✗</span>
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {pendingStaff.length > 0 && `${pendingStaff.length} staff member(s) awaiting approval`}
              </div>
              <button
                onClick={() => setShowPendingStaffModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Documents - {selectedStaff.name}</h2>
                <p className="text-gray-600 text-sm">Click on images to view full size, or click buttons to open documents</p>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-semibold"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Picture */}
              {selectedStaff.profilePicture && (
                <DocumentCard
                  title="Profile Picture"
                  url={selectedStaff.profilePicture}
                  type="image"
                  bgColor="bg-blue-50"
                  buttonColor="bg-blue-500 hover:bg-blue-600"
                />
              )}

              {/* Government ID */}
              {selectedStaff.documents?.governmentId && (
                <DocumentCard
                  title="Government ID"
                  url={selectedStaff.documents.governmentId}
                  type={getFileType(selectedStaff.documents.governmentId)}
                  bgColor="bg-red-50"
                  buttonColor="bg-red-500 hover:bg-red-600"
                />
              )}

              {/* Certificates */}
              {selectedStaff.documents?.certificates?.map((cert, index) => (
                <DocumentCard
                  key={index}
                  title={`Certificate ${index + 1}`}
                  url={cert}
                  type={getFileType(cert)}
                  bgColor="bg-green-50"
                  buttonColor="bg-green-500 hover:bg-green-600"
                />
              ))}
            </div>

            {!selectedStaff.profilePicture && !selectedStaff.documents?.governmentId && !selectedStaff.documents?.certificates?.length && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-8xl mb-4">📄</div>
                <p className="text-gray-500 text-xl font-medium">No documents uploaded</p>
                <p className="text-gray-400 text-sm mt-2">This staff member hasn't uploaded any documents yet</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Staff Modal */}
      {showRejectModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Reject Staff Member</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to reject <strong>{selectedStaff.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Please provide a reason for rejection. This action cannot be undone.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectStaff}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rejecting...' : 'Reject Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
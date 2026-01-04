import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { customerService } from '../../services/customer';
import { queueService } from '../../services/queue';
import RateExperience from '../../components/customer/RateExperience';
import CancelAppointmentModal from '../../components/customer/CancelAppointmentModal';
import QRScanner from '../../components/customer/QRScanner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  X,
  Filter,
  QrCode
} from 'lucide-react';

const MyBookings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('recent'); // recent, thisMonth, lastMonth, older
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningBooking, setScanningBooking] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState({}); // Track check-in status for each booking

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching bookings for user:', user?.id);
      const res = await customerService.getBookings({ page: 1, limit: 50 });
      console.log('Bookings response:', res);
      if (res?.success) {
        setBookings(res.data || []);
      } else {
        setError(res?.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'An error occurred while fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRatingModal = (booking) => {
    setSelectedBooking(booking);
    setIsRatingModalOpen(true);
  };

  const handleCloseRatingModal = () => {
    setSelectedBooking(null);
    setIsRatingModalOpen(false);
  };

  const handleOpenCancelModal = (booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setSelectedBooking(null);
    setIsCancelModalOpen(false);
  };

  const handleCancelAppointment = async (cancellationData) => {
    try {
      // Refresh bookings to show updated status
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleSubmitReview = async (appointmentId, reviewData) => {
    try {
      await customerService.submitReview(appointmentId, reviewData);
      fetchBookings(); // Refresh bookings to show updated status
      handleCloseRatingModal();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleOpenQRScanner = (booking) => {
    setScanningBooking(booking);
    setShowQRScanner(true);
  };

  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
    setScanningBooking(null);
  };

  const handleQRScan = async (qrData) => {
    try {
      // If QR data is a URL, handle differently
      if (qrData.startsWith('http')) {
        const url = new URL(qrData);
        const pathParts = url.pathname.split('/');
        
        // Handle queue join URLs for appointment check-in
        if (pathParts.includes('queue') && pathParts.includes('join')) {
          const joinIndex = pathParts.indexOf('join');
          if (joinIndex !== -1 && pathParts[joinIndex + 1]) {
            const salonId = pathParts[joinIndex + 1];
            
            // Call the appointment check-in API using the salon ID
            const result = await queueService.appointmentCheckInViaQR(salonId);
            
            if (result.success) {
              // Update check-in status for this booking
              setCheckInStatus(prev => ({
                ...prev,
                [scanningBooking._id]: { success: true, message: result.message }
              }));
              
              // Refresh bookings to show updated status
              fetchBookings();
              
              // Show success message
              alert('Successfully checked in for your appointment! Your arrival has been noted by the salon.');
            } else {
              setCheckInStatus(prev => ({
                ...prev,
                [scanningBooking._id]: { success: false, message: result.message }
              }));
              
              alert(`Check-in failed: ${result.message}`);
            }
            return; // Exit early after handling appointment check-in
          }
        } else if (pathParts.includes('queue') && pathParts.includes('status')) {
          // Handle queue status URLs (for queue tokens)
          const statusIndex = pathParts.indexOf('status');
          if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
            const tokenNumber = pathParts[statusIndex + 1];
            
            // Validate token format before sending to API
            if (!tokenNumber || !tokenNumber.match(/^[A-Z]{3}\d{3}$/)) {
              alert(`Invalid token format. Expected format: QQQ001, got: ${tokenNumber}`);
              return;
            }
            
            // Call the queue check-in API
            const result = await queueService.checkInViaQR(tokenNumber);
            
            if (result.success) {
              // Update check-in status for this booking
              setCheckInStatus(prev => ({
                ...prev,
                [scanningBooking._id]: { success: true, message: result.message }
              }));
              
              // Refresh bookings to show updated status
              fetchBookings();
              
              // Show success message
              alert('Successfully checked in! Your arrival has been noted by the salon.');
            } else {
              setCheckInStatus(prev => ({
                ...prev,
                [scanningBooking._id]: { success: false, message: result.message }
              }));
              
              alert(`Check-in failed: ${result.message}`);
            }
            return; // Exit early after handling queue check-in
          }
        } else {
          alert('Unsupported QR code format. Please use the appropriate check-in QR code provided by the salon.');
          return;
        }
      }
      
      // If it's not a URL, try to treat it as a queue token
      let tokenNumber = qrData;
      
      // If we have the original data and it doesn't match token format, try extraction
      if (!qrData.match(/^[A-Z]{3}\d{3}$/)) {
        // Look for patterns like QQQ001 in the data
        const tokenMatch = qrData.match(/([A-Z]{3}\d{3})/);
        if (tokenMatch) {
          tokenNumber = tokenMatch[1];
        }
      }
      
      // Validate token format before sending to API
      if (!tokenNumber || !tokenNumber.match(/^[A-Z]{3}\d{3}$/)) {
        alert(`Invalid token format. Expected format: QQQ001, got: ${tokenNumber}`);
        return;
      }
      
      // Call the queue check-in API
      const result = await queueService.checkInViaQR(tokenNumber);
      
      if (result.success) {
        // Update check-in status for this booking
        setCheckInStatus(prev => ({
          ...prev,
          [scanningBooking._id]: { success: true, message: result.message }
        }));
        
        // Refresh bookings to show updated status
        fetchBookings();
        
        // Show success message
        alert('Successfully checked in! Your arrival has been noted by the salon.');
      } else {
        setCheckInStatus(prev => ({
          ...prev,
          [scanningBooking._id]: { success: false, message: result.message }
        }));
        
        alert(`Check-in failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error during QR check-in:', error);
      setCheckInStatus(prev => ({
        ...prev,
        [scanningBooking._id]: { success: false, message: error.message || 'Check-in failed' }
      }));
      
      alert(`Check-in failed: ${error.message || 'An error occurred'}`);
    } finally {
      handleCloseQRScanner();
    }
  };

  const canCheckIn = (booking) => {
    // Check if booking status allows check-in (only approved appointments)
    return ['Approved', 'approved'].includes(booking.status);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to filter bookings by time period
  const filterBookingsByTime = (bookings, filterType) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return bookings.filter(booking => {
      if (!booking.appointmentDate) return false;
      
      const bookingDate = new Date(booking.appointmentDate);
      
      switch (filterType) {
        case 'recent':
          return bookingDate >= sevenDaysAgo;
        case 'thisMonth':
          return bookingDate >= startOfThisMonth;
        case 'lastMonth':
          return bookingDate >= startOfLastMonth && bookingDate <= endOfLastMonth;
        case 'older':
          return bookingDate < startOfLastMonth;
        default:
          return true;
      }
    });
  };

  const filteredBookings = filterBookingsByTime(bookings, filter);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  if (loading) {
    return <LoadingSpinner text="Loading your bookings..." />;
  }

  // Show error message if there was an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookings</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchBookings}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>
      {isRatingModalOpen && selectedBooking && (
        <RateExperience
          appointment={selectedBooking}
          onSubmit={handleSubmitReview}
          onCancel={handleCloseRatingModal}
        />
      )}
      {isCancelModalOpen && selectedBooking && (
        <CancelAppointmentModal
          isOpen={isCancelModalOpen}
          onClose={handleCloseCancelModal}
          appointment={selectedBooking}
          onConfirm={handleCancelAppointment}
        />
      )}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={handleCloseQRScanner}
        />
      )}
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/customer/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">My Bookings</h1>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Filter Pills */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Filter by:
            </div>
            {[
              { key: 'recent', label: 'Recent' },
              { key: 'thisMonth', label: 'This Month' },
              { key: 'lastMonth', label: 'Last Month' },
              { key: 'older', label: 'Older' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md mx-auto">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No bookings found</h3>
              <p className="text-gray-500 mb-8">
                {filter === 'recent' 
                  ? "You haven't made any bookings in the last 7 days."
                  : filter === 'thisMonth'
                  ? "You haven't made any bookings this month."
                  : filter === 'lastMonth'
                  ? "You didn't have any bookings last month."
                  : "You don't have any older bookings."}
              </p>
              <Link
                to="/customer/book-appointment"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Book Your First Appointment
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const salonName = booking.salonId?.salonName || 'Unknown Salon';
              const salonAddress = booking.salonId?.salonAddress;
              const services = booking.services || [];
              const staffName = booking.staffId?.name || 'Not Assigned';
              
              return (
                <div key={booking._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    {/* Left Column - Booking Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                        <div className="flex items-center">
                          {getStatusIcon(booking.status)}
                          <h3 className="text-xl font-bold text-gray-900 ml-3">{salonName}</h3>
                        </div>
                        <div className="flex flex-wrap items-center mt-2 sm:mt-0 sm:ml-4 gap-2">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {booking.cancellationType && booking.cancellationType !== 'Early' && (
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                              {booking.cancellationType}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-5 w-5 mr-3 text-primary-500" />
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{formatDate(booking.appointmentDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-5 w-5 mr-3 text-primary-500" />
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">{formatTime(booking.appointmentTime)}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <User className="h-5 w-5 mr-3 text-primary-500" />
                          <div>
                            <p className="text-sm text-gray-500">Staff</p>
                            <p className="font-medium">{staffName}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-5 w-5 mr-3 text-primary-500" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">
                              {typeof salonAddress === 'string' 
                                ? salonAddress 
                                : salonAddress?.city || 'Address not available'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {services.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Services</h4>
                          <div className="flex flex-wrap gap-2">
                            {services.map((service, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg"
                              >
                                {service.serviceName || service.serviceId?.name || `Service ${index + 1}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {booking.customerNotes && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Your Notes</h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700">{booking.customerNotes}</p>
                          </div>
                        </div>
                      )}

                      {booking.cancellationFee > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                            <div>
                              <p className="text-sm font-semibold text-red-800">Cancellation Fee</p>
                              <p className="text-lg font-bold text-red-800">₹{booking.cancellationFee}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Actions and Total */}
                    <div className="md:w-64 md:ml-6 mt-6 md:mt-0">
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">₹{booking.finalAmount || booking.totalAmount || 0}</p>
                      </div>

                      <div className="space-y-3">
                        {booking.status === 'Pending' && (
                          <button 
                            onClick={() => handleOpenCancelModal(booking)}
                            className="w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </button>
                        )}
                        
                        {canCheckIn(booking) && (
                          <button 
                            onClick={() => handleOpenQRScanner(booking)}
                            className="w-full px-4 py-2.5 text-sm font-medium text-green-600 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Scan QR to Check-In
                          </button>
                        )}
                        
                        {booking.status === 'Completed' && !booking.rating?.overall && (
                          <button 
                            onClick={() => handleOpenRatingModal(booking)}
                            className="w-full px-4 py-2.5 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            Rate Experience
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
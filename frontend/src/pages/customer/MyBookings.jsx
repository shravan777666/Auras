import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { customerService } from '../../services/customer';
import RateExperience from '../../components/customer/RateExperience';
import CancelAppointmentModal from '../../components/customer/CancelAppointmentModal';
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
  X
} from 'lucide-react';

const MyBookings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('recent'); // recent, thisMonth, lastMonth, older
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
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
    <div className="min-h-screen bg-gray-50" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-in;
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
        {/* Time Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'recent', label: 'Recent (7 days)' },
              { key: 'thisMonth', label: 'This Month' },
              { key: 'lastMonth', label: 'Last Month' },
              { key: 'older', label: 'Older' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
                  filter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">
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
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const salonName = booking.salonId?.salonName || 'Unknown Salon';
              const salonAddress = booking.salonId?.salonAddress;
              const services = booking.services || [];
              const staffName = booking.staffId?.name || 'Not Assigned';
              
              return (
                <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        {getStatusIcon(booking.status)}
                        <h3 className="text-lg font-semibold text-gray-900 ml-2">{salonName}</h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.cancellationType && booking.cancellationType !== 'Early' && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            {booking.cancellationType}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(booking.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTime(booking.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <span>{staffName}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>
                            {typeof salonAddress === 'string' 
                              ? salonAddress 
                              : salonAddress?.city || 'Address not available'
                            }
                          </span>
                        </div>
                      </div>

                      {services.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Services:</h4>
                          <div className="flex flex-wrap gap-2">
                            {services.map((service, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                              >
                                {service.serviceName || service.serviceId?.name || `Service ${index + 1}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {booking.customerNotes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600">{booking.customerNotes}</p>
                        </div>
                      )}

                      {booking.cancellationFee > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-sm font-medium text-red-800">
                              Cancellation Fee: ₹{booking.cancellationFee}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">
                          Total: ₹{booking.finalAmount || booking.totalAmount || 0}
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                            View Details
                          </button>
                          {booking.status === 'Pending' && (
                            <button 
                              onClick={() => handleOpenCancelModal(booking)}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          )}
                          {booking.status === 'Completed' && !booking.rating?.overall && (
                            <button 
                              onClick={() => handleOpenRatingModal(booking)}
                              className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
                            >
                              Rate Experience
                            </button>
                          )}
                        </div>
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
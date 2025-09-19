import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Calendar, 
  Clock, 
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Mail,
  MapPin,
  Filter,
  Search
} from 'lucide-react';

const SalonAppointments = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, Pending, Confirmed, In-Progress, Completed, Cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter, currentPage]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(filter !== 'all' && { status: filter })
      };
      
      const res = await salonService.getAppointments(params);
      if (res?.success) {
        setAppointments(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalAppointments(res.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const filteredAppointments = appointments.filter(appointment => {
    if (searchTerm) {
      const customerName = appointment.customerId?.name || '';
      const serviceName = appointment.services?.[0]?.serviceName || appointment.services?.[0]?.serviceId?.name || '';
      return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setUpdatingStatus(appointmentId);
      const response = await salonService.updateAppointmentStatus(appointmentId, newStatus);
      if (response?.success) {
        console.log('Appointment status updated successfully');
        // Refresh the appointments list
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading appointments..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/salon/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Appointments</h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {totalAppointments} appointments
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All' },
              { key: 'Pending', label: 'Pending' },
              { key: 'Confirmed', label: 'Confirmed' },
              { key: 'In-Progress', label: 'In Progress' },
              { key: 'Completed', label: 'Completed' },
              { key: 'Cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You don't have any appointments yet." 
                : `No ${filter} appointments found.`
              }
            </p>
            <Link
              to="/salon/dashboard"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const customerName = appointment.customerId?.name || 'Unknown Customer';
              const customerEmail = appointment.customerId?.email || 'No email';
              const services = appointment.services || [];
              const staffName = appointment.staffId?.name || 'Not Assigned';
              
              return (
                <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        {getStatusIcon(appointment.status)}
                        <h3 className="text-lg font-semibold text-gray-900 ml-2">{customerName}</h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatTime(appointment.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <span>{staffName}</span>
                        </div>
                      </div>

                      {customerEmail && customerEmail !== 'No email' && (
                        <div className="flex items-center text-sm text-gray-600 mb-4">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{customerEmail}</span>
                        </div>
                      )}

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
                                {service.price && ` - ₹${service.price}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {appointment.customerNotes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Customer Notes:</h4>
                          <p className="text-sm text-gray-600">{appointment.customerNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">
                          Total: ₹{appointment.finalAmount || appointment.totalAmount || 0}
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50">
                            View Details
                          </button>
                          {appointment.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(appointment._id, 'Confirmed')}
                                disabled={updatingStatus === appointment._id}
                                className="px-3 py-1 text-sm text-green-600 hover:text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingStatus === appointment._id ? 'Confirming...' : 'Confirm'}
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(appointment._id, 'Cancelled')}
                                disabled={updatingStatus === appointment._id}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingStatus === appointment._id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </>
                          )}
                          {appointment.status === 'Confirmed' && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(appointment._id, 'In-Progress')}
                                disabled={updatingStatus === appointment._id}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingStatus === appointment._id ? 'Starting...' : 'Start Service'}
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(appointment._id, 'Cancelled')}
                                disabled={updatingStatus === appointment._id}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingStatus === appointment._id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </>
                          )}
                          {appointment.status === 'In-Progress' && (
                            <button 
                              onClick={() => handleStatusUpdate(appointment._id, 'Completed')}
                              disabled={updatingStatus === appointment._id}
                              className="px-3 py-1 text-sm text-green-600 hover:text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus === appointment._id ? 'Completing...' : 'Mark Complete'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonAppointments;


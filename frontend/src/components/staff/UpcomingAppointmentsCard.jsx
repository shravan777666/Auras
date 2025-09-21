import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staff';
import { Calendar, Clock, User, RefreshCw, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const UpcomingAppointmentsCard = ({ onRefresh }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  // Refresh when onRefresh is called (e.g., after appointment updates)
  useEffect(() => {
    if (onRefresh) {
      fetchUpcomingAppointments();
    }
  }, [onRefresh]);

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true);
      const response = await staffService.getUpcomingAppointments({ limit: 5 });
      
      if (response?.success) {
        setAppointments(response.data || []);
      } else {
        setError('Failed to fetch upcoming appointments');
      }
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      setError('Failed to fetch upcoming appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUpcomingAppointments();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-3 w-3" />;
      case 'Confirmed':
        return <Calendar className="h-3 w-3" />;
      case 'In-Progress':
        return <User className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner text="Loading appointments..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="text-center py-8 text-red-600">
          <Calendar className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh appointments"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">No upcoming appointments</p>
          <p className="text-sm">You don't have any scheduled appointments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {appointment.customerId?.name || 'Unknown Customer'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {appointment.salonId?.salonName || 'Salon'}
                      </p>
                    </div>
                  </div>

                  <div className="ml-11 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{formatTime(appointment.appointmentTime)}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Services: </span>
                      {appointment.services?.map((service, index) => (
                        <span key={index}>
                          {service.serviceName || service.serviceId?.name || 'Service'}
                          {index < appointment.services.length - 1 ? ', ' : ''}
                        </span>
                      )) || 'No services specified'}
                    </div>

                    {appointment.estimatedDuration && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Duration: </span>
                        {appointment.estimatedDuration} minutes
                      </div>
                    )}

                    {appointment.totalAmount && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Amount: </span>
                        ₹{appointment.totalAmount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    {appointment.status}
                  </div>
                  
                  {appointment.customerNotes && (
                    <div className="text-xs text-gray-500 max-w-32 text-right">
                      <span className="font-medium">Note: </span>
                      {appointment.customerNotes.length > 50 
                        ? `${appointment.customerNotes.substring(0, 50)}...`
                        : appointment.customerNotes
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {appointments.length >= 5 && (
            <div className="text-center pt-4">
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mx-auto">
                View All Appointments
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointmentsCard;

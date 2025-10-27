import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customer';
import LoadingSpinner from '../common/LoadingSpinner';
import { Clock, User, Calendar, Timer } from 'lucide-react';

const SalonAvailabilityDisplay = ({ salonId, selectedDate }) => {
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (salonId && selectedDate) {
      fetchSalonAvailability();
    } else {
      setAvailabilityData(null);
    }
  }, [salonId, selectedDate]);

  const fetchSalonAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.getSalonAvailability(salonId, selectedDate);
      
      if (response?.success) {
        setAvailabilityData(response.data);
      } else {
        setError('Failed to load availability information');
      }
    } catch (err) {
      console.error('Error fetching salon availability:', err);
      setError('Failed to load availability information');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDate) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <p className="text-gray-600 text-center">
          Select a date to view salon availability and staff schedules
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <LoadingSpinner text="Loading availability information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!availabilityData || !availabilityData.staffMembers) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <p className="text-gray-600 text-center">
          No availability information available for this date
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (time) => {
    if (!time || time === 'N/A') return 'N/A';
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculatePosition = (time, businessHours) => {
    if (!time || time === 'N/A' || !businessHours) return 0;
    
    const [openHours, openMinutes] = businessHours.openTime?.split(':').map(Number) || [0, 0];
    const [closeHours, closeMinutes] = businessHours.closeTime?.split(':').map(Number) || [24, 0];
    const [apptHours, apptMinutes] = time.split(':').map(Number);
    
    const openTotalMinutes = openHours * 60 + openMinutes;
    const closeTotalMinutes = closeHours * 60 + closeMinutes;
    const apptTotalMinutes = apptHours * 60 + apptMinutes;
    
    const totalTimeRange = closeTotalMinutes - openTotalMinutes;
    const timeFromOpen = apptTotalMinutes - openTotalMinutes;
    
    if (totalTimeRange <= 0) return 0;
    return Math.max(0, Math.min(100, (timeFromOpen / totalTimeRange) * 100));
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="h-5 w-5 mr-2" />
        Salon Availability for {new Date(selectedDate).toLocaleDateString()}
      </h3>
      
      {availabilityData.salonBusinessHours && (
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Salon Hours:</span> {
              availabilityData.salonBusinessHours.openTime && availabilityData.salonBusinessHours.closeTime 
                ? `${formatTime(availabilityData.salonBusinessHours.openTime)} - ${formatTime(availabilityData.salonBusinessHours.closeTime)}`
                : 'Not specified'
            }
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        {availabilityData.staffMembers.map((staffMember) => (
          <div key={staffMember.staff._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Staff Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                {staffMember.staff.profilePicture ? (
                  <img 
                    src={staffMember.staff.profilePicture.startsWith('http') ? staffMember.staff.profilePicture : `${import.meta.env.VITE_API_URL || ''}${staffMember.staff.profilePicture}`} 
                    alt={staffMember.staff.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{staffMember.staff.name}</h4>
                  <p className="text-sm text-gray-600">{staffMember.staff.position}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Working Hours: {staffMember.staff.workingHours}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Timeline Visualization */}
            <div className="p-4">
              {staffMember.appointments?.length > 0 ? (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <Timer className="h-4 w-4 mr-1" />
                    Appointment Schedule
                  </h5>
                  
                  <div className="relative">
                    {/* Timeline bar */}
                    <div className="absolute left-4 top-3 h-0.5 bg-gray-200 w-[calc(100%-2rem)] z-0"></div>
                    
                    {/* Appointments on timeline */}
                    <div className="space-y-3 relative z-10">
                      {staffMember.appointments.map((appointment) => (
                        <div 
                          key={appointment._id} 
                          className={`flex items-start p-3 rounded-lg border ${getStatusColor(appointment.status)}`}
                        >
                          <div className="flex-shrink-0 w-8 text-center mr-3">
                            <div className="text-xs font-medium">
                              {formatTime(appointment.startTime)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.duration}m
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium truncate">{appointment.customer}</p>
                              <span className="text-xs whitespace-nowrap ml-2">
                                {formatTime(appointment.endTime)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{appointment.service}</p>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50">
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No appointments scheduled</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalonAvailabilityDisplay;
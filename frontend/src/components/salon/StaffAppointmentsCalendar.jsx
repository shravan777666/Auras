import React, { useState, useEffect } from 'react';
import { salonService } from '../../services/salon';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle, XCircle, MapPin } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const StaffAppointmentsCalendar = ({ embedded = false, onRefresh }) => {
  const [staffAvailability, setStaffAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'all'

  // Color palette for different staff members
  const staffColors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-red-100 text-red-800 border-red-200',
    'bg-teal-100 text-teal-800 border-teal-200',
  ];

  useEffect(() => {
    fetchStaffAvailability();
  }, [currentDate]);

  // Refresh when onRefresh is called (e.g., after staff assignment)
  useEffect(() => {
    if (onRefresh) {
      fetchStaffAvailability();
    }
  }, [onRefresh]);

  const fetchStaffAvailability = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate);
      startDate.setDate(1); // First day of month
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of month

      const response = await salonService.getStaffAvailability({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      if (response?.success) {
        setStaffAvailability(response.data?.staffAppointments || []);
        if (!selectedStaff && response.data?.staffAppointments?.length > 0) {
          setSelectedStaff(response.data.staffAppointments[0].staff._id);
        }
      }
    } catch (error) {
      console.error('Error fetching staff availability:', error);
      setError('Failed to fetch staff availability');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentsForDay = (date, staffId = null) => {
    const appointments = [];
    
    if (staffId) {
      // Get appointments for specific staff
      const staffData = staffAvailability.find(sa => sa.staff._id === staffId);
      if (staffData) {
        appointments.push(...staffData.appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate.toDateString() === date.toDateString();
        }));
      }
    } else {
      // Get appointments for all staff
      staffAvailability.forEach(staffData => {
        const staffAppointments = staffData.appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate.toDateString() === date.toDateString();
        });
        appointments.push(...staffAppointments.map(apt => ({
          ...apt,
          staffName: staffData.staff.name,
          staffId: staffData.staff._id
        })));
      });
    }

    return appointments.sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStaffColor = (staffId, staffName) => {
    const staffIndex = staffAvailability.findIndex(sa => sa.staff._id === staffId);
    return staffColors[staffIndex % staffColors.length];
  };

  const formatAppointmentTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
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

  if (loading) {
    return <LoadingSpinner text="Loading staff appointments..." />;
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center text-red-600">
          <Calendar className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedStaffData = staffAvailability.find(sa => sa.staff._id === selectedStaff);

  const calendarContent = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Staff Appointments Calendar
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-lg font-medium min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-base font-medium min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {staffAvailability.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4" />
          <p>No staff appointments found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'individual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Individual View
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Staff View
              </button>
            </div>
          </div>

          {/* Staff Selector (Individual View) */}
          {viewMode === 'individual' && (
            <div className="flex flex-wrap gap-2">
              {staffAvailability.map((staffData) => (
                <button
                  key={staffData.staff._id}
                  onClick={() => setSelectedStaff(staffData.staff._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStaff === staffData.staff._id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {staffData.staff.name}
                </button>
              ))}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="border rounded-lg p-4">
            {viewMode === 'individual' && selectedStaffData && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedStaffData.staff.name}</h4>
                  <p className="text-sm text-gray-600">{selectedStaffData.staff.position}</p>
                </div>
              </div>
            )}

            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24"></div>;
                }

                const appointments = getAppointmentsForDay(day, viewMode === 'individual' ? selectedStaff : null);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`h-24 border rounded-lg p-2 text-xs ${
                      isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-700 mb-1">
                      {day.getDate()}
                    </div>
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {appointments.map((appointment, aptIndex) => (
                        <div
                          key={aptIndex}
                          className={`px-2 py-1 rounded text-xs border truncate ${
                            viewMode === 'all' 
                              ? getStaffColor(appointment.staffId, appointment.staffName)
                              : getStatusColor(appointment.status)
                          }`}
                          title={`${appointment.customer} - ${formatAppointmentTime(appointment.time)} - ${appointment.status}`}
                        >
                          <div className="font-medium truncate">
                            {viewMode === 'all' ? appointment.staffName : appointment.customer}
                          </div>
                          <div className="text-xs opacity-75">
                            {formatAppointmentTime(appointment.time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              {viewMode === 'all' ? (
                staffAvailability.map((staffData, index) => (
                  <div key={staffData.staff._id} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded border ${getStaffColor(staffData.staff._id, staffData.staff.name).replace('text-', 'bg-').replace('border-', 'border-')}`}></div>
                    <span>{staffData.staff.name}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                    <span>Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                    <span>In-Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                    <span>Completed</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return embedded ? calendarContent : (
    <div className="bg-white rounded-lg shadow-md p-6">
      {calendarContent}
    </div>
  );
};

export default StaffAppointmentsCalendar;

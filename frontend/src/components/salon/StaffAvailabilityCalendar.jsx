import React, { useState, useEffect } from 'react';
import { salonService } from '../../services/salon';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle, Plus } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDateToString, isSameDay } from '../../utils/dateUtils';

const StaffAvailabilityCalendar = ({ salonId }) => {
  const [staffAppointments, setStaffAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    fetchStaffAppointments();
  }, [currentDate]);

  const fetchStaffAppointments = async () => {
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
        console.log('📊 Staff Availability Response:', {
          success: response.success,
          staffCount: response.data?.staffAppointments?.length || 0,
          staffData: response.data?.staffAppointments?.map(staff => ({
            staffName: staff.staff.name,
            appointmentCount: staff.appointments.length,
            attendanceCount: staff.attendance?.length || 0,
            appointments: staff.appointments.map(apt => ({
              id: apt._id,
              customer: apt.customer,
              status: apt.status,
              date: apt.date,
              time: apt.time
            })),
            attendance: staff.attendance?.map(record => ({
              date: record.date,
              status: record.status
            })) || []
          }))
        });
        
        setStaffAppointments(response.data?.staffAppointments || []);
      }
    } catch (error) {
      console.error('Error fetching staff appointments:', error);
      setError('Failed to fetch staff appointments');
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

  const getAppointmentsForDate = (date, staffId) => {
    if (!staffId) return [];
    
    const staffData = staffAppointments.find(sa => sa.staff._id === staffId);
    if (!staffData) return [];
    
    return staffData.appointments.filter(apt => {
      return isSameDay(apt.date, date);
    });
  };

  // Function to get attendance status for a specific date and staff
  const getAttendanceForDate = (date, staffId) => {
    if (!staffId) return null;
    
    const staffData = staffAppointments.find(sa => sa.staff._id === staffId);
    if (!staffData || !staffData.attendance) return null;
    
    const dateStr = formatDateToString(date);
    return staffData.attendance.find(record => record.date === dateStr) || null;
  };

  // Function to check if a date is today
  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'staff_blocked':
        return 'bg-blue-200 text-blue-800 border-blue-300'; // Light blue for staff shifts
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  // Function to mark staff attendance for today
  const markAttendance = async (staffId, date) => {
    try {
      await salonService.markStaffAttendance(staffId, formatDateToString(date), {
        status: 'Present',
        checkInTime: new Date().toTimeString().slice(0, 5)
      });
      
      // Refresh the calendar to show updated attendance status
      fetchStaffAppointments();
      
      // Show success message
      alert(`Attendance marked for staff member on ${date.toDateString()}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  // Function to add a shift for a staff member
  const addShift = async (staffId, date) => {
    try {
      const response = await salonService.addStaffShift(staffId, formatDateToString(date), {
        startTime: '09:00',
        endTime: '17:00',
        notes: 'Regular shift'
      });

      if (response.success) {
        // Refresh the calendar to show updated shifts
        fetchStaffAppointments();
        
        alert(`Shift added for staff member on ${date.toDateString()}`);
      } else {
        throw new Error(response.message || 'Failed to add shift');
      }
    } catch (error) {
      console.error('Error adding shift:', error);
      alert(`Failed to add shift: ${error.message}`);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading staff availability..." />;
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Staff Availability Calendar
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

      {staffAppointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4" />
          <p>No staff appointments found for this month.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {staffAppointments.map((staffData) => (
            <div key={staffData.staff._id} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{staffData.staff.name}</h4>
                  <p className="text-sm text-gray-600">{staffData.staff.position}</p>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-12"></div>;
                  }

                  const appointments = getAppointmentsForDate(day, staffData.staff._id);
                  const attendance = getAttendanceForDate(day, staffData.staff._id);
                  const isCurrentDay = isToday(day);
                  const hasShift = appointments.length > 0;

                  // Determine cell styling based on attendance and appointments
                  let cellClass = 'bg-gray-50';
                  if (attendance && attendance.status === 'Absent') {
                    cellClass = 'bg-red-100 border-red-200'; // Red background for Absent
                  } else if (hasShift) {
                    // Light blue background for days with shifts
                    cellClass = 'bg-blue-50 border-blue-200';
                  } else if (isCurrentDay) {
                    cellClass = 'bg-indigo-50 border-indigo-200'; // Light blue for today
                  }

                  return (
                    <div
                      key={index}
                      className={`h-32 border rounded-lg p-1 text-xs relative ${cellClass}`}
                    >
                      <div className="font-medium text-gray-700 mb-1">
                        {day.getDate()}
                        {/* Show red mark only for Absent attendance */}
                        {attendance && attendance.status === 'Absent' && (
                          <span className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" title="Absent"></div>
                          </span>
                        )}
                        {/* Show blue mark only for Present attendance */}
                        {attendance && attendance.status === 'Present' && (
                          <span className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Present"></div>
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 overflow-y-auto max-h-20">
                        {appointments.slice(0, 3).map((apt, aptIndex) => (
                          <div
                            key={aptIndex}
                            className={`px-1 py-0.5 rounded text-xs border ${getStatusColor(apt.status)}`}
                            title={`${formatTime(apt.time)} - ${apt.customer || 'Shift'} (${apt.status})`}
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="h-2 w-2" />
                              {formatTime(apt.time)}
                            </div>
                          </div>
                        ))}
                        {appointments.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{appointments.length - 3} more
                          </div>
                        )}
                      </div>
                      
                      {/* Show attendance status if present */}
                      {attendance && attendance.status !== 'Present' && (
                        <div className="absolute top-1 left-1">
                          <span className="text-xs font-medium px-1 py-0.5 rounded bg-red-500 text-white">
                            {attendance.status}
                          </span>
                        </div>
                      )}
                      
                      {/* Attendance/Shift Actions */}
                      <div className="absolute bottom-1 right-1 flex gap-1">
                        {hasShift ? (
                          <button
                            onClick={() => markAttendance(staffData.staff._id, day)}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            title="Mark Present"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => addShift(staffData.staff._id, day)}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            title="Add Shift"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
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
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Absent</span>
                </div>
              </div>
              
              {/* Today's Action Guide */}
              <div className="mt-3 text-xs text-gray-500">
                <p className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Present staff / Today's date
                </p>
                <p className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Absent staff
                </p>
                <p className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Mark Present for scheduled staff
                </p>
                <p className="flex items-center gap-1">
                  <Plus className="h-3 w-3 text-blue-500" />
                  Add Shift for unscheduled staff
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffAvailabilityCalendar;
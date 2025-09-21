import React, { useState, useEffect } from 'react';
import { salonService } from '../../services/salon';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const AvailabilityCalendar = ({ embedded = false }) => {
  const [staffAvailability, setStaffAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    fetchStaffAvailability();
  }, [currentDate]);

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

  const getTimeSlotsForDay = (date, staffId) => {
    const staffData = staffAvailability.find(sa => sa.staff._id === staffId);
    if (!staffData || !staffData.staff.availability) return [];

    const availability = staffData.staff.availability;
    const workingDays = availability.workingDays || [];
    const workingHours = availability.workingHours || {};
    const breakTime = availability.breakTime || {};

    // Check if this day is a working day
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (!workingDays.includes(dayName)) {
      return []; // Not a working day
    }

    const startTime = workingHours.startTime;
    const endTime = workingHours.endTime;
    const breakStart = breakTime.startTime;
    const breakEnd = breakTime.endTime;

    if (!startTime || !endTime) return [];

    // Generate time slots (30-minute intervals)
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

      // Check if this slot is during break time
      let isBreak = false;
      if (breakStart && breakEnd) {
        const [breakStartHour, breakStartMin] = breakStart.split(':').map(Number);
        const [breakEndHour, breakEndMin] = breakEnd.split(':').map(Number);

        const slotTime = currentHour * 60 + currentMin;
        const breakStartTime = breakStartHour * 60 + breakStartMin;
        const breakEndTime = breakEndHour * 60 + breakEndMin;

        if (slotTime >= breakStartTime && slotTime < breakEndTime) {
          isBreak = true;
        }
      }

      slots.push({
        time: timeString,
        status: isBreak ? 'break' : 'free'
      });

      // Move to next 30-minute slot
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    // Mark busy slots based on appointments
    const appointments = staffData.appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString() &&
             (apt.status === 'Approved' || apt.status === 'In-Progress');
    });

    appointments.forEach(apt => {
      const aptTime = apt.time;
      const duration = apt.duration || 30; // Default 30 minutes if not specified

      // Find the slot that matches the appointment time
      const slotIndex = slots.findIndex(slot => slot.time === aptTime);
      if (slotIndex !== -1) {
        // Mark this slot and subsequent slots based on duration
        const slotsToMark = Math.ceil(duration / 30); // Number of 30-min slots
        for (let i = 0; i < slotsToMark && slotIndex + i < slots.length; i++) {
          slots[slotIndex + i].status = 'busy';
          slots[slotIndex + i].appointment = apt;
        }
      }
    });

    return slots;
  };

  const getSlotStatusColor = (status) => {
    switch (status) {
      case 'busy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'free':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSlotStatusIcon = (status) => {
    switch (status) {
      case 'busy':
        return <XCircle className="h-3 w-3" />;
      case 'break':
        return <Clock className="h-3 w-3" />;
      case 'free':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return null;
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

  const selectedStaffData = staffAvailability.find(sa => sa.staff._id === selectedStaff);
  const selectedDaySlots = selectedStaff ? getTimeSlotsForDay(new Date(), selectedStaff) : [];

  const calendarContent = (
    <>
      {!embedded && (
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
          <p>No staff availability data found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Staff Selector */}
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

          {selectedStaffData && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedStaffData.staff.name}</h4>
                  <p className="text-sm text-gray-600">{selectedStaffData.staff.position}</p>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
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

                  const daySlots = getTimeSlotsForDay(day, selectedStaff);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const totalSlots = daySlots.length;
                  const busySlots = daySlots.filter(slot => slot.status === 'busy').length;
                  const freeSlots = daySlots.filter(slot => slot.status === 'free').length;

                  return (
                    <div
                      key={index}
                      className={`h-12 border rounded-lg p-1 text-xs ${
                        isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-700 mb-1">
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600">F: {freeSlots}</span>
                          <span className="text-red-600">B: {busySlots}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Today's Time Slots Detail */}
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  Today's Availability ({new Date().toLocaleDateString()})
                </h5>
                {selectedDaySlots.length === 0 ? (
                  <p className="text-sm text-gray-500">Not a working day or no availability set.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedDaySlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getSlotStatusColor(slot.status)}`}
                        title={slot.appointment ? `${slot.appointment.customer} - ${slot.appointment.services.join(', ')}` : ''}
                      >
                        {getSlotStatusIcon(slot.status)}
                        {slot.time}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Busy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>Break</span>
                </div>
              </div>
            </div>
          )}
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

export default AvailabilityCalendar;
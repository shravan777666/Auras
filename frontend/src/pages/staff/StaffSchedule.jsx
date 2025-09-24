import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// ✅ Use "index.css" instead of "main.css"
import "../../styles/fullcalendar.css";
import { staffService } from "../../services/staff";

const StaffSchedule = () => {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const pollingRef = useRef(null);
  const viewRangeRef = useRef({ start: null, end: null });

  const fetchRangeAsEvents = async (rangeStart, rangeEnd) => {
    try {
      if (!rangeStart || !rangeEnd) return;
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);

      // Format dates for API request
      const startDate = start.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDate = end.toISOString().split('T')[0]; // YYYY-MM-DD

      // Fetch all appointments for the date range in a single request
      console.log('🔍 Fetching appointments for date range:', { startDate, endDate });
      const response = await staffService.getAppointments({
        startDate,
        endDate,
        limit: 1000 // Higher limit for calendar views
      });

      const items = response?.data?.data || [];
      console.log('📅 Received appointments:', items.length, items.map(apt => ({
        id: apt._id,
        customer: apt.customerId?.name,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status
      })));

      const parseStartFromDateAndTime = (dateObj, timeStr) => {
        const base = new Date(dateObj);
        if (!timeStr) {
          base.setHours(9, 0, 0, 0);
          return base;
        }
        const trimmed = String(timeStr).trim();
        // Handle formats: HH:mm, HH:mm:ss, H:mm, 12-hour with AM/PM
        const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
        if (ampmMatch) {
          let hours = parseInt(ampmMatch[1], 10);
          const minutes = parseInt(ampmMatch[2], 10) || 0;
          const seconds = parseInt(ampmMatch[3], 10) || 0;
          const meridiem = ampmMatch[4].toUpperCase();
          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          base.setHours(hours, minutes, seconds, 0);
          return base;
        }
        const parts = trimmed.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        if (!Number.isNaN(h)) {
          base.setHours(h, m, s, 0);
          return base;
        }
        // Fallback
        base.setHours(9, 0, 0, 0);
        return base;
      };

      const mapped = items
        .map((apt) => {
          const datePart = apt.appointmentDate ? new Date(apt.appointmentDate) : null;
          if (!datePart) return null;
          const startDate = parseStartFromDateAndTime(datePart, apt.appointmentTime);

          // Compute end if estimatedDuration available
          let endDate = undefined;
          const durationMin = apt.estimatedDuration || apt.services?.[0]?.duration;
          if (durationMin && Number(durationMin) > 0) {
            endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + Number(durationMin));
          }

          const customerName = apt.customerId?.name || "Client";
          const serviceName = apt.services?.[0]?.serviceId?.name || "Service";
          const title = `${customerName} - ${serviceName}`;

          return {
            id: String(apt._id || Math.random()),
            title,
            start: startDate,
            end: endDate,
            extendedProps: {
              customerName,
              serviceName,
              customerEmail: apt.customerId?.email || "",
              customerPhone: apt.customerId?.phone || "",
              services: apt.services || [],
              notes: apt.customerNotes || "",
              specialRequests: apt.specialRequests || "",
              status: apt.status || "Pending",
              totalAmount: apt.totalAmount || 0,
              raw: apt,
            },
          };
        })
        .filter(Boolean);

      setEvents(mapped);
    } catch (e) {
      // silently ignore for now to avoid disrupting schedule view
      console.error("Failed to fetch upcoming appointments for schedule:", e);
    }
  };

  const calendarOptions = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      },
      height: "auto",
      editable: false,
      selectable: true,
      dayMaxEventRows: true,
      events,
      datesSet: (arg) => {
        // refetch on view change (month/week/day navigation)
        viewRangeRef.current = { start: arg.start, end: arg.end };
        fetchRangeAsEvents(arg.start, arg.end);
      },
      eventClick: (info) => {
        setSelectedEvent({
          title: info.event.title,
          ...info.event.extendedProps,
          start: info.event.start,
        });
      },
    }),
    []
  );

  useEffect(() => {
    // Initialize with current month range
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    viewRangeRef.current = { start, end };
    fetchRangeAsEvents(start, end);

    // Set up polling for near-real-time updates without page refresh
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(() => {
      const { start, end } = viewRangeRef.current || {};
      if (start && end) {
        fetchRangeAsEvents(start, end);
      }
    }, 10000); // 10s polling

    // Also refresh when window regains focus
    const onFocus = () => {
      const { start, end } = viewRangeRef.current || {};
      if (start && end) {
        fetchRangeAsEvents(start, end);
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">My Schedule</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <FullCalendar ref={calendarRef} {...calendarOptions} />
        </div>
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Client Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{selectedEvent.customerName}</p>
                    </div>
                    {selectedEvent.customerEmail && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900">{selectedEvent.customerEmail}</p>
                      </div>
                    )}
                    {selectedEvent.customerPhone && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <p className="text-gray-900">{selectedEvent.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Appointment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                      <p className="text-gray-900">{new Date(selectedEvent.start).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEvent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedEvent.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        selectedEvent.status === 'In-Progress' ? 'bg-blue-100 text-blue-800' :
                        selectedEvent.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                    {selectedEvent.totalAmount > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                        <p className="text-gray-900">${selectedEvent.totalAmount}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                {selectedEvent.services && selectedEvent.services.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Booked Services
                    </h3>
                    <div className="space-y-2">
                      {selectedEvent.services.map((service, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {service.serviceId?.name || service.serviceName || 'Service'}
                              </p>
                              {service.duration && (
                                <p className="text-sm text-gray-600">Duration: {service.duration} minutes</p>
                              )}
                            </div>
                            {service.price && (
                              <p className="text-sm font-medium text-gray-900">${service.price}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(selectedEvent.notes || selectedEvent.specialRequests) && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Notes & Special Requests
                    </h3>
                    <div className="space-y-2">
                      {selectedEvent.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Customer Notes:</span>
                          <p className="text-gray-900 mt-1">{selectedEvent.notes}</p>
                        </div>
                      )}
                      {selectedEvent.specialRequests && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Special Requests:</span>
                          <p className="text-gray-900 mt-1">{selectedEvent.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffSchedule;

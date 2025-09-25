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

  // const fetchRangeAsEvents = async (rangeStart, rangeEnd) => {
  //   try {
  //     if (!rangeStart || !rangeEnd) {
  //       console.log('❌ Invalid date range:', { rangeStart, rangeEnd });
  //       return;
  //     }
      
  //     const start = new Date(rangeStart);
  //     const end = new Date(rangeEnd);

  //     // Format dates for API request
  //     const startDate = start.toISOString().split('T')[0]; // YYYY-MM-DD
  //     const endDate = end.toISOString().split('T')[0]; // YYYY-MM-DD

  //     console.log('🔍 Fetching appointments for date range:', { 
  //       startDate, 
  //       endDate,
  //       rangeStart: rangeStart.toISOString(),
  //       rangeEnd: rangeEnd.toISOString()
  //     });

  //     // Check if user is authenticated
  //     const token = localStorage.getItem('auracare_token');
  //     if (!token) {
  //       console.error('❌ No authentication token found');
  //       return;
  //     }

  //     // Fetch all appointments for the date range
  //     const response = await staffService.getAppointments({
  //       startDate,
  //       endDate,
  //       limit: 1000
  //     });

  //     console.log('📡 API Response:', {
  //       status: response?.status,
  //       success: response?.success,
  //       dataLength: response?.data?.data?.length,
  //       totalItems: response?.data?.totalItems,
  //       fullResponse: response
  //     });

  //     const items = response?.data?.data || [];
  //     console.log('📅 Raw appointments from API:', items);

  //     // If no appointments found, log additional debugging info
  //     if (items.length === 0) {
  //       console.log('🔍 No appointments found. Debugging info:');
  //       console.log('- API URL:', '/staff/appointments');
  //       console.log('- Request params:', { startDate, endDate, limit: 1000 });
  //       console.log('- Response structure:', response);
  //       console.log('- User token present:', !!token);
  //     }

  //     // SIMPLIFIED DATE PARSING - This is the fix!
  //     const mapped = items
  //       .map((apt) => {
  //         try {
  //           console.log('Processing appointment:', apt._id, {
  //             appointmentDate: apt.appointmentDate,
  //             appointmentTime: apt.appointmentTime,
  //             customer: apt.customerId?.name
  //           });

  //           // Check if we have the required date field
  //           if (!apt.appointmentDate) {
  //             console.warn('⚠️ Appointment missing date:', apt._id);
  //             return null;
  //           }

  //           // Parse the date directly from the API response
  //           let startDate = new Date(apt.appointmentDate);
            
  //           // If the date is invalid, try alternative parsing
  //           if (isNaN(startDate.getTime())) {
  //             console.warn('⚠️ Invalid date format, trying alternative parsing:', apt.appointmentDate);
  //             // Try parsing as ISO string or other formats
  //             startDate = new Date(apt.appointmentDate.replace(' ', 'T'));
  //           }

  //           // If still invalid, skip this appointment
  //           if (isNaN(startDate.getTime())) {
  //             console.warn('❌ Could not parse date for appointment:', apt._id, apt.appointmentDate);
  //             return null;
  //           }

  //           // Handle time if available
  //           if (apt.appointmentTime) {
  //             const timeParts = apt.appointmentTime.split(':');
  //             if (timeParts.length >= 2) {
  //               const hours = parseInt(timeParts[0], 10);
  //               const minutes = parseInt(timeParts[1], 10) || 0;
                
  //               if (!isNaN(hours)) {
  //                 startDate.setHours(hours, minutes, 0, 0);
  //               }
  //             }
  //           } else {
  //             // Default to 9 AM if no time specified
  //             startDate.setHours(9, 0, 0, 0);
  //           }

  //           // Calculate end time based on duration
  //           let endDate = new Date(startDate);
  //           const durationMin = apt.estimatedDuration || apt.services?.[0]?.duration || 60; // Default 60 minutes
  //           endDate.setMinutes(endDate.getMinutes() + parseInt(durationMin));

  //           const customerName = apt.customerId?.name || "Client";
  //           const serviceName = apt.services?.[0]?.serviceId?.name || "Service";
  //           const title = `${customerName} - ${serviceName}`;

  //           const event = {
  //             id: String(apt._id || Math.random()),
  //             title,
  //             start: startDate,
  //             end: endDate,
  //             extendedProps: {
  //               customerName,
  //               serviceName,
  //               customerEmail: apt.customerId?.email || "",
  //               customerPhone: apt.customerId?.phone || "",
  //               services: apt.services || [],
  //               notes: apt.customerNotes || "",
  //               specialRequests: apt.specialRequests || "",
  //               status: apt.status || "Pending",
  //               totalAmount: apt.totalAmount || 0,
  //               raw: apt,
  //             },
  //           };

  //           console.log('✅ Created event:', {
  //             id: event.id,
  //             title: event.title,
  //             start: event.start.toString(),
  //             end: event.end.toString()
  //           });

  //           return event;
  //         } catch (error) {
  //           console.error('❌ Error processing appointment:', apt._id, error);
  //           return null;
  //         }
  //       })
  //       .filter(Boolean);

  //     console.log('📅 Final mapped events for calendar:', mapped.length, mapped);

  //     setEvents(mapped);
  //   } catch (e) {
  //     console.error("❌ Failed to fetch appointments:", e);
  //     console.error("Error details:", {
  //       message: e.message,
  //       response: e.response?.data,
  //       status: e.response?.status
  //     });
      
  //     // Show user-friendly error message
  //     if (e.response?.status === 403) {
  //       console.error('Access denied - staff may not be approved');
  //     } else if (e.response?.status === 404) {
  //       console.error('Staff profile not found');
  //     } else if (e.response?.status === 401) {
  //       console.error('Authentication failed');
  //     }
  //   }
  // };

  const fetchRangeAsEvents = async (rangeStart, rangeEnd) => {
  try {
    if (!rangeStart || !rangeEnd) {
      console.log('❌ Invalid date range:', { rangeStart, rangeEnd });
      return;
    }
    
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);

    // Format dates for API request
    const startDate = start.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDate = end.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('🔍 Fetching appointments for date range:', { 
      startDate, 
      endDate,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString()
    });

    // Check if user is authenticated
    const token = localStorage.getItem('auracare_token');
    if (!token) {
      console.error('❌ No authentication token found');
      return;
    }

    // Fetch all appointments for the date range
    const response = await staffService.getAppointments({
      startDate,
      endDate,
      limit: 1000
    });

    console.log('📡 FULL API Response:', response);

    // ✅ FIXED: Use the correct response structure based on UpcomingAppointmentsCard
    let items = [];
    
    if (response?.success) {
      // Correct structure: appointments are in response.data
      items = response.data || [];
      console.log('✅ Found appointments in response.data');
    } else {
      // Fallback: try different structures
      items = response?.data?.data || response?.data || [];
      console.log('⚠️ Using fallback structure');
    }

    console.log('📅 Raw appointments from API:', items);
    console.log('📅 Number of appointments found:', items.length);

    // If no appointments found, log additional debugging info
    if (items.length === 0) {
      console.log('🔍 No appointments found. Debugging info:');
      console.log('- API URL:', '/staff/appointments');
      console.log('- Request params:', { startDate, endDate, limit: 1000 });
      console.log('- Full response:', response);
      console.log('- Response success:', response?.success);
      console.log('- User token present:', !!token);
    }

    // Process appointments
    const mapped = items
      .map((apt, index) => {
        try {
          console.log(`Processing appointment ${index + 1}:`, {
            id: apt._id,
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            customer: apt.customerId?.name,
            status: apt.status
          });

          // Check if we have the required date field
          if (!apt.appointmentDate) {
            console.warn('⚠️ Appointment missing date:', apt._id);
            return null;
          }

          // Parse the date directly from the API response
          let startDate = new Date(apt.appointmentDate);
          
          // If the date is invalid, try alternative parsing
          if (isNaN(startDate.getTime())) {
            console.warn('⚠️ Invalid date format, trying alternative parsing:', apt.appointmentDate);
            startDate = new Date(apt.appointmentDate.replace(' ', 'T'));
          }

          // If still invalid, skip this appointment
          if (isNaN(startDate.getTime())) {
            console.warn('❌ Could not parse date for appointment:', apt._id, apt.appointmentDate);
            return null;
          }

          // Handle time if available
          if (apt.appointmentTime) {
            const timeParts = apt.appointmentTime.split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0], 10);
              const minutes = parseInt(timeParts[1], 10) || 0;
              
              if (!isNaN(hours)) {
                startDate.setHours(hours, minutes, 0, 0);
              }
            }
          } else {
            // Default to 9 AM if no time specified
            startDate.setHours(9, 0, 0, 0);
          }

          // Calculate end time based on duration
          let endDate = new Date(startDate);
          const durationMin = apt.estimatedDuration || apt.services?.[0]?.duration || 60;
          endDate.setMinutes(endDate.getMinutes() + parseInt(durationMin));

          const customerName = apt.customerId?.name || "Client";
          const serviceName = apt.services?.[0]?.serviceId?.name || "Service";
          const title = `${customerName} - ${serviceName}`;

          const event = {
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

          console.log('✅ Created event:', event.title, event.start);

          return event;
        } catch (error) {
          console.error('❌ Error processing appointment:', apt._id, error);
          return null;
        }
      })
      .filter(Boolean);

    console.log('📅 Final mapped events for calendar:', mapped.length);

    setEvents(mapped);
  } catch (e) {
    console.error("❌ Failed to fetch appointments:", e);
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
      events: events, // ✅ Fixed: Now properly using events state
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
    [events] // ✅ Fixed: Added events dependency
  );

  useEffect(() => {
  //   const initializeCalendar = async () => {
  //     try {
  //       // Fetch upcoming appointments to find the earliest one
  //       const response = await staffService.getUpcomingAppointments({
  //         limit: 1000, // A large limit to get all upcoming appointments
  //       });
        
  //       const appointments = response?.data?.data || [];
  //       let initialDate = new Date(); // Default to the current date

  //       if (appointments.length > 0) {
  //         // Sort appointments to find the earliest one
  //         appointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  //         const earliestAppointment = appointments[0];
  //         const earliestDate = new Date(earliestAppointment.appointmentDate);

  //         // Set the initial date for the calendar to the month of the earliest appointment
  //         initialDate = earliestDate;
  //       }

  //       // Use the FullCalendar API to go to the target date
  //       if (calendarRef.current) {
  //         const calendarApi = calendarRef.current.getApi();
  //         calendarApi.gotoDate(initialDate);
  //       }
        
  //       // Manually trigger the first fetch for the correct date range
  //       const start = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  //       const end = new Date(initialDate.getFullYear(), initialDate.getMonth() + 1, 0);
  //       fetchRangeAsEvents(start, end);
  //       viewRangeRef.current = { start, end };

  //     } catch (error) {
  //       console.error("❌ Error initializing calendar, falling back to current month:", error);
  //       // Fallback to current month if fetching appointments fails
  //       const now = new Date();
  //       const start = new Date(now.getFullYear(), now.getMonth(), 1);
  //       const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  //       fetchRangeAsEvents(start, end);
  //       viewRangeRef.current = { start, end };
  //     }
  //   };

  //   initializeCalendar();

  //   // Set up polling for near-real-time updates
  //   const pollInterval = setInterval(() => {
  //     const { start, end } = viewRangeRef.current || {};
  //     if (start && end) {
  //       fetchRangeAsEvents(start, end);
  //     }
  //   }, 10000); // 10s polling

  //   // Refresh when window regains focus
  //   const onFocus = () => {
  //     const { start, end } = viewRangeRef.current || {};
  //     if (start && end) {
  //       fetchRangeAsEvents(start, end);
  //     }
  //   };
  //   window.addEventListener('focus', onFocus);

  //   // Cleanup on unmount
  //   return () => {
  //     clearInterval(pollInterval);
  //     window.removeEventListener('focus', onFocus);
  //   };
  // }, []); // Empty dependency array ensures this runs only once on mount



  useEffect(() => {
  const initializeCalendar = async () => {
    try {
      // Fetch upcoming appointments to find the earliest one
      const response = await staffService.getUpcomingAppointments({
        limit: 1000,
      });
      
      let appointments = [];
      
      // ✅ FIXED: Use correct response structure
      if (response?.success) {
        appointments = response.data || [];
      } else {
        appointments = response?.data?.data || [];
      }
      
      let initialDate = new Date(); // Default to the current date

      if (appointments.length > 0) {
        // Sort appointments to find the earliest one
        appointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
        const earliestAppointment = appointments[0];
        const earliestDate = new Date(earliestAppointment.appointmentDate);

        // Set the initial date for the calendar to the month of the earliest appointment
        initialDate = earliestDate;
      }

      // Use the FullCalendar API to go to the target date
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(initialDate);
      }
      
      // Manually trigger the first fetch for the correct date range
      const start = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
      const end = new Date(initialDate.getFullYear(), initialDate.getMonth() + 1, 0);
      fetchRangeAsEvents(start, end);
      viewRangeRef.current = { start, end };

    } catch (error) {
      console.error("❌ Error initializing calendar, falling back to current month:", error);
      // Fallback to current month if fetching appointments fails
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      fetchRangeAsEvents(start, end);
      viewRangeRef.current = { start, end };
    }
  };

  initializeCalendar();

  // Set up polling for near-real-time updates
  const pollInterval = setInterval(() => {
    const { start, end } = viewRangeRef.current || {};
    if (start && end) {
      fetchRangeAsEvents(start, end);
    }
  }, 10000); // 10s polling

  // Refresh when window regains focus
  const onFocus = () => {
    const { start, end } = viewRangeRef.current || {};
    if (start && end) {
      fetchRangeAsEvents(start, end);
    }
  };
  window.addEventListener('focus', onFocus);

  // Cleanup on unmount
  return () => {
    clearInterval(pollInterval);
    window.removeEventListener('focus', onFocus);
  };
}, []); // Empty dependency array ensures this runs only once on mount

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
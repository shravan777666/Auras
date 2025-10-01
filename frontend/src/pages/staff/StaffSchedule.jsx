import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/fullcalendar.css";
import { staffService } from "../../services/staff";
import { parseAppointmentDate } from "../../utils/dateUtils";

const StaffSchedule = () => {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [lastUpdated, setLastUpdated] = useState(null);
  const viewRangeRef = useRef({ start: null, end: null });

  // ✅ FIXED: Improved fetch function with better error handling
  const fetchRangeAsEvents = async (rangeStart, rangeEnd) => {
    try {
      console.log('🚀 fetchRangeAsEvents called with:', {
        rangeStart: rangeStart?.toISOString(),
        rangeEnd: rangeEnd?.toISOString()
      });

      if (!rangeStart || !rangeEnd) {
        console.log('❌ Invalid date range:', { rangeStart, rangeEnd });
        return;
      }
      
      setLoading(true);
      setError(null);

      // Check authentication
      const token = localStorage.getItem('auracare_token');
      const user = localStorage.getItem('auracare_user');
      
      console.log('🔐 Authentication check:', {
        hasToken: !!token,
        hasUser: !!user,
        userType: user ? JSON.parse(user)?.role : 'none',
        tokenValue: token ? token.substring(0, 20) + '...' : 'none',
        userValue: user ? user.substring(0, 50) + '...' : 'none'
      });
      
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        setError('Please login to view your schedule.');
        setLoading(false);
        return;
      }
      
      // If we have a token but no user data, try to fetch user info from the token
      if (!user) {
        console.log('⚠️ Token exists but no user data, continuing with token-only authentication');
        // Don't return here - continue with the API call using just the token
      }

      // First, test if backend is reachable
      console.log('🔍 Testing backend connectivity...');
      const connectionTest = await staffService.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Backend server is not reachable: ${connectionTest.error}`);
      }
      
      console.log('✅ Backend connection successful');
      
      // If no user data, try to get current user info
      if (!user) {
        try {
          console.log('🔍 Fetching current user info...');
          const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('✅ User info retrieved:', {
              role: userData.data?.role,
              id: userData.data?._id,
              name: userData.data?.name
            });
          } else {
            console.log('⚠️ Could not fetch user info, status:', userResponse.status);
          }
        } catch (err) {
          console.log('⚠️ Error fetching user info:', err.message);
        }
      }
      
      // Format dates for API
      const startDate = rangeStart.toISOString().split('T')[0];
      const endDate = rangeEnd.toISOString().split('T')[0];

      console.log('🔍 Fetching appointments for date range:', { 
        startDate, 
        endDate,
        rangeStart: rangeStart.toISOString(),
        rangeEnd: rangeEnd.toISOString()
      });

      // Fetch appointments - use salon scope to show all appointments in staff's salon
      console.log('📡 About to call staffService.getAppointments with params:', {
        startDate,
        endDate,
        limit: 100,
        scope: 'salon'
      });

      const response = await staffService.getAppointments({
        startDate,
        endDate,
        limit: 100,
        scope: 'salon' // Show all approved appointments in the staff's salon
      });

      console.log('📊 Appointments API Response received:', response);
      console.log('📊 Response structure:', {
        hasSuccess: 'success' in response,
        successValue: response?.success,
        hasData: 'data' in response,
        dataType: typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response?.data.length : 'not array',
        isArray: Array.isArray(response)
      });

      // Handle different response structures
      let items = [];
      if (response?.success) {
        items = response.data || [];
        console.log('✅ Using response.data structure, items:', items.length);
      } else if (Array.isArray(response)) {
        items = response;
        console.log('✅ Using array response structure, items:', items.length);
      } else if (response?.data) {
        items = response.data || [];
        console.log('✅ Using response.data (non-success structure), items:', items.length);
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        items = [];
      }

      console.log('📅 Number of raw appointments found:', items.length);
      console.log('📅 Sample appointments:', items.slice(0, 2).map(apt => ({
        id: apt._id,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        customer: apt.customerId?.name,
        service: apt.services?.[0]?.serviceId?.name || apt.services?.[0]?.serviceName
      })));

      // Process appointments into calendar events
      const mappedEvents = items
        .map((appointment, index) => {
          try {
            console.log(`📅 Processing appointment ${index + 1}/${items.length}:`, {
              id: appointment._id,
              date: appointment.appointmentDate,
              time: appointment.appointmentTime,
              customer: appointment.customerId?.name
            });

            if (!appointment.appointmentDate) {
              console.warn(`⚠️ Appointment ${index} missing date:`, appointment._id);
              return null;
            }

            // Parse appointment date using utility function to avoid timezone issues
            let eventStart = parseAppointmentDate(appointment.appointmentDate);
            console.log(`📅 Parsed date for appointment ${appointment._id}:`, eventStart);
            
            if (!eventStart || isNaN(eventStart.getTime())) {
              console.warn(`⚠️ Invalid date for appointment ${appointment._id}:`, appointment.appointmentDate);
              return null;
            }
            
            // If no time is included in the date string, set time from appointmentTime field
            if (appointment.appointmentTime && !appointment.appointmentDate.includes('T')) {
              const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
              if (!isNaN(hours)) {
                eventStart.setHours(hours, minutes || 0, 0, 0);
              }
            }

            // Calculate end time
            const eventEnd = new Date(eventStart);
            const duration = appointment.estimatedDuration || 
                           appointment.services?.[0]?.duration || 
                           60; // Default 60 minutes
            eventEnd.setMinutes(eventEnd.getMinutes() + parseInt(duration));

            const customerName = appointment.customerId?.name || "Customer";
            const serviceName = appointment.services?.[0]?.serviceId?.name || "Service";

            const event = {
              id: appointment._id || `event-${index}-${Date.now()}`,
              title: `${customerName} - ${serviceName}`,
              start: eventStart,
              end: eventEnd,
              extendedProps: {
                customerName,
                serviceName,
                customerEmail: appointment.customerId?.email || "",
                customerPhone: appointment.customerId?.phone || "",
                services: appointment.services || [],
                notes: appointment.customerNotes || "",
                specialRequests: appointment.specialRequests || "",
                status: appointment.status || "Pending",
                totalAmount: appointment.totalAmount || 0,
                raw: appointment,
              },
            };

            return event;
          } catch (error) {
            console.error(`❌ Error processing appointment ${index}:`, error);
            return null;
          }
        })
        .filter(Boolean);

      console.log('✅ Successfully mapped events:', mappedEvents.length);
      console.log('📅 Final events for calendar:', mappedEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        startISO: event.start?.toISOString(),
        endISO: event.end?.toISOString()
      })));
      
      setEvents(mappedEvents);
      setConnectionStatus('connected');
      setLastUpdated(new Date());

    } catch (error) {
      console.error("❌ Failed to fetch appointments:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Specific error handling
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please check if the backend server is running on port 5001.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Server is taking too long to respond.');
      } else if (error.message.includes('Network Error')) {
        setError('Network error. Please check your connection and ensure the backend server is running.');
      } else {
        setError(`Failed to load appointments: ${error.message}`);
      }
      
      setEvents([]);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Calendar configuration
  const calendarOptions = useMemo(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: currentView,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    height: "auto",
    editable: false,
    selectable: true,
    dayMaxEventRows: true,
    events: events,
    loading: loading,
    
    // Handle view changes - update the range and fetch data
    datesSet: (arg) => {
      console.log('📅 Calendar view changed:', {
        type: arg.view.type,
        start: arg.start,
        end: arg.end
      });
      console.log('📅 About to call fetchRangeAsEvents...');
      viewRangeRef.current = { start: arg.start, end: arg.end };
      setCurrentView(arg.view.type);
      // Auto-fetch appointments for the new date range
      fetchRangeAsEvents(arg.start, arg.end);
      console.log('📅 fetchRangeAsEvents call completed');
    },
    
    // Handle event clicks
    eventClick: (info) => {
      setSelectedEvent({
        title: info.event.title,
        ...info.event.extendedProps,
        start: info.event.start,
        end: info.event.end,
      });
    },
    
    // Event styling based on status
    eventContent: (arg) => {
      const status = arg.event.extendedProps.status;
      const statusColors = {
        'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Confirmed': 'bg-green-100 text-green-800 border-green-200',
        'In-Progress': 'bg-blue-100 text-blue-800 border-blue-200',
        'Completed': 'bg-gray-100 text-gray-800 border-gray-200',
        'Cancelled': 'bg-red-100 text-red-800 border-red-200'
      };
      
      const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
      
      return {
        html: `
          <div class="fc-event-main-frame">
            <div class="fc-event-title-container">
              <div class="fc-event-title fc-sticky ${colorClass} px-2 py-1 rounded border text-sm">
                ${arg.event.title}
                ${status ? `<span class="text-xs ml-1">(${status})</span>` : ''}
              </div>
            </div>
          </div>
        `
      };
    }
  }), [events, loading, currentView]);

  // Initialize calendar
  useEffect(() => {
    let isMounted = true;

    const initializeCalendar = async () => {
      if (!isMounted) return;

      try {
        console.log('🚀 Initializing staff schedule calendar...');
        
        // Set initial date range to current month
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Set calendar to current date
        if (calendarRef.current) {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.gotoDate(now);
        }
        
        // Fetch initial data
        await fetchRangeAsEvents(start, end);
        viewRangeRef.current = { start, end };

      } catch (error) {
        console.error("❌ Error initializing calendar:", error);
      }
    };

    initializeCalendar();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, []); // Remove error dependency and polling logic

  // Retry function
  const retryFetch = () => {
    if (viewRangeRef.current?.start && viewRangeRef.current?.end) {
      fetchRangeAsEvents(viewRangeRef.current.start, viewRangeRef.current.end);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  // Demo data for testing
  const loadDemoData = () => {
    const demoEvents = [
      {
        id: 'demo-1',
        title: 'John Doe - Haircut',
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 10, 0),
        end: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 11, 0),
        extendedProps: {
          customerName: 'John Doe',
          serviceName: 'Haircut',
          customerEmail: 'john@example.com',
          customerPhone: '+1234567890',
          services: [{ serviceId: { name: 'Haircut' }, duration: 60, price: 30 }],
          status: 'Approved',
          totalAmount: 30,
          notes: 'Regular haircut',
        }
      },
      {
        id: 'demo-2',
        title: 'Jane Smith - Coloring',
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 16, 14, 0),
        end: new Date(new Date().getFullYear(), new Date().getMonth(), 16, 16, 0),
        extendedProps: {
          customerName: 'Jane Smith',
          serviceName: 'Coloring',
          customerEmail: 'jane@example.com',
          customerPhone: '+0987654321',
          services: [{ serviceId: { name: 'Coloring' }, duration: 120, price: 80 }],
          status: 'Approved',
          totalAmount: 80,
          specialRequests: 'Use organic color',
        }
      }
    ];
    
    setEvents(demoEvents);
    setError(null);
    setConnectionStatus('connected');
    setLastUpdated(new Date());
    console.log('📊 Demo data loaded (manual refresh mode)');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-gray-600">View approved appointments in your salon</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">Approved appointments in your salon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-gray-600">Click "Refresh" after changing calendar views</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Loading appointments...</span>
              </div>
            )}
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-gray-500">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Connection Error'}
                </span>
                {lastUpdated && connectionStatus === 'connected' && (
                  <span className="text-gray-400">
                    • Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Manual refresh only
              </div>
              <div className="flex gap-2">
                <button
                  onClick={retryFetch}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="text-red-800 font-medium block">Unable to load schedule</span>
                  <span className="text-red-700 text-sm block mt-1">{error}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    console.log('🔍 Testing API connection...');
                    try {
                      const test = await staffService.testConnection();
                      console.log('Connection test result:', test);
                      if (test.success) {
                        alert('✅ Backend is reachable!');
                      } else {
                        alert(`❌ Backend connection failed: ${test.error}`);
                      }
                    } catch (err) {
                      console.error('Connection test error:', err);
                      alert(`❌ Connection test failed: ${err.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  Test API
                </button>
                <button
                  onClick={async () => {
                    console.log('🔍 Testing staff appointments endpoint...');
                    try {
                      const response = await staffService.getAppointments({
                        startDate: '2025-09-01',
                        endDate: '2025-10-31',
                        scope: 'salon'
                      });
                      console.log('Appointments test result:', response);
                      alert(`✅ Appointments endpoint working! Found: ${response?.data?.length || 0} appointments`);
                    } catch (err) {
                      console.error('Appointments test error:', err);
                      alert(`❌ Appointments test failed: ${err.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Test Appointments
                </button>
                <button
                  onClick={async () => {
                    console.log('🔍 Testing all approved appointments...');
                    try {
                      const response = await staffService.getAppointments({
                        startDate: '2025-09-01',
                        endDate: '2025-10-31',
                        status: 'Approved' // This will override the salon filter
                      });
                      console.log('All approved appointments result:', response);
                      alert(`✅ All approved appointments! Found: ${response?.data?.length || 0} appointments`);
                    } catch (err) {
                      console.error('All appointments test error:', err);
                      alert(`❌ All appointments test failed: ${err.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
                >
                  Test All Approved
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Manual calendar refresh triggered...');
                    const calendarApi = calendarRef.current?.getApi();
                    if (calendarApi) {
                      const currentView = calendarApi.view;
                      console.log('📅 Current calendar view:', currentView.type, currentView.activeStart, currentView.activeEnd);
                      fetchRangeAsEvents(currentView.activeStart, currentView.activeEnd);
                    }
                  }}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors text-sm font-medium"
                >
                  Refresh Calendar
                </button>
                <button
                  onClick={() => {
                    console.log('📅 Navigating to October 2025...');
                    const calendarApi = calendarRef.current?.getApi();
                    if (calendarApi) {
                      calendarApi.gotoDate('2025-10-01');
                      console.log('📅 Navigated to October 2025');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  Go to Oct 2025
                </button>
                <button
                  onClick={loadDemoData}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Show Demo Data
                </button>
                {error.includes('login') || error.includes('Authentication') ? (
                  <button
                    onClick={handleLoginRedirect}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button
                    onClick={retryFetch}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
            
            {(error.includes('Server error') || error.includes('port 5001')) && (
              <div className="text-red-700 text-sm space-y-1 bg-red-100 p-3 rounded">
                <p className="font-medium">Backend Server Issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure your backend server is running on port 5001</li>
                  <li>Check your backend terminal for error messages</li>
                  <li>Verify database connection is working</li>
                  <li>Ensure the API route /api/staff/appointments exists</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <FullCalendar 
            ref={calendarRef} 
            {...calendarOptions}
          />
        </div>

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
              <p className="text-gray-500 mb-4">You don't have any appointments for the selected period.</p>
              <button
                onClick={loadDemoData}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Client Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900 mt-1">{selectedEvent.customerName}</p>
                    </div>
                    {selectedEvent.customerEmail && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900 mt-1">{selectedEvent.customerEmail}</p>
                      </div>
                    )}
                    {selectedEvent.customerPhone && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <p className="text-gray-900 mt-1">{selectedEvent.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Appointment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                      <p className="text-gray-900 mt-1">
                        {selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
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
                        <p className="text-gray-900 mt-1">${selectedEvent.totalAmount}</p>
                      </div>
                    )}
                    {selectedEvent.end && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Duration:</span>
                        <p className="text-gray-900 mt-1">
                          {Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / (1000 * 60))} minutes
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                {selectedEvent.services && selectedEvent.services.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Booked Services
                    </h3>
                    <div className="space-y-3">
                      {selectedEvent.services.map((service, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {service.serviceId?.name || service.serviceName || 'Service'}
                              </p>
                              {service.duration && (
                                <p className="text-sm text-gray-600 mt-1">Duration: {service.duration} minutes</p>
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

                {/* Notes & Requests */}
                {(selectedEvent.notes || selectedEvent.specialRequests) && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Notes & Special Requests
                    </h3>
                    <div className="space-y-3">
                      {selectedEvent.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Customer Notes:</span>
                          <p className="text-gray-900 mt-1 bg-white p-2 rounded">{selectedEvent.notes}</p>
                        </div>
                      )}
                      {selectedEvent.specialRequests && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Special Requests:</span>
                          <p className="text-gray-900 mt-1 bg-white p-2 rounded">{selectedEvent.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
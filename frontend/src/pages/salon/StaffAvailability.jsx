import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { Calendar } from 'lucide-react';
import StaffAppointmentsCalendar from '../../components/salon/StaffAppointmentsCalendar';

const StaffAvailability = () => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  // Removed auto-refresh functionality - now only manual refresh

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <BackButton fallbackPath="/salon/dashboard" className="mb-4" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Appointments Calendar</h1>
              <p className="text-gray-600">View and manage your staff's appointments and availability</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                  <span className="text-gray-600">Unassigned appointments (click to assign staff)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                  <span className="text-gray-600">Staff blocked time (unavailable)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Refresh Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <StaffAppointmentsCalendar 
          embedded={false} 
          onRefresh={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default StaffAvailability;

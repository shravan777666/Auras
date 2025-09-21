import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import StaffAppointmentsCalendar from '../../components/salon/StaffAppointmentsCalendar';

const StaffAvailability = () => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/salon/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Appointments Calendar</h1>
              <p className="text-gray-600">View and manage your staff's appointments and availability</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
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

import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staff';
import { Clock, User, Scissors } from 'lucide-react';

const NextClientCountdown = () => {
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNextAppointment = async () => {
    try {
      setLoading(true);
      const response = await staffService.getNextAppointment();
      console.log('Next appointment response:', response); // Debug log
      if (response.success) {
        setNextAppointment(response.data);
      } else {
        setNextAppointment(null);
      }
    } catch (err) {
      console.error('Error fetching next appointment:', err);
      setError('Failed to load next appointment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextAppointment();
    
    // Refresh every minute
    const interval = setInterval(fetchNextAppointment, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!nextAppointment) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="text-center text-gray-500">
          No upcoming appointments found for today
        </div>
      </div>
    );
  }

  // Determine background color based on countdown color
  const getHeaderClass = () => {
    switch (nextAppointment.countdownColor) {
      case 'red':
        return 'bg-red-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      case 'green':
        return 'bg-green-500 text-white';
      default:
        return 'bg-purple-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      {/* Header with countdown */}
      <div className={`${getHeaderClass()} p-4 text-center font-bold text-lg flex items-center justify-center gap-2`}>
        <Clock size={20} />
        {nextAppointment.countdownText}
      </div>
      
      {/* Body with client info */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-gray-500" />
              <span className="font-semibold text-gray-800">Client:</span>
              <span className="text-gray-700">{nextAppointment.clientName || 'Unknown Client'}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Scissors size={16} className="text-gray-500" />
              <span className="font-semibold text-gray-800">Service:</span>
              <span className="text-gray-700">{nextAppointment.serviceName || 'Service'}</span>
            </div>
            
            {nextAppointment.clientNotes && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Note:</span> {nextAppointment.clientNotes}
                </p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default NextClientCountdown;
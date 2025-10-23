import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { customerService } from '../../services/customer';

const CancelAppointmentModal = ({ isOpen, onClose, appointment, onConfirm }) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await customerService.cancelBooking(appointment._id, {
        cancellationReason
      });
      
      if (response?.success) {
        onConfirm(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError(error.response?.data?.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'Unknown Date';
    
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return `${formattedDate} at ${timeString || 'Unknown Time'}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Cancel Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Important Notice</h3>
                <p className="text-red-700 mt-1">
                  Cancelling this appointment may result in fees based on the salon's cancellation policy.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Appointment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{appointment.salonId?.salonName || 'Unknown Salon'}</span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation
              </label>
              <textarea
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Please explain why you need to cancel this appointment..."
                required
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={loading}
              >
                Keep Appointment
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                disabled={loading || !cancellationReason.trim()}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </>
                ) : 'Cancel Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
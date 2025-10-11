import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { staffService } from '../../services/staff';

const ShiftSwapForm = ({ isOpen, onClose, onSubmit, staffMembers = [] }) => {
  const [formData, setFormData] = useState({
    requesterShiftId: '',
    targetStaffId: '',
    targetShiftId: '',
    requesterNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [loadingMyShifts, setLoadingMyShifts] = useState(false);
  const [loadingTargetShifts, setLoadingTargetShifts] = useState(false);

  // Fetch current staff's shifts when the form opens
  useEffect(() => {
    if (isOpen) {
      fetchMyShifts();
    } else {
      // Reset form when closing
      setFormData({
        requesterShiftId: '',
        targetStaffId: '',
        targetShiftId: '',
        requesterNotes: ''
      });
      setMyShifts([]);
      setAvailableShifts([]);
    }
  }, [isOpen]);

  // Fetch target staff shifts when targetStaffId changes
  useEffect(() => {
    if (formData.targetStaffId) {
      fetchTargetStaffShifts(formData.targetStaffId);
    } else {
      setAvailableShifts([]);
    }
  }, [formData.targetStaffId]);

  const fetchMyShifts = async () => {
    try {
      setLoadingMyShifts(true);
      // Fetch current staff's appointments
      const response = await staffService.getAppointments({
        limit: 50,
        scope: 'mine' // Only fetch my appointments
      });
      
      let appointments = [];
      if (response?.success) {
        appointments = response.data || [];
      } else if (Array.isArray(response)) {
        appointments = response;
      } else if (response?.data) {
        appointments = response.data || [];
      }
      
      // Filter for upcoming confirmed appointments
      const upcomingShifts = appointments
        .filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          const today = new Date();
          return appointmentDate >= today && appointment.status === 'Confirmed';
        })
        .map(appointment => ({
          id: appointment._id,
          date: new Date(appointment.appointmentDate).toLocaleDateString(),
          time: appointment.appointmentTime || 'Time not specified',
          title: `${appointment.customerId?.name || 'Customer'} - ${appointment.services?.[0]?.serviceId?.name || 'Service'}`,
          fullDate: appointment.appointmentDate
        }))
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      
      setMyShifts(upcomingShifts);
    } catch (error) {
      console.error('Error fetching my shifts:', error);
    } finally {
      setLoadingMyShifts(false);
    }
  };

  const fetchTargetStaffShifts = async (targetStaffId) => {
    try {
      setLoadingTargetShifts(true);
      // In a real implementation, you would fetch shifts for the target staff member
      // For now, we'll simulate this with a placeholder
      setAvailableShifts([]);
    } catch (error) {
      console.error('Error fetching target staff shifts:', error);
      setAvailableShifts([]);
    } finally {
      setLoadingTargetShifts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If changing target staff, reset target shift selection
    if (name === 'targetStaffId') {
      setFormData(prev => ({
        ...prev,
        targetShiftId: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        requesterShiftId: '',
        targetStaffId: '',
        targetShiftId: '',
        requesterNotes: ''
      });
    } catch (error) {
      console.error('Error submitting shift swap request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Request Shift Swap</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Shift</label>
            <select
              name="requesterShiftId"
              value={formData.requesterShiftId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loadingMyShifts}
            >
              {loadingMyShifts ? (
                <option>Loading your shifts...</option>
              ) : myShifts.length === 0 ? (
                <option value="">No upcoming shifts found</option>
              ) : (
                <>
                  <option value="">Select your shift</option>
                  {myShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.date} - {shift.time} - {shift.title}
                    </option>
                  ))}
                </>
              )}
            </select>
            {loadingMyShifts && (
              <p className="text-sm text-gray-500 mt-1">Loading your upcoming shifts...</p>
            )}
            {myShifts.length === 0 && !loadingMyShifts && (
              <p className="text-sm text-gray-500 mt-1">
                You don't have any upcoming shifts to swap.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colleague</label>
            <select
              name="targetStaffId"
              value={formData.targetStaffId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={staffMembers.length === 0}
            >
              <option value="">Select a colleague</option>
              {staffMembers.length > 0 ? (
                staffMembers.map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} - {staff.position}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No colleagues available
                </option>
              )}
            </select>
            {staffMembers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                You don't have any colleagues in your salon yet.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Their Shift</label>
            <select
              name="targetShiftId"
              value={formData.targetShiftId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.targetStaffId || loadingTargetShifts}
            >
              {loadingTargetShifts ? (
                <option>Loading their shifts...</option>
              ) : availableShifts.length === 0 ? (
                <option value="">No shifts available for this colleague</option>
              ) : (
                <>
                  <option value="">Select their shift</option>
                  {availableShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.date} - {shift.time}
                    </option>
                  ))}
                </>
              )}
            </select>
            {loadingTargetShifts && (
              <p className="text-sm text-gray-500 mt-1">Loading colleague's shifts...</p>
            )}
            {!formData.targetStaffId && (
              <p className="text-sm text-gray-500 mt-1">
                Please select a colleague first.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              name="requesterNotes"
              value={formData.requesterNotes}
              onChange={handleChange}
              placeholder="Reason for swap or additional details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              disabled={loading || staffMembers.length === 0 || myShifts.length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftSwapForm;
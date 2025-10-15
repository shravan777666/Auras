import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { staffService } from '../../services/staff';
import { toast } from 'react-hot-toast';

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
      // We'll fetch a larger number of appointments and filter on the frontend
      const response = await staffService.getAppointments({
        limit: 200  // Increased limit to ensure we get all upcoming appointments
        // Removed scope and status parameters to get all appointments
      });
      
      let appointments = [];
      if (response?.success) {
        appointments = response.data || [];
      } else if (Array.isArray(response)) {
        appointments = response;
      } else if (response?.data) {
        appointments = response.data || [];
      }
      
      // Filter for upcoming appointments with valid statuses
      const upcomingShifts = appointments
        .filter(appointment => {
          // Parse the appointment date string properly
          const appointmentDateStr = appointment.appointmentDate;
          if (!appointmentDateStr) return false;
          
          // Extract date part for comparison (YYYY-MM-DD)
          const appointmentDatePart = appointmentDateStr.split('T')[0];
          const todayDatePart = new Date().toISOString().split('T')[0];
          
          // Compare date strings lexicographically
          const isUpcoming = appointmentDatePart >= todayDatePart;
          
          // Show appointments with valid upcoming statuses
          const isValidStatus = ['Approved', 'Pending', 'Confirmed', 'In-Progress'].includes(appointment.status);
          
          return isUpcoming && isValidStatus;
        })
        .map(appointment => ({
          id: appointment._id,
          date: new Date(appointment.appointmentDate).toLocaleDateString(),
          // Extract time from appointmentDate if appointmentTime is not available
          time: appointment.appointmentTime || (appointment.appointmentDate ? appointment.appointmentDate.split('T')[1] : 'Time not specified'),
          title: `${appointment.customerId?.name || 'Customer'} - ${appointment.services?.[0]?.serviceId?.name || appointment.services?.[0]?.serviceName || 'Service'}`,
          fullDate: appointment.appointmentDate
        }))
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      
      setMyShifts(upcomingShifts);
    } catch (error) {
      console.error('Error fetching my shifts:', error);
      toast.error("Failed to load your shifts. Please try again.");
    } finally {
      setLoadingMyShifts(false);
    }
  };

  const fetchTargetStaffShifts = async (targetStaffId) => {
    try {
      setLoadingTargetShifts(true);
      console.log('Fetching shifts for target staff ID:', targetStaffId);
      
      // Fetch shifts for the target staff member
      const response = await staffService.getAppointmentsByStaffId(targetStaffId, {
        limit: 200  // Increased limit to ensure we get all upcoming appointments
      });
      
      console.log('Response from getAppointmentsByStaffId:', response);
      
      let appointments = [];
      if (response?.success) {
        appointments = response.data || [];
      } else if (Array.isArray(response)) {
        appointments = response;
      } else if (response?.data) {
        appointments = response.data || [];
      }
      
      console.log('Appointments fetched:', appointments);
      
      // Filter for upcoming appointments with valid statuses (in case backend filtering is not working)
      const upcomingShifts = appointments
        .filter(appointment => {
          // Parse the appointment date string properly
          const appointmentDateStr = appointment.date || appointment.appointmentDate;
          if (!appointmentDateStr) return false;
          
          // Extract date part for comparison (YYYY-MM-DD)
          const appointmentDatePart = appointmentDateStr.split('T')[0];
          const todayDatePart = new Date().toISOString().split('T')[0];
          
          // Compare date strings lexicographically
          const isUpcoming = appointmentDatePart >= todayDatePart;
          
          // Show appointments with valid upcoming statuses
          const isValidStatus = ['Approved', 'Pending', 'Confirmed', 'In-Progress'].includes(appointment.status);
          
          console.log('Appointment filter results:', {
            appointmentId: appointment.id || appointment._id,
            date: appointmentDateStr,
            isUpcoming,
            status: appointment.status,
            isValidStatus,
            shouldInclude: isUpcoming && isValidStatus
          });
          
          return isUpcoming && isValidStatus;
        })
        .map(appointment => ({
          id: appointment.id || appointment._id,
          date: new Date(appointment.date || appointment.appointmentDate).toLocaleDateString(),
          // Extract time from appointmentDate if appointmentTime is not available
          time: appointment.time || appointment.appointmentTime || ((appointment.date || appointment.appointmentDate) ? (appointment.date || appointment.appointmentDate).split('T')[1] : 'Time not specified'),
          title: `${appointment.customer || appointment.customerId?.name || 'Customer'} - ${appointment.service || appointment.services?.[0]?.serviceId?.name || appointment.services?.[0]?.serviceName || 'Service'}`,
          customer: appointment.customer || appointment.customerId?.name || 'Customer',
          service: appointment.service || appointment.services?.[0]?.serviceId?.name || appointment.services?.[0]?.serviceName || 'Service',
          fullDate: appointment.date || appointment.appointmentDate
        }))
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      
      console.log('Filtered and mapped upcoming shifts:', upcomingShifts);
      setAvailableShifts(upcomingShifts);
    } catch (error) {
      console.error('Error fetching target staff shifts:', error);
      // Log more detailed error information
      if (error.response) {
        console.error('Error response:', error.response);
      }
      toast.error("Failed to load colleague's shifts. Please try again.");
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
      // Validate form data before submission
      if (!formData.requesterShiftId || !formData.targetStaffId || !formData.targetShiftId) {
        toast.error("Please select all required fields.");
        setLoading(false);
        return;
      }
      
      await onSubmit(formData);
      onClose();
      // Show success message
      toast.success("Shift Swap Request Submitted Successfully.");
      // Reset form
      setFormData({
        requesterShiftId: '',
        targetStaffId: '',
        targetShiftId: '',
        requesterNotes: ''
      });
    } catch (error) {
      console.error('Error submitting shift swap request:', error);
      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || "Failed to submit shift swap request. Please try again.";
      toast.error(errorMessage);
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
                      {shift.date} - {shift.time} - {shift.title}
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
              disabled={loading || staffMembers.length === 0 || myShifts.length === 0 || !formData.requesterShiftId || !formData.targetStaffId || !formData.targetShiftId}
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
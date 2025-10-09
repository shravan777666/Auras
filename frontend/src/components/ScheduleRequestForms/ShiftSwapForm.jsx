import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ShiftSwapForm = ({ isOpen, onClose, onSubmit, staffMembers = [] }) => {
  const [formData, setFormData] = useState({
    requesterShiftId: '',
    targetStaffId: '',
    targetShiftId: '',
    requesterNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [availableShifts, setAvailableShifts] = useState([]);

  // Mock shifts data - in a real app, this would come from an API
  const mockShifts = [
    { id: 'shift1', date: '2025-10-10', time: '09:00-17:00', staffId: 'staff1' },
    { id: 'shift2', date: '2025-10-11', time: '10:00-18:00', staffId: 'staff2' },
    { id: 'shift3', date: '2025-10-12', time: '11:00-19:00', staffId: 'staff3' },
    { id: 'shift4', date: '2025-10-13', time: '08:00-16:00', staffId: 'staff1' },
  ];

  useEffect(() => {
    if (formData.targetStaffId) {
      // Filter shifts for the selected target staff member
      const shifts = mockShifts.filter(shift => shift.staffId === formData.targetStaffId);
      setAvailableShifts(shifts);
    } else {
      setAvailableShifts([]);
    }
  }, [formData.targetStaffId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
            >
              <option value="">Select your shift</option>
              <option value="shift1">Oct 10, 2025 - 09:00-17:00</option>
              <option value="shift2">Oct 11, 2025 - 10:00-18:00</option>
              <option value="shift3">Oct 12, 2025 - 11:00-19:00</option>
              <option value="shift4">Oct 13, 2025 - 08:00-16:00</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colleague</label>
            <select
              name="targetStaffId"
              value={formData.targetStaffId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a colleague</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} - {staff.position}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Their Shift</label>
            <select
              name="targetShiftId"
              value={formData.targetShiftId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.targetStaffId}
            >
              <option value="">Select their shift</option>
              {availableShifts.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.date} - {shift.time}
                </option>
              ))}
            </select>
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
              disabled={loading}
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
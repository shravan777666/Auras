import React, { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AssignStaffModal = ({ isOpen, onClose, appointment, onStaffAssigned, onRefresh }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedStaffId(null); // Reset selection when modal opens
      fetchStaffAvailability();
    }
  }, [isOpen, appointment]);

  const fetchStaffAvailability = async () => {
    try {
      setLoading(true);
      
      // Get staff availability for the appointment date
      const appointmentDate = new Date(appointment.appointmentDate);
      const startDate = new Date(appointmentDate);
      startDate.setDate(1); // First day of month
      const endDate = new Date(appointmentDate);
      endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of month

      const response = await salonService.getStaffAvailability({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      if (response?.success) {
        const staffData = response.data?.staffAppointments || [];
        
        // Check availability for each staff member at the appointment time
        const staffWithAvailability = staffData.map(staffData => {
          const isAvailable = checkStaffAvailability(
            staffData, 
            appointmentDate, 
            appointment.appointmentTime
          );
          
          return {
            ...staffData.staff,
            isAvailable,
            availability: isAvailable ? 'Free' : 'Busy'
          };
        });

        setStaff(staffWithAvailability);
      }
    } catch (error) {
      console.error('Error fetching staff availability:', error);
      toast.error('Failed to fetch staff availability');
    } finally {
      setLoading(false);
    }
  };

  const checkStaffAvailability = (staffData, appointmentDate, appointmentTime) => {
    // Check if staff has any appointments at the same time
    const appointmentDateTime = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes);

    // Check if staff has appointments at this time
    const hasConflict = staffData.appointments?.some(apt => {
      const aptDate = new Date(apt.date);
      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      aptDate.setHours(aptHours, aptMinutes);
      
      return aptDate.getTime() === appointmentDateTime.getTime() && 
             apt.status !== 'Cancelled' && 
             apt.status !== 'Completed';
    });

    return !hasConflict;
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      setAssigning(true);
      
      const response = await salonService.assignStaffToAppointment(appointment._id, {
        staffId: selectedStaffId
      });

      if (response?.success) {
        toast.success('Staff assigned successfully');
        onStaffAssigned();
        if (onRefresh) {
          onRefresh();
        }
        onClose();
      } else {
        toast.error(response?.message || 'Failed to assign staff');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign staff';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const getAvailabilityIcon = (isAvailable) => {
    return isAvailable ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getAvailabilityColor = (isAvailable) => {
    return isAvailable 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Staff</h2>
              <p className="text-sm text-gray-600">
                Select a staff member for this appointment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Appointment Details */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Appointment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Customer:</span>
              <span className="ml-2 font-medium">
                {appointment.customerId?.name || 'Unknown Customer'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Date & Time:</span>
              <span className="ml-2 font-medium">
                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Services:</span>
              <span className="ml-2 font-medium">
                {appointment.services?.map(s => s.serviceName || s.serviceId?.name).join(', ') || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2 font-medium">₹{appointment.totalAmount || appointment.finalAmount || 0}</span>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Available Staff</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Loading staff availability..." />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4" />
              <p>No staff members found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {staff.map((staffMember) => (
                <div
                  key={staffMember._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedStaffId === staffMember._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!staffMember.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => staffMember.isAvailable && setSelectedStaffId(staffMember._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{staffMember.name}</h4>
                        <p className="text-sm text-gray-600">{staffMember.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getAvailabilityColor(staffMember.isAvailable)}`}>
                        {getAvailabilityIcon(staffMember.isAvailable)}
                        {staffMember.availability}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Free - Available for assignment</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>Busy - Has conflicting appointment</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignStaff}
            disabled={!selectedStaffId || assigning}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Assigning...
              </>
            ) : (
              'Confirm Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStaffModal;

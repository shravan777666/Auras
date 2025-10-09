import React, { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AssignStaffModal = ({ isOpen, onClose, appointment, onStaffAssigned, onRefresh }) => {
  const navigate = useNavigate();
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
          const { isAvailable, availability } = checkStaffAvailability(
            staffData, 
            appointmentDate, 
            appointment.appointmentTime
          );
          
          return {
            ...staffData.staff,
            isAvailable,
            availability
          };
        });

        setStaff(staffWithAvailability);
      } else {
        throw new Error(response?.message || 'Failed to fetch staff availability');
      }
    } catch (error) {
      console.error('Error fetching staff availability:', error);
      toast.error(error.message || 'Failed to fetch staff availability');
      setStaff([]); // Set empty array on error to avoid undefined issues
    } finally {
      setLoading(false);
    }
  };

  const checkStaffAvailability = (staffData, appointmentDate, appointmentTime) => {
    // Check if staff has any appointments at the same time
    const appointmentDateTime = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes);

    // Check if staff has appointments at this time (excluding cancelled/completed)
    const conflictingAppointment = staffData.appointments?.find(apt => {
      const aptDate = new Date(apt.date);
      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      aptDate.setHours(aptHours, aptMinutes);
      
      return aptDate.getTime() === appointmentDateTime.getTime() && 
             apt.status !== 'Cancelled' && 
             apt.status !== 'Completed';
    });

    if (!conflictingAppointment) {
      return { isAvailable: true, availability: 'Free' };
    }

    if (conflictingAppointment.status === 'STAFF_BLOCKED') {
      return { isAvailable: false, availability: 'Blocked' };
    }

    return { isAvailable: false, availability: 'Busy' };
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
        toast.success('Staff assigned successfully! Appointment status updated to Approved. Redirecting to appointments page...');
        onStaffAssigned();
        if (onRefresh) {
          onRefresh();
        }
        onClose();
        
        // Navigate to appointments page after successful assignment
        setTimeout(() => {
          navigate('/salon/appointments');
        }, 1500); // Slightly longer delay to show the success message
      } else {
        throw new Error(response?.message || 'Failed to assign staff');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign staff';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const getAvailabilityIcon = (availability) => {
    if (availability === 'Free') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (availability === 'Blocked') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getAvailabilityColor = (availability) => {
    if (availability === 'Free') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (availability === 'Blocked') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Return null if modal is not open
  if (!isOpen) return null;

  // Handle case where appointment is not provided
  if (!appointment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">Appointment data is missing. Please try again.</p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Appointment Details */}
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
        <div className="p-6 flex-grow overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Available Staff</h3>
          
          {loading ? (
            <div className="flex justify-center py-8 flex-grow items-center">
              <LoadingSpinner text="Loading staff availability..." />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex-grow flex flex-col items-center justify-center">
              <User className="h-12 w-12 mx-auto mb-4" />
              <p className="mb-2">No staff members found</p>
              <p className="text-sm text-gray-400">Please make sure you have staff members in your salon</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-grow">
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
                        <h4 className="font-medium text-gray-900">{staffMember.name || 'Unknown Staff'}</h4>
                        <p className="text-sm text-gray-600">{staffMember.position || 'Position not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getAvailabilityColor(staffMember.availability)}`}>
                        {getAvailabilityIcon(staffMember.availability)}
                        {staffMember.availability || 'Unknown'}
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
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-500" />
              <span>Blocked - Staff has blocked this time</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
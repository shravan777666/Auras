import React, { useState, useEffect } from 'react';
import { scheduleRequestService } from '../../services/scheduleRequests';
import { staffService } from '../../services/staff';
import { X, Calendar, User, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PeerShiftSwapReview = ({ isOpen, onClose, onActionComplete }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPeerRequests();
    }
  }, [isOpen]);

  const loadPeerRequests = async () => {
    try {
      setLoading(true);
      const response = await scheduleRequestService.getPeerShiftSwapRequests();
      setRequests(response.data.items || response.data || []);
    } catch (err) {
      setError('Failed to load shift swap requests');
      console.error('Error loading peer requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessing(true);
      await scheduleRequestService.peerApproveShiftSwap(requestId);
      toast.success('Shift swap request approved successfully!');
      loadPeerRequests();
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing(true);
      await scheduleRequestService.peerRejectShiftSwap(requestId, rejectionReason);
      toast.success('Shift swap request rejected successfully!');
      setRejectionReason('');
      loadPeerRequests();
      setShowDetails(false);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const viewRequestDetails = async (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
    
    // Fetch detailed appointment information
    try {
      // Fetch requester's shift details
      const requesterShiftResponse = await staffService.getAppointmentsByStaffId(
        request.staffId._id, 
        { limit: 100 }
      );
      
      // Find the specific appointment
      const requesterShift = (requesterShiftResponse.data || requesterShiftResponse || [])
        .find(app => app.id === request.shiftSwap.requesterShiftId || app._id === request.shiftSwap.requesterShiftId);
      
      // Fetch target staff's shift details
      const targetShiftResponse = await staffService.getAppointmentsByStaffId(
        request.shiftSwap.targetStaffId, 
        { limit: 100 }
      );
      
      // Find the specific appointment
      const targetShift = (targetShiftResponse.data || targetShiftResponse || [])
        .find(app => app.id === request.shiftSwap.targetShiftId || app._id === request.shiftSwap.targetShiftId);
      
      // Update the selected request with detailed shift information
      setSelectedRequest({
        ...request,
        requesterShift: requesterShift || null,
        targetShift: targetShift || null
      });
    } catch (error) {
      console.error('Error fetching shift details:', error);
      toast.error('Failed to load shift details');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Shift Swap Requests</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {showDetails && selectedRequest ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Shift Swap Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to list
              </button>
            </div>

            <div className="space-y-6">
              {/* Requester Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Requester Information
                </h4>
                <div className="flex items-center gap-3">
                  {selectedRequest.staffId?.profilePicture ? (
                    <img 
                      src={selectedRequest.staffId.profilePicture} 
                      alt={selectedRequest.staffId.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedRequest.staffId?.name || 'Unknown Staff'}</p>
                    <p className="text-sm text-gray-500">{selectedRequest.staffId?.position || 'Staff Member'}</p>
                  </div>
                </div>
                {selectedRequest.shiftSwap?.requesterNotes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Notes:</p>
                    <p className="text-sm text-gray-600">{selectedRequest.shiftSwap.requesterNotes}</p>
                  </div>
                )}
              </div>

              {/* Requester's Shift */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Requester's Shift
                </h4>
                {selectedRequest.requesterShift ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedRequest.requesterShift.date || selectedRequest.requesterShift.appointmentDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Time:</span>
                      <span className="text-sm text-gray-900">
                        {formatTime(selectedRequest.requesterShift.time || selectedRequest.requesterShift.appointmentTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Client:</span>
                      <span className="text-sm text-gray-900">{selectedRequest.requesterShift.customer || 'Client'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Service:</span>
                      <span className="text-sm text-gray-900">{selectedRequest.requesterShift.service || 'Service'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading shift details...</p>
                )}
              </div>

              {/* Target's Shift */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Your Shift
                </h4>
                {selectedRequest.targetShift ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedRequest.targetShift.date || selectedRequest.targetShift.appointmentDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Time:</span>
                      <span className="text-sm text-gray-900">
                        {formatTime(selectedRequest.targetShift.time || selectedRequest.targetShift.appointmentTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Client:</span>
                      <span className="text-sm text-gray-900">{selectedRequest.targetShift.customer || 'Client'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Service:</span>
                      <span className="text-sm text-gray-900">{selectedRequest.targetShift.service || 'Service'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading shift details...</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reject this shift swap request?')) {
                      handleReject(selectedRequest._id);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                  disabled={processing}
                >
                  {processing ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest._id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  disabled={processing}
                >
                  {processing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <button
                  onClick={loadPeerRequests}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No shift swap requests</p>
                <p className="text-sm text-gray-400 mt-1">You don't have any shift swap requests to review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {request.staffId?.profilePicture ? (
                            <img 
                              src={request.staffId.profilePicture} 
                              alt={request.staffId.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-indigo-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{request.staffId?.name || 'Unknown Staff'}</h3>
                            <p className="text-sm text-gray-500">Shift Swap Request</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {request.shiftSwap?.requesterNotes || 'No additional notes provided.'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => viewRequestDetails(request)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerShiftSwapReview;
import React, { useState, useEffect } from 'react';
import { scheduleRequestService } from '../../services/scheduleRequests';
import { toast } from 'react-hot-toast';
import { RefreshCw, User, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

const PendingScheduleRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scheduleRequestService.getPendingRequests();
      if (response && response.success) {
        setRequests(response.data.items || response.data.data || response.data || []);
      } else {
        setRequests([]);
        console.warn('API response not successful:', response);
      }
    } catch (err) {
      console.error('Error loading pending requests:', err);
      if (err.response && err.response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load pending requests. Please try again later.');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      const response = await scheduleRequestService.approveRequest(id);
      
      // Check if this was a shift swap request
      const request = requests.find(req => req._id === id);
      if (request && request.type === 'shift-swap') {
        toast.success('Shift Swap Approved! The appointments have been updated.');
        // Emit a custom event to notify other components to refresh their data
        window.dispatchEvent(new CustomEvent('shiftSwapApproved', {
          detail: { requestId: id }
        }));
      } else {
        toast.success('Request approved successfully!');
      }
      
      loadPendingRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving request:', error);
      if (error.response && error.response.status === 400) {
        // Handle bad request errors (e.g., already approved/rejected)
        toast.error(error.response.data?.message || 'Request cannot be approved.');
      } else {
        toast.error('Failed to approve request. Please try again.');
      }
    }
  };

  const handleReject = async (id) => {
    try {
      // In a real implementation, you might want to ask for a rejection reason
      const rejectionReason = 'Request denied by salon owner';
      await scheduleRequestService.rejectRequest(id, rejectionReason);
      toast.success('Request rejected successfully!');
      loadPendingRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting request:', error);
      if (error.response && error.response.status === 400) {
        // Handle bad request errors (e.g., already rejected)
        toast.error(error.response.data?.message || 'Request cannot be rejected.');
      } else {
        toast.error('Failed to reject request. Please try again.');
      }
    }
  };

  const getTypeDisplay = (type) => {
    switch (type) {
      case 'block-time':
        return 'Block Time';
      case 'leave':
        return 'Time Off';
      case 'shift-swap':
        return 'Shift Swap';
      default:
        return type;
    }
  };

  const getRequestDetails = (request) => {
    switch (request.type) {
      case 'block-time':
        return `${request.blockTime.startTime} - ${request.blockTime.endTime} (${request.blockTime.reason})`;
      case 'leave':
        return `${request.leave.startDate} to ${request.leave.endDate} (${request.leave.reason})`;
      case 'shift-swap':
        // For shift swap requests, show more details
        if (request.status === 'peer-approved') {
          return 'Peer approved shift swap request - Ready for final approval';
        }
        return 'Shift swap request with colleague - Awaiting peer approval';
      default:
        return 'Details not available';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'peer-approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Peer Approved</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
          <button 
            onClick={loadPendingRequests}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pending Schedule Requests</h2>
          <p className="text-sm text-gray-500">Review and approve staff schedule requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPendingRequests}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No pending schedule requests</p>
          <p className="text-sm text-gray-400 mt-1">All requests are up to date!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {request.staffId?.profilePicture ? (
                        <img 
                          src={request.staffId.profilePicture} 
                          alt={request.staffId.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-indigo-600" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.staffId?.name || 'Unknown Staff'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.staffId?.position || 'No Position'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {getTypeDisplay(request.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {getRequestDetails(request)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingScheduleRequests;
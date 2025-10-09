import React, { useEffect, useState } from 'react';
import { scheduleRequestService } from '../../services/scheduleRequests';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await scheduleRequestService.getMyRequests();
      setRequests(response.data.items || response.data);
    } catch (err) {
      setError('Failed to load requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'peer-approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return <div className="text-center py-4">Loading requests...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Requests</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>You haven't submitted any schedule requests yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getTypeDisplay(request.type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {request.type === 'block-time' && (
                      <div>
                        <div>{request.blockTime.startTime} - {request.blockTime.endTime}</div>
                        <div className="text-xs text-gray-400">{request.blockTime.reason}</div>
                      </div>
                    )}
                    {request.type === 'leave' && (
                      <div>
                        <div>{request.leave.startDate} to {request.leave.endDate}</div>
                        <div className="text-xs text-gray-400">{request.leave.reason}</div>
                      </div>
                    )}
                    {request.type === 'shift-swap' && (
                      <div>
                        <div>Swap Request</div>
                        <div className="text-xs text-gray-400">With colleague</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
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

export default MyRequests;
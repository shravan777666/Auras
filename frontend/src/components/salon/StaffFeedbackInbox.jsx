import React, { useState, useEffect } from 'react';
import { internalFeedbackService } from '../../services/internalFeedbackService';
import { toast } from 'react-hot-toast';

const StaffFeedbackInbox = ({ salonId }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '' });

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const response = await internalFeedbackService.getFeedbackForSalon(salonId, filters);
        setFeedback(response.data.feedback);
      } catch (error) {
        toast.error('Failed to fetch staff feedback.');
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      fetchFeedback();
    }
  }, [salonId, filters]);

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      await internalFeedbackService.updateFeedbackStatus(feedbackId, newStatus);
      setFeedback(feedback.map(item => item._id === feedbackId ? { ...item, status: newStatus } : item));
      toast.success('Feedback status updated.');
    } catch (error) {
      toast.error('Failed to update feedback status.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Staff Feedback Inbox</h2>
      {/* Filtering UI */}
      <div className="flex gap-4 mb-4">
        <select onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="p-2 border rounded-md">
          <option value="">All Types</option>
          <option>Suggestion</option>
          <option>Complaint</option>
          <option>Facility</option>
          <option>Management</option>
        </select>
        <select onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="p-2 border rounded-md">
          <option value="">All Statuses</option>
          <option>New</option>
          <option>Under Review</option>
          <option>Resolved</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
            ) : feedback.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4">No feedback found.</td></tr>
            ) : (
              feedback.map(item => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.isAnonymous ? 'Anonymous' : item.staffMemberId.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(item.dateSubmitted).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                  <td className="px-6 py-4">{item.content}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select onChange={(e) => handleStatusChange(item._id, e.target.value)} value={item.status} className="p-2 border rounded-md">
                      <option>New</option>
                      <option>Under Review</option>
                      <option>Resolved</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffFeedbackInbox;

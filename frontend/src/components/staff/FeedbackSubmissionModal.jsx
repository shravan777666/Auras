import React, { useState } from 'react';
import { internalFeedbackService } from '../../services/internalFeedbackService';
import toast from 'react-hot-toast';

const FeedbackSubmissionModal = ({ isOpen, onClose }) => {
  const [type, setType] = useState('Suggestion');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length === 0) {
      toast.error('Feedback content cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await internalFeedbackService.submitFeedback({ type, content, isAnonymous });
      toast.success('Feedback submitted successfully!');
      onClose();
      setContent('');
      setIsAnonymous(false);
    } catch (error) {
      toast.error('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Submit Internal Feedback</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700">Feedback Type</label>
            <select
              id="feedback-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>Suggestion</option>
              <option>Complaint</option>
              <option>Facility</option>
              <option>Management</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="feedback-content" className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              id="feedback-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={6}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">{1000 - content.length} characters remaining</p>
          </div>
          <div className="mb-4 flex items-center">
            <input
              id="anonymous-checkbox"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="anonymous-checkbox" className="ml-2 block text-sm text-gray-900">Submit Anonymously</label>
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackSubmissionModal;

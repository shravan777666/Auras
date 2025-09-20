import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const RateExperience = ({ appointment, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleSubmit = () => {
    onSubmit(appointment._id, { rating: { overall: rating }, feedback });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Rate Your Experience</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Salon: {appointment.salonId?.salonName}</p>
          <p className="text-sm text-gray-600">Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
        </div>
        <div className="mb-4">
          <p className="font-medium mb-2">Overall Rating</p>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => handleRating(star)}
              />
            ))}
          </div>
        </div>
        <div className="mb-6">
          <p className="font-medium mb-2">Feedback (Optional)</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows="4"
            placeholder="Tell us about your experience..."
          ></textarea>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            disabled={rating === 0}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateExperience;
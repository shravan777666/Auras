import api from './api';

export const internalFeedbackService = {
  submitFeedback: (feedbackData) => {
    return api.post('/internal-feedback', feedbackData);
  },

  getFeedbackForSalon: (salonId, filters) => {
    return api.get(`/internal-feedback/salon/${salonId}`, { params: filters });
  },

  updateFeedbackStatus: (feedbackId, status) => {
    return api.patch(`/internal-feedback/${feedbackId}/status`, { status });
  },
};

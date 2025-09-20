import api from './api';

export const reviewService = {
  async listBySalon(salonId, { page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ page, limit }).toString();
    const res = await api.get(`/reviews/salon/${salonId}?${params}`);
    return res.data; // { success, data, meta }
  },

  async getSummary(salonId) {
    const res = await api.get(`/reviews/salon/${salonId}/summary`);
    return res.data; // { success, data: { averageRating, totalReviews } }
  },
};
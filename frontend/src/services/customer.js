import api from './api';

export const customerService = {
  async getDashboard() {
    const response = await api.get('/customer/dashboard');
    return response.data;
  },
  async browseSalons(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/customer/salons${query ? `?${query}` : ''}`);
    return response.data;
  },
  async getSalonDetails(salonId) {
    const response = await api.get(`/customer/salons/${salonId}`);
    return response.data;
  },
  async bookAppointment(payload) {
    const response = await api.post('/appointment/book', payload);
    return response.data;
  },
  async getBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/customer/bookings${query ? `?${query}` : ''}`);
    return response.data;
  },
  async getPendingAppointments(params = {}) {
    const queryParams = new URLSearchParams({ ...params, status: 'Pending' }).toString();
    const response = await api.get(`/customer/bookings${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },
  async submitReview(appointmentId, reviewData) {
    // Normalize payload to match backend expectations
    const rawRating = reviewData?.rating;
    let numericRating = (rawRating && typeof rawRating === 'object') ? rawRating.overall : rawRating;
    numericRating = Math.round(Number(numericRating));
    // Clamp between 1 and 5
    const rating = Math.min(5, Math.max(1, numericRating));

    const comment =
      (reviewData?.comment ?? reviewData?.feedback ?? '').toString().trim() || undefined;

    const payload = {
      appointmentId: String(appointmentId).trim(),
      rating,
      comment,
    };

    const response = await api.post(`/reviews`, payload);
    return response.data;
  },
};
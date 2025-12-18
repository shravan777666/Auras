import api from './api';

export const customerService = {
  async getDashboard() {
    const response = await api.get('/customer/dashboard');
    return response.data;
  },
  async getSalonLocations() {
    const response = await api.get('/salon/locations');
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
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/customer/bookings${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },
  async getBookingHistory(limit = 10) {
    const response = await api.get(`/customer/bookings?limit=${limit}&sort=-createdAt`);
    return response.data;
  },
  async getPendingAppointments(params = {}) {
    const queryParams = new URLSearchParams({ ...params, status: 'Pending' }).toString();
    const response = await api.get(`/customer/bookings${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },
  async getProfile() {
    const response = await api.get('/customer/profile');
    return response.data;
  },
  async updateProfile(updateData) {
    // When sending FormData, the browser automatically sets the Content-Type
    // to 'multipart/form-data' with the correct boundary.
    // The api instance should be configured to handle this.
    const response = await api.patch('/customer/profile', updateData);
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

  async getRecommendations(customerId) {
    const response = await api.get(`/recommendations/customer/${customerId}`);
    return response.data;
  },
  
  // New function to get one-click booking preference
  async getOneClickBookingPreference(customerId) {
    const response = await api.get(`/recommendations/one-click-preference/${customerId}`);
    return response.data;
  },
  
  // New function to get salon availability for a specific date
  async getSalonAvailability(salonId, date) {
    const response = await api.get(`/customer/salons/${salonId}/availability?date=${date}`);
    return response.data;
  },
  
  // Keep the existing function for backward compatibility
  async getSalonSlots(salonId, date) {
    const response = await api.get(`/appointment/slots/available?salonId=${salonId}&date=${date}`);
    return response.data;
  },

  async updateFavoriteSalon(salonId) {
    const response = await api.patch('/customer/favorite-salon', { salonId });
    return response.data;
  },

  async addFavoriteSalon(salonId) {
    const response = await api.post('/customer/favorite-salons', { salonId });
    return response.data;
  },

  async removeFavoriteSalon(salonId) {
    const response = await api.delete(`/customer/favorite-salons/${salonId}`);
    return response.data;
  },

  async getFavoriteSalons() {
    const response = await api.get('/customer/favorite-salons');
    return response.data;
  },

  async getRecentSalons() {
    const response = await api.get('/customer/recent-salons');
    return response.data;
  },

  // Addon functionality
  async detectIdleSlots(salonId, date, staffId = null) {
    let url = `/addon/idle-slots?salonId=${salonId}&date=${date}`;
    if (staffId) {
      url += `&staffId=${staffId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  async getCustomerHistory(customerId, salonId) {
    const response = await api.get(`/addon/customer-history?customerId=${customerId}&salonId=${salonId}`);
    return response.data;
  },

  async predictAddonAcceptance(predictionData) {
    const response = await api.post('/addon/predict', predictionData);
    return response.data;
  },

  async calculateCommission(commissionData) {
    const response = await api.post('/addon/calculate-commission', commissionData);
    return response.data;
  },

  async cancelBooking(appointmentId, cancellationData) {
    const response = await api.patch(`/customer/bookings/${appointmentId}/cancel`, cancellationData);
    return response.data;
  },

  async getSalonServices(salonId, params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`/service/salon/${salonId}${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salon services:', error);
      throw error;
    }
  }

};

export default customerService;
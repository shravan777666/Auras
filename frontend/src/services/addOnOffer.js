import api from './api';

export const addOnOfferService = {
  // Create a new add-on offer
  async createOffer(offerData) {
    try {
      const response = await api.post('/addon-offers', offerData);
      return response.data;
    } catch (error) {
      console.error('Error creating add-on offer:', error);
      throw error;
    }
  },

  // Get all add-on offers for the salon
  async getOffers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/addon-offers?${queryString}` : '/addon-offers';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching add-on offers:', error);
      throw error;
    }
  },

  // Get a specific add-on offer by ID
  async getOfferById(id) {
    try {
      const response = await api.get(`/addon-offers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching add-on offer:', error);
      throw error;
    }
  },

  // Update an add-on offer
  async updateOffer(id, updates) {
    try {
      const response = await api.put(`/addon-offers/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating add-on offer:', error);
      throw error;
    }
  },

  // Toggle offer active status
  async toggleOfferStatus(id) {
    try {
      const response = await api.patch(`/addon-offers/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling add-on offer status:', error);
      throw error;
    }
  },

  // Delete an add-on offer
  async deleteOffer(id) {
    try {
      const response = await api.delete(`/addon-offers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting add-on offer:', error);
      throw error;
    }
  },

  // Get active offers for customers (public)
  async getActiveOffers(salonId) {
    try {
      const response = await api.get(`/addon-offers/public/${salonId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active offers:', error);
      throw error;
    }
  },

  // Create addon sales records after payment
  async createAddonSales(appointmentId, selectedOffers) {
    try {
      const response = await api.post('/addon-offers/sales/create', {
        appointmentId,
        selectedOffers
      });
      return response.data;
    } catch (error) {
      console.error('Error creating addon sales:', error);
      throw error;
    }
  }
};

export default addOnOfferService;

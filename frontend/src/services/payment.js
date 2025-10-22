import api from './api';

export const paymentService = {
  async createPaymentOrder(appointmentId) {
    try {
      const response = await api.post('/payment/create-order', { appointmentId });
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  },

  async verifyPayment(paymentData) {
    try {
      const response = await api.post('/payment/verify-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  async handlePaymentFailure(failureData) {
    try {
      const response = await api.post('/payment/payment-failure', failureData);
      return response.data;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }
};

export default paymentService;
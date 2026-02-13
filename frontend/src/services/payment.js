import api from './api';

export const paymentService = {
  async createPaymentOrder(appointmentId) {
    try {
      console.log('Creating payment order for appointment:', appointmentId);
      
      // Validate appointmentId
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      // Check if user is logged in
      const token = localStorage.getItem('auracare_token');
      if (!token) {
        throw new Error('Please login to continue with payment');
      }

      const response = await api.post('/payment/create-order', { appointmentId });
      console.log('Payment order created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      console.error('Error response:', error.response?.data);
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create this payment order.');
      } else if (error.response?.status === 404) {
        throw new Error('Appointment not found. Please try again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to create payment order. Please try again.');
      }
    }
  },

  async verifyPayment(paymentData) {
    try {
      console.log('Verifying payment:', paymentData);
      const response = await api.post('/payment/verify-payment', paymentData);
      console.log('Payment verified successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to verify payment. Please contact support.');
      }
    }
  },

  async handlePaymentFailure(failureData) {
    try {
      console.log('Handling payment failure:', failureData);
      const response = await api.post('/payment/payment-failure', failureData);
      return response.data;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }
};

export default paymentService;
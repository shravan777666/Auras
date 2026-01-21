import api from './api';

const giftCardService = {
  // Create a new gift card
  createGiftCard: async (giftCardData) => {
    try {
      const response = await api.post('/gift-card/salon', giftCardData);
      return response.data;
    } catch (error) {
      console.error('Error creating gift card:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Bulk create gift cards
  bulkCreateGiftCards: async (bulkData) => {
    try {
      const response = await api.post('/gift-card/salon/bulk', bulkData);
      return response.data;
    } catch (error) {
      console.error('Error bulk creating gift cards:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to bulk create gift cards');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get all gift cards for the salon owner
  getGiftCards: async (params = {}) => {
    try {
      const response = await api.get('/gift-card/salon', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift cards');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get a specific gift card by ID
  getGiftCardById: async (giftCardId) => {
    try {
      const response = await api.get(`/gift-card/salon/${giftCardId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Update a gift card
  updateGiftCard: async (giftCardId, updateData) => {
    try {
      const response = await api.put(`/gift-card/salon/${giftCardId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to update gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Deactivate a gift card
  deleteGiftCard: async (giftCardId) => {
    try {
      const response = await api.delete(`/gift-card/salon/${giftCardId}`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to deactivate gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get active gift cards for a specific salon (for customers)
  getActiveGiftCards: async (salonId) => {
    try {
      const response = await api.get(`/gift-card/customer/salon/${salonId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active gift cards:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch active gift cards');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get active gift cards for a specific salon (public endpoint - no auth required)
  getPublicActiveGiftCards: async (salonId) => {
    try {
      const response = await api.get(`/gift-card/public/salon/${salonId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public active gift cards:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch public gift cards');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Redeem a gift card
  redeemGiftCard: async (code, salonId, amount = null) => {
    try {
      const payload = { code, salonId };
      if (amount) {
        payload.amount = amount;
      }
      
      const response = await api.post('/gift-card/customer/redeem', payload);
      return response.data;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to redeem gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Validate a gift card (check if valid without redeeming)
  validateGiftCard: async (code, salonId) => {
    try {
      const response = await api.post('/gift-card/customer/validate', { code, salonId });
      return response.data;
    } catch (error) {
      console.error('Error validating gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to validate gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get gift card by code
  getGiftCardByCode: async (code) => {
    try {
      const response = await api.get(`/gift-card/code/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card by code:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card by code');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Generate preview for gift card (client-side simulation)
  generateGiftCardPreview: (formData) => {
    // This is a client-side helper function to preview what the gift card will look like
    // before actually creating it
    
    const previewData = {
      name: formData.name || 'Sample Gift Card',
      amount: parseFloat(formData.amount) || 0,
      code: formData.code || 'AURA-XXXXXX', // Placeholder for preview
      expiryDate: formData.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      usageType: formData.usageType || 'BOTH',
      description: formData.description || '',
      termsAndConditions: formData.termsAndConditions || '',
      status: 'ACTIVE',
      balance: parseFloat(formData.amount) || 0,
      createdAt: new Date().toISOString(),
      createdBy: {
        name: 'Current User',
        email: 'user@example.com'
      }
    };

    return {
      success: true,
      data: previewData,
      message: 'Gift card preview generated successfully',
      isPreview: true
    };
  },

  // Export gift cards data (for reporting)
  exportGiftCards: async (params = {}) => {
    try {
      const response = await api.get('/gift-card/salon/export', { 
        params,
        responseType: 'blob' // Important for file downloads
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting gift cards:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to export gift cards');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Send gift card via email (if backend supports this)
  sendGiftCardEmail: async (giftCardId, recipientEmail, personalMessage = '') => {
    try {
      const response = await api.post(`/gift-card/salon/${giftCardId}/send-email`, {
        recipientEmail,
        personalMessage
      });
      return response.data;
    } catch (error) {
      console.error('Error sending gift card email:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to send gift card email');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Update gift card balance (partial redemption or top-up)
  updateGiftCardBalance: async (giftCardId, newBalance) => {
    try {
      const response = await api.patch(`/gift-card/salon/${giftCardId}/balance`, {
        balance: newBalance
      });
      return response.data;
    } catch (error) {
      console.error('Error updating gift card balance:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to update gift card balance');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get gift card statistics
  getGiftCardStats: async (params = {}) => {
    try {
      const response = await api.get('/gift-card/salon/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card stats:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card statistics');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Reactivate a gift card
  reactivateGiftCard: async (giftCardId) => {
    try {
      const response = await api.post(`/gift-card/salon/${giftCardId}/reactivate`);
      return response.data;
    } catch (error) {
      console.error('Error reactivating gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to reactivate gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get gift card usage history
  getGiftCardHistory: async (giftCardId) => {
    try {
      const response = await api.get(`/gift-card/salon/${giftCardId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card history:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card history');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Purchase a gift card (for customers)
  purchaseGiftCard: async (purchaseData) => {
    try {
      const response = await api.post('/gift-card/customer/purchase', purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error purchasing gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to purchase gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get a specific gift card template by ID (for customers)
  getGiftCardTemplateById: async (giftCardId) => {
    try {
      const response = await api.get(`/gift-card/customer/template/${giftCardId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card template:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card template');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get gift cards owned by the authenticated customer
  getMyGiftCards: async () => {
    try {
      const response = await api.get('/gift-card/customer/my-gift-cards');
      return response.data;
    } catch (error) {
      console.error('Error fetching my gift cards:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch my gift cards');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Create payment order for gift card purchase
  createPaymentOrder: async (orderData) => {
    try {
      const response = await api.post('/gift-card/customer/payment-order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create payment order');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Verify payment and complete gift card purchase
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/gift-card/customer/verify-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to verify payment');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get gift card recipients for the salon
  getRecipients: async () => {
    try {
      const response = await api.get('/gift-card-recipients');
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card recipients:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card recipients');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get filtered gift card recipients
  getFilteredRecipients: async (params = {}) => {
    try {
      const response = await api.get('/gift-card-recipients/filtered', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered gift card recipients:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch filtered gift card recipients');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Get gift card recipients statistics
  getRecipientsStats: async () => {
    try {
      const response = await api.get('/gift-card-recipients/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching gift card recipients stats:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to fetch gift card recipients statistics');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Verify gift card by code (Salon Owner)
  verifyGiftCardByCode: async (code) => {
    try {
      const response = await api.post('/gift-card/salon/verify-code', { code });
      return response.data;
    } catch (error) {
      console.error('Error verifying gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to verify gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  },

  // Redeem gift card by code (Salon Owner)
  redeemGiftCardByCode: async (code, amount = null, notes = null) => {
    try {
      const payload = { code };
      if (amount !== null && amount > 0) {
        payload.amount = amount;
      }
      if (notes) {
        payload.notes = notes;
      }
      
      const response = await api.post('/gift-card/salon/redeem-code', payload);
      return response.data;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to redeem gift card');
      } else if (error.request) {
        console.error('Request error:', error.request);
        throw new Error('Network error. Please check your connection.');
      } else {
        throw error;
      }
    }
  }

};

export default giftCardService;
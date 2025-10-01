import { api } from './api';

class ClientProfileService {
  // Get all client profiles for salon
  async getClientProfiles(params = {}) {
    try {
      const response = await api.get('/client-profiles', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching client profiles:', error);
      throw error;
    }
  }

  // Get specific client profile
  async getClientProfile(customerId) {
    try {
      const response = await api.get(`/client-profiles/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      throw error;
    }
  }

  // Update internal notes
  async updateInternalNotes(customerId, notesData) {
    try {
      const response = await api.put(`/client-profiles/${customerId}/notes`, notesData);
      return response.data;
    } catch (error) {
      console.error('Error updating internal notes:', error);
      throw error;
    }
  }

  // Delete internal note
  async deleteInternalNote(customerId, noteId) {
    try {
      const response = await api.delete(`/client-profiles/${customerId}/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting internal note:', error);
      throw error;
    }
  }

  // Update preferred services
  async updatePreferredServices(customerId, preferredServices) {
    try {
      const response = await api.put(`/client-profiles/${customerId}/preferred-services`, {
        preferredServices
      });
      return response.data;
    } catch (error) {
      console.error('Error updating preferred services:', error);
      throw error;
    }
  }

  // Get conversation messages
  async getConversation(customerId, params = {}) {
    try {
      const response = await api.get(`/client-profiles/${customerId}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(customerId, messageData) {
    try {
      const response = await api.post(`/client-profiles/${customerId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Add internal note
  async addInternalNote(customerId, note, category = 'general') {
    try {
      const response = await api.put(`/client-profiles/${customerId}/notes`, {
        generalNote: note,
        noteCategory: category
      });
      return response.data;
    } catch (error) {
      console.error('Error adding internal note:', error);
      throw error;
    }
  }

  // Update allergies
  async updateAllergies(customerId, allergies) {
    try {
      const response = await api.put(`/client-profiles/${customerId}/notes`, {
        allergies
      });
      return response.data;
    } catch (error) {
      console.error('Error updating allergies:', error);
      throw error;
    }
  }

  // Update personal preferences
  async updatePersonalPreferences(customerId, personalPreferences) {
    try {
      const response = await api.put(`/client-profiles/${customerId}/notes`, {
        personalPreferences
      });
      return response.data;
    } catch (error) {
      console.error('Error updating personal preferences:', error);
      throw error;
    }
  }

  // Update rebooking status
  async updateRebookingStatus(customerId, rebookingStatus) {
    try {
      const response = await api.put(`/client-profiles/${customerId}/notes`, {
        rebookingStatus
      });
      return response.data;
    } catch (error) {
      console.error('Error updating rebooking status:', error);
      throw error;
    }
  }
}

export const clientProfileService = new ClientProfileService();
export default clientProfileService;

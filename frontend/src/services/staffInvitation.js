import api from './api';

export const staffInvitationService = {
  async createInvitation(invitationData) {
    try {
      const response = await api.post('/staff-invitations', invitationData);
      return response.data;
    } catch (error) {
      console.error('Error creating staff invitation:', error);
      throw error;
    }
  },

  async getPendingInvitations() {
    try {
      const response = await api.get('/staff-invitations');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  },

  async acceptInvitation(invitationId) {
    try {
      const response = await api.post(`/staff-invitations/${invitationId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  async declineInvitation(invitationId) {
    try {
      const response = await api.post(`/staff-invitations/${invitationId}/decline`);
      return response.data;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }
};
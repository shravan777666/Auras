import api from './api'

export const authService = {
  // Authentication
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error (continuing anyway):', error)
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('auracare_token')
      localStorage.removeItem('auracare_user')
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response
  },

  // Password Reset
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response
  },

  async verifyOTP(email, otp) {
    const response = await api.post('/auth/verify-otp', { email, otp })
    return response
  },

  async resetPassword(email, otp, newPassword) {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
      confirmPassword: newPassword
    })
    return response
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    })
    return response
  },

  // Token refresh
  async refreshToken() {
    try {
      // Get current token from localStorage
      const currentToken = localStorage.getItem('auracare_token');
      
      if (!currentToken) {
        throw new Error('No token available for refresh');
      }
      
      // Send the current token as part of the refresh request
      const response = await api.post('/auth/refresh-token', { refreshToken: currentToken });
      return response
    } catch (error) {
      // If refresh fails, logout the user
      this.logout()
      throw error
    }
  }
}
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
    return api.post('/auth/logout')
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
  }
}
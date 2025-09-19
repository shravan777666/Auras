import axios from 'axios'
import toast from 'react-hot-toast'

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV
});

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auracare_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug logging for admin dashboard requests
    if (config.url.includes('admin/dashboard/stats')) {
      console.log('🚀 Making dashboard stats request:', {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: config.baseURL + config.url,
        hasToken: !!token
      });
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {  
    return response
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'

    if (error.response?.status === 401) {
      localStorage.removeItem('auracare_token')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      toast.error('Access denied')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
import axios from 'axios'
import toast from 'react-hot-toast'

// Base API configuration - Using actual backend port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
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
      console.log('🔐 Token added to request:', config.url);
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    
    // If sending FormData, let the browser set Content-Type with boundary
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
    if (isFormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
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
    console.log('✅ API Response received:', response.config.url, response.status);
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });

    const message = error.response?.data?.message || 'An error occurred'

    if (error.response?.status === 401) {
      localStorage.removeItem('auracare_token')
      localStorage.removeItem('auracare_user')
      toast.error('Session expired. Please login again.')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
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
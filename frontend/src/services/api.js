import axios from 'axios'
import toast from 'react-hot-toast'
import { authService } from './auth'

// Base API configuration - Using actual backend port (5007 to match Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5011/api';
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL
});

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already refreshing token to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  })
  
  failedQueue = [];
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data
    });
    
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
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Explicitly log the detailed error response from the backend for debugging
    if (error.response?.data) {
      console.error('❌ Detailed API Error Body:', JSON.stringify(error.response.data, null, 2));
    }

    const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred'

    const AUTH_ROUTES = [
      '/auth/login',
      '/auth/register',
...
      '/auth/refresh-token'
    ];

    // If token expired, not a retry, and not an auth route
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !AUTH_ROUTES.some(route => originalRequest.url.includes(route))
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        })
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await authService.refreshToken();
        const { token } = response.data.data;
        
        // Store new token
        localStorage.setItem('auracare_token', token);
        
        // Process queued requests
        processQueue(null, token);
        
        // Retry original request with new token
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('auracare_token');
        localStorage.removeItem('auracare_user');
        
        // More specific handling for different 401 error messages
        if (message.includes('Session expired')) {
          toast.error('Your session has expired. Please login again.');
        } else if (message.includes('Invalid token')) {
          toast.error('Your login session is invalid. Please login again.');
        } else if (message.includes('No token provided')) {
          toast.error('Authentication required. Please login.');
        } else {
          toast.error('Session expired. Please login again.');
        }
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && !AUTH_ROUTES.some(route => originalRequest.url.includes(route))) {
      // Non-expiration 401 error
      localStorage.removeItem('auracare_token')
      localStorage.removeItem('auracare_user')
      
      if (message.includes('Session expired')) {
        toast.error('Your session has expired. Please login again.');
      } else if (message.includes('Invalid token')) {
        toast.error('Your login session is invalid. Please login again.');
      } else if (message.includes('No token provided')) {
        toast.error('Authentication required. Please login.');
      } else {
        toast.error('Session expired. Please login again.');
      }
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied: ' + message)
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

// Export both as default and named export for compatibility
export { api };
export default api;
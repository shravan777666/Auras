import axios from 'axios'
import toast from 'react-hot-toast'
import { authService } from './auth'

// Check if we're in production mode
const isProduction = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';

// Base API configuration - More robust handling for production vs development
let API_BASE_URL = 'http://localhost:5011/api'; // Default fallback

// Check for VITE_API_URL first
if (import.meta.env.VITE_API_URL) {
  API_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
  console.log('🔧 Using VITE_API_URL:', API_BASE_URL);
} 
// Check if we're in production and use the Render backend URL
else if (isProduction) {
  API_BASE_URL = 'https://auracare-backend.onrender.com/api';
  console.log('🔧 Using production default URL:', API_BASE_URL);
} 
// Otherwise use development fallback
else {
  console.log('🔧 Using development fallback URL:', API_BASE_URL);
}

console.log('🔧 API Base URL:', API_BASE_URL);

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
    // Only log non-silent requests
    if (!config.silent) {
      console.log('🚀 Making API request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullURL: `${config.baseURL}${config.url}`
      });
    }
    
    const token = localStorage.getItem('auracare_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      if (!config.silent) {
        console.log('🔐 Token added to request:', config.url);
      }
    } else if (!config.silent && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
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
    // Only log non-silent requests
    if (!response.config.silent) {
      console.log('✅ API Response received:', response.config.url, response.status);
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config;

    // Only log errors for non-silent requests
    if (!error.config?.silent) {
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
    }

    const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred'

    const AUTH_ROUTES = [
      '/auth/login',
      '/auth/register',
      '/auth/logout',
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

    // Check if this is a silent request (like auth check)
    const isSilentRequest = originalRequest.silent === true;
    
    if (error.response?.status === 401 && !AUTH_ROUTES.some(route => originalRequest.url.includes(route))) {
      // Non-expiration 401 error
      localStorage.removeItem('auracare_token')
      localStorage.removeItem('auracare_user')
      
      // Don't show toast for silent requests (auth checks)
      if (!isSilentRequest) {
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
      }
    } else if (error.response?.status === 403) {
      if (!isSilentRequest) {
        toast.error('Access denied: ' + message)
      }
    } else if (error.response?.status >= 500) {
      if (!isSilentRequest) {
        toast.error('Server error. Please try again later.')
      }
    } else {
      // Don't show generic errors for silent requests
      if (!isSilentRequest) {
        toast.error(message)
      }
    }

    return Promise.reject(error)
  }
)

// Export both as default and named export for compatibility
export { api };
export default api;
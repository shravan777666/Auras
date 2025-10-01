import api from './api';
import { cacheService } from './cache';

// Request debouncing to prevent rapid successive calls
const pendingRequests = new Map();

const debounceRequest = async (key, requestFn) => {
  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    console.log('Request already pending:', key);
    return pendingRequests.get(key);
  }

  // Create new request promise
  const requestPromise = requestFn().finally(() => {
    // Clean up pending request when done
    pendingRequests.delete(key);
  });

  // Store pending request
  pendingRequests.set(key, requestPromise);
  return requestPromise;
};

export const recommendationService = {
  // Get recent clients who have taken appointments
  async getRecentClients() {
    const cacheKey = cacheService.generateKey('/recommendations/recent');
    
    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Debounce request
    return debounceRequest(cacheKey, async () => {
      const response = await api.get('/recommendations/recent');
      const data = response.data;
      
      // Cache the response
      cacheService.set(cacheKey, data);
      return data;
    });
  },

  // Get all clients
  async getClients() {
    const cacheKey = cacheService.generateKey('/recommendations/clients');
    
    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Debounce request
    return debounceRequest(cacheKey, async () => {
      const response = await api.get('/recommendations/clients');
      const data = response.data;
      
      // Cache the response
      cacheService.set(cacheKey, data);
      return data;
    });
  },

  // Get recommendations for a specific client
  async getClientRecommendations(clientId) {
    const cacheKey = cacheService.generateKey(`/recommendations/client/${clientId}`);
    
    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Debounce request
    return debounceRequest(cacheKey, async () => {
      const response = await api.get(`/recommendations/client/${clientId}`);
      const data = response.data;
      
      // Cache the response
      cacheService.set(cacheKey, data);
      return data;
    });
  },

  // Send recommendations to a client (don't cache POST requests)
  async sendRecommendations(clientId, recommendations) {
    const response = await api.post('/recommendations/send', {
      clientId,
      recommendations
    });
    
    // Clear related cache entries after sending
    const clientCacheKey = cacheService.generateKey(`/recommendations/client/${clientId}`);
    cacheService.delete(clientCacheKey);
    
    return response.data;
  },

  // Clear all cache (useful for refresh)
  clearCache() {
    cacheService.clear();
  }
};
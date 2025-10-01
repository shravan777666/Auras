// Simple in-memory cache service to prevent repeated API calls
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Generate cache key
  generateKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}${paramString ? '?' + paramString : ''}`;
  }

  // Check if cache is valid
  isValid(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Get from cache
  get(key) {
    if (this.isValid(key)) {
      console.log('🎯 Cache HIT:', key);
      return this.cache.get(key);
    }
    console.log('❌ Cache MISS:', key);
    return null;
  }

  // Set cache
  set(key, data) {
    console.log('💾 Cache SET:', key);
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    console.log('🗑️ Cache cleared');
  }

  // Clear specific key
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log('🗑️ Cache deleted:', key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();

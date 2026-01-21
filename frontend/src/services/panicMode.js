import api from './api';

export const panicModeService = {
  /**
   * Find nearby salons with real-time availability based on customer location
   */
  async findNearestAvailableSalon(latitude, longitude, radius = 5) {
    const response = await api.post('/customer/panic-mode', {
      location: {
        latitude,
        longitude
      },
      radius: radius // in kilometers
    });
    return response.data;
  },

  /**
   * Capture customer's current location using browser geolocation API
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 60000 // 1 minute
        }
      );
    });
  }
};

export default panicModeService;
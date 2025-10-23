// Test the frontend API service
import api from './frontend/src/services/api.js';

const testFrontendAPI = async () => {
  try {
    console.log('Testing frontend API service...');
    
    // Check if we have a token
    const token = localStorage.getItem('auracare_token');
    console.log('Token available:', !!token);
    
    if (token) {
      console.log('Token length:', token.length);
    }
    
    // Test making a request (this will fail without auth, but we can see if the request is made)
    console.log('Making test request...');
    const response = await api.post('/expense-forecast/forecast', {});
    console.log('Frontend API Response:', response.data);
  } catch (error) {
    console.log('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

testFrontendAPI();
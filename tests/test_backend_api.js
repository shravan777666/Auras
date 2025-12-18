// Test the backend API endpoint
import axios from 'axios';

const testBackendAPI = async () => {
  try {
    console.log('Testing backend API endpoint...');
    
    // Test the expense forecast endpoint
    const response = await axios.post('http://localhost:5011/api/expense-forecast/forecast', {}, {
      headers: {
        // We're not including an auth token, so we expect a 401
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Backend API Response:', response.data);
  } catch (error) {
    console.log('Expected error (no auth token):', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('✓ Backend API endpoint exists and properly requires authentication');
    } else {
      console.log('✗ Unexpected error:', error.message);
    }
  }
};

testBackendAPI();
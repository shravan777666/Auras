// Simple test to verify authentication is working
import axios from 'axios';

// Test the expense forecast endpoint
const testExpenseForecast = async () => {
  try {
    // First, let's try to get a real token by logging in
    // You would need to replace these with actual credentials
    const loginResponse = await axios.post('http://localhost:5011/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Got token:', token);
    
    // Now test the expense forecast endpoint
    const forecastResponse = await axios.post(
      'http://localhost:5011/api/expense-forecast/forecast',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Forecast response:', forecastResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testExpenseForecast();
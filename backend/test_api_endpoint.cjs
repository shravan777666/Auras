// Test the actual API endpoint with our approved test user
const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('=== Testing API Endpoint ===');
    
    // Login with our approved test user
    console.log('Logging in with approved user...');
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'api-test-salon@example.com',
      password: 'ApiTest@123',
      userType: 'salon'
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data.token;
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 50) + '...');
      
      // Now test the schedule requests endpoint
      console.log('\n=== Testing schedule requests endpoint ===');
      const response = await axios.get('http://localhost:5003/api/schedule-requests/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('No token in response');
    }
    
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('Network Error:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testAPIEndpoint();
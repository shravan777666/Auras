// Test that simulates exactly what the frontend does
const axios = require('axios');

async function testFrontendSimulation() {
  try {
    console.log('=== Frontend Simulation Test ===');
    
    // Step 1: Login as Shravan (we'll need to find the correct password)
    console.log('\nStep 1: Attempting to login...');
    
    // Let's try a common test password
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'shravan@gmail.com',
      password: 'Test@123', // Common test password
      userType: 'salon'
    });
    
    console.log('Login successful!');
    const token = loginResponse.data.data.token;
    console.log('Token obtained');
    
    // Step 2: Call the schedule requests endpoint
    console.log('\nStep 2: Calling schedule requests endpoint...');
    const response = await axios.get('http://localhost:5003/api/schedule-requests/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('\n=== API Error Details ===');
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      // If it's a password error, let's try to understand what's happening
      if (error.response.status === 401 && error.response.data.message.includes('password')) {
        console.log('\n=== Password Issue Analysis ===');
        console.log('The password might be different than expected.');
        console.log('This is likely why the frontend shows empty results - authentication is failing.');
      }
    } else {
      console.error('Network Error:', error.message);
    }
  }
}

testFrontendSimulation();
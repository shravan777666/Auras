const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugToken() {
  try {
    console.log('=== Debugging Token ===');
    
    // First, login to get a real token
    console.log('\n1. Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5006/api/auth/login', {
      email: 'api-test-salon@example.com',
      password: 'ApiTest@123',
      userType: 'salon'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token);
    
    // Decode the token to see its payload
    console.log('\n2. Decoding token...');
    try {
      const decoded = jwt.decode(token);
      console.log('Decoded token payload:', decoded);
    } catch (decodeErr) {
      console.error('❌ Failed to decode token:', decodeErr.message);
    }
    
    // Try to refresh the token
    console.log('\n3. Testing refresh token endpoint...');
    try {
      const refreshResponse = await axios.post('http://localhost:5006/api/auth/refresh-token', {
        refreshToken: token
      });
      
      console.log('✅ Refresh token successful');
      const newToken = refreshResponse.data.data.token;
      console.log('New token:', newToken);
      
      // Try to verify the new token
      try {
        const secret = '86ed8b0db49bca766733daa44efefd552f6282642483b72ef2ee389ea057a754e4839c1a0ebdc0b0e9fd397d8eb20bdfa2293d975002cb10a89256fa1c8b4d95';
        const newVerified = jwt.verify(newToken, secret);
        console.log('✅ New token verification successful');
        console.log('New verified payload:', newVerified);
      } catch (newVerifyErr) {
        console.error('❌ New token verification failed:', newVerifyErr.message);
      }
    } catch (refreshErr) {
      console.error('❌ Refresh token failed:', refreshErr.message);
      if (refreshErr.response) {
        console.error('Response data:', refreshErr.response.data);
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

debugToken();
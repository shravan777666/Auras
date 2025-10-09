// Test login with our new test accounts
const axios = require('axios');

async function testLogin() {
  try {
    console.log('=== Testing Login ===');
    
    // Test 1: Login as test salon owner
    console.log('\n1. Testing salon owner login...');
    const salonLoginResponse = await axios.post('http://localhost:5007/api/auth/login', {
      email: 'api-test-salon@example.com',
      password: 'ApiTest@123',
      userType: 'salon'
    });
    
    console.log('✅ Salon owner login successful');
    const salonToken = salonLoginResponse.data.data.token;
    console.log('Token length:', salonToken.length);
    
    // Test the refresh token endpoint
    console.log('\n2. Testing refresh token endpoint...');
    const refreshTokenResponse = await axios.post('http://localhost:5007/api/auth/refresh-token', {
      refreshToken: salonToken
    });
    
    console.log('✅ Refresh token successful');
    const newToken = refreshTokenResponse.data.data.token;
    console.log('New token length:', newToken.length);
    
    // Test the me endpoint with new token
    console.log('\n3. Testing me endpoint with new token...');
    const meResponse = await axios.get('http://localhost:5007/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('Me endpoint response:', JSON.stringify(meResponse.data, null, 2));
    
    // Test the schedule requests endpoint with new token
    console.log('\n4. Testing schedule requests endpoint with new token...');
    const scheduleResponse = await axios.get('http://localhost:5007/api/schedule-requests/pending', {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('Schedule requests response:', JSON.stringify(scheduleResponse.data, null, 2));
    
    // Test 2: Login as test staff
    console.log('\n5. Testing staff login...');
    const staffLoginResponse = await axios.post('http://localhost:5007/api/auth/login', {
      email: 'staff@test.com',
      password: 'password123',
      userType: 'staff'
    });
    
    console.log('✅ Staff login successful');
    const staffToken = staffLoginResponse.data.data.token;
    console.log('Token length:', staffToken.length);
    
    console.log('\n🎉 All tests passed! You can use these credentials:');
    console.log('\nSalon Owner:');
    console.log('  Email: api-test-salon@example.com');
    console.log('  Password: ApiTest@123');
    console.log('  User Type: salon');
    
    console.log('\nStaff:');
    console.log('  Email: staff@test.com');
    console.log('  Password: password123');
    console.log('  User Type: staff');
    
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

testLogin();
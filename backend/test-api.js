import axios from 'axios';

async function testAPI() {
  try {
    console.log('Testing backend API...');
    
    // Test root endpoint
    const rootResponse = await axios.get('http://localhost:5011/');
    console.log('Root endpoint response:', rootResponse.data);
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5011/health');
    console.log('Health endpoint response:', healthResponse.data);
    
    // Test API routes (unauthenticated)
    try {
      const authResponse = await axios.get('http://localhost:5011/api/auth/me');
      console.log('Auth endpoint response:', authResponse.data);
    } catch (error) {
      console.log('Auth endpoint (expected to fail without token):', error.response?.data || error.message);
    }
    
    console.log('✅ API tests completed successfully');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAPI();
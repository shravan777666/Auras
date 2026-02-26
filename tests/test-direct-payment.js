const axios = require('axios');

async function testGiftCardPaymentDirect() {
  try {
    console.log('=== Direct Gift Card Payment Test ===');
    
    // Use a known working token (you'll need to get this from a successful login)
    // For now, let's simulate the flow
    
    // Step 1: Login to get fresh token
    console.log('\n1. Getting fresh authentication token...');
    const loginResponse = await axios.post('http://localhost:5011/api/auth/login', {
      email: 'customer@test.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Got token:', token.substring(0, 20) + '...');

    // Step 2: Test direct gift card payment order request
    console.log('\n2. Testing gift card payment order with token...');
    
    const testData = {
      giftCardId: '678d3c5b4c4512295497e3a9', // Placeholder - will fail validation but should pass auth
      recipientEmail: 'test@example.com',
      personalMessage: 'Test message',
      salonId: '678d3c5b4c4512295497e3a8' // Placeholder
    };

    console.log('Making request with headers:');
    console.log('- Content-Type: application/json');
    console.log('- Authorization: Bearer [token]');
    
    const response = await axios.post(
      'http://localhost:5011/api/gift-card/customer/payment-order',
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Request successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Check if it's a network/timeout error
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timed out');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - backend might not be running');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 Host not found');
    }
  }
}

testGiftCardPaymentDirect();
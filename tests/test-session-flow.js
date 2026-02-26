const axios = require('axios');

// Create an axios instance that will maintain cookies/sessions
const api = axios.create({
  baseURL: 'http://localhost:5011/api',
  withCredentials: true, // This enables cookie/session handling
});

async function testCompleteFlowWithSession() {
  try {
    console.log('=== Testing Complete Gift Card Flow with Session ===');
    
    // Login to establish session
    console.log('\n1. Logging in to establish session...');
    const loginResponse = await api.post('/auth/login', {
      email: 'customer@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Logged in and session established');

    // Create payment order with the same session
    console.log('\n2. Creating payment order...');
    const orderResponse = await api.post('/gift-card/customer/payment-order', {
      giftCardId: '696f31f94c3ae1e26ded21e1',
      recipientEmail: 'test@example.com',
      personalMessage: 'Test message',
      salonId: '68cceb54faf3e420e3dae255'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Payment order created');
    console.log('Order ID:', orderResponse.data.data.orderId);

    // Verify payment with the same session (should work now)
    console.log('\n3. Verifying payment with same session...');
    const verifyResponse = await api.post('/gift-card/customer/verify-payment', {
      razorpay_order_id: orderResponse.data.data.orderId,
      razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
      razorpay_signature: 'mock_signature_for_dev',
      orderId: orderResponse.data.data.orderId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Payment verification successful!');
    console.log('Gift card purchased:', verifyResponse.data.data.giftCard);

    console.log('\n🎉 Complete flow test PASSED!');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompleteFlowWithSession();
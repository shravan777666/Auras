const axios = require('axios');

async function testGiftCardVerificationFix() {
  try {
    console.log('=== Testing Gift Card Verification Fix ===');
    
    // Login to get token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5011/api/auth/login', {
      email: 'customer@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Got token');

    // Create payment order
    console.log('\n2. Creating payment order...');
    const orderResponse = await axios.post(
      'http://localhost:5011/api/gift-card/customer/payment-order',
      {
        giftCardId: '696f31f94c3ae1e26ded21e1',
        recipientEmail: 'test@example.com',
        personalMessage: 'Test message',
        salonId: '68cceb54faf3e420e3dae255'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Payment order created');
    console.log('Order ID:', orderResponse.data.data.orderId);

    // Test verification with mock signature (should now work)
    console.log('\n3. Testing verification with mock signature...');
    const verifyResponse = await axios.post(
      'http://localhost:5011/api/gift-card/customer/verify-payment',
      {
        razorpay_order_id: orderResponse.data.data.orderId,
        razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        razorpay_signature: 'mock_signature_for_dev',
        orderId: orderResponse.data.data.orderId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Verification successful!');
    console.log('Gift card purchased:', verifyResponse.data.data.giftCard);

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testGiftCardVerificationFix();
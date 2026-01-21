const axios = require('axios');

async function testGiftCardPaymentWithRealData() {
  try {
    console.log('=== Gift Card Payment Test with Real Data ===');
    
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

    // Step 2: Test gift card payment order with real data
    console.log('\n2. Testing gift card payment order with real gift card data...');
    
    const testData = {
      giftCardId: '696f31f94c3ae1e26ded21e1', // Real gift card ID from our test data
      recipientEmail: 'recipient@test.com',
      personalMessage: 'Happy Birthday!',
      salonId: '68cceb54faf3e420e3dae255' // Real salon ID from our test data
    };

    console.log('Test data:', testData);
    
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

    console.log('✅ Gift card payment order created successfully!');
    console.log('Response data:', response.data);

    // Step 3: Test the complete flow including payment verification
    console.log('\n3. Testing payment verification...');
    
    const verifyData = {
      razorpay_order_id: response.data.data.orderId,
      razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
      razorpay_signature: 'mock_signature_for_testing',
      orderId: response.data.data.orderId
    };

    const verifyResponse = await axios.post(
      'http://localhost:5011/api/gift-card/customer/verify-payment',
      verifyData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Payment verified successfully!');
    console.log('Verification response:', verifyResponse.data);

    console.log('\n🎉 Complete gift card payment flow test PASSED!');

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGiftCardPaymentWithRealData();
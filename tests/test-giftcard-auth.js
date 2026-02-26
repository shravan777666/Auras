const axios = require('axios');

async function testGiftCardPaymentWithAuth() {
  try {
    console.log('=== Testing Gift Card Payment with Authentication ===');
    
    // Step 1: Login to get authentication token
    console.log('\n1. Logging in as test customer...');
    const loginResponse = await axios.post('http://localhost:5011/api/auth/login', {
      email: 'customer@test.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');

    // Step 2: Find a gift card template to use for testing
    console.log('\n2. Finding gift card templates...');
    // First, we need to find a salon to get gift cards from
    const salonsResponse = await axios.get('http://localhost:5011/api/salon/public');
    const salons = salonsResponse.data.data.items;
    
    if (salons.length === 0) {
      console.log('❌ No salons found');
      return;
    }
    
    const testSalon = salons[0];
    console.log('Using salon:', testSalon.salonName || testSalon.name);
    
    // Get gift cards for this salon
    const giftCardsResponse = await axios.get(`http://localhost:5011/api/gift-card/public/salon/${testSalon._id}`);
    const giftCards = giftCardsResponse.data.data;
    
    if (giftCards.length === 0) {
      console.log('❌ No gift cards found for salon');
      return;
    }
    
    const testGiftCard = giftCards[0];
    console.log('Using gift card:', testGiftCard.name, `- ₹${testGiftCard.amount}`);

    // Step 3: Create payment order for gift card purchase
    console.log('\n3. Creating payment order...');
    const orderData = {
      giftCardId: testGiftCard._id,
      recipientEmail: 'recipient@test.com',
      personalMessage: 'Happy Birthday!',
      salonId: testSalon._id
    };

    console.log('Order data:', orderData);

    const orderResponse = await axios.post(
      'http://localhost:5011/api/gift-card/customer/payment-order',
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Payment order created successfully!');
    console.log('Order response:', orderResponse.data);

    // Step 4: Simulate payment verification (using mock data since we can't actually pay)
    console.log('\n4. Verifying payment (simulated)...');
    const verifyData = {
      razorpay_order_id: orderResponse.data.data.orderId,
      razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
      razorpay_signature: 'mock_signature_for_testing',
      orderId: orderResponse.data.data.orderId
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

testGiftCardPaymentWithAuth();
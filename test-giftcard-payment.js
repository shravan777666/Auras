const axios = require('axios');

async function testGiftCardPayment() {
  try {
    console.log('Testing gift card payment order creation...');
    
    // Test data - you'll need to adjust these values based on your actual data
    const testData = {
      giftCardId: '678d3c5b4c4512295497e3a9', // Replace with actual gift card ID
      recipientEmail: 'test@example.com',
      personalMessage: 'Happy Birthday!',
      salonId: '678d3c5b4c4512295497e3a8' // Replace with actual salon ID
    };

    console.log('Sending request to:', 'http://localhost:5011/api/gift-card/customer/payment-order');
    console.log('Request data:', testData);

    const response = await axios.post(
      'http://localhost:5011/api/gift-card/customer/payment-order',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Success! Response:', response.data);
  } catch (error) {
    console.error('Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('Full response:', error.response);
    }
  }
}

testGiftCardPayment();
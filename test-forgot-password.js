const axios = require('axios');

async function testForgotPassword() {
  try {
    const response = await axios.post('http://localhost:5010/api/forgot-password/request-reset', {
      email: 'customer1@gmail.com',
      userType: 'customer'
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testForgotPassword();
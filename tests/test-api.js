const axios = require('axios');

async function testApi() {
  try {
    const response = await axios.get('http://localhost:5009/api/admin/financial-summary/salon-performance');
    console.log('Salon Performance Data:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApi();
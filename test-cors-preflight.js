const axios = require('axios');

async function testCorsPreflight() {
  try {
    console.log('Testing CORS preflight request to https://auras.onrender.com/api/auth/login');
    
    // Test preflight request (OPTIONS)
    const response = await axios.options('https://auras.onrender.com/api/auth/login', {
      headers: {
        'Origin': 'https://auras-silk.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('Preflight response status:', response.status);
    console.log('Preflight response headers:', response.headers);
    
  } catch (error) {
    console.error('Preflight request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testCorsPreflight();
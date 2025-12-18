// Simple test to verify the next appointment endpoint is working
const http = require('http');

// Configuration
const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/staff/next-appointment',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token' // This will fail auth but let us see if the route exists
  }
};

console.log('Testing Next Appointment Endpoint...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    try {
      const data = JSON.parse(chunk);
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Raw Response:', chunk.toString());
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
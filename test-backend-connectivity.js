const https = require('https');

// Test the backend health endpoint
const options = {
  hostname: 'auras.onrender.com',
  port: 443,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing backend connectivity to https://auras.onrender.com/health');

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();
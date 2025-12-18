const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5011,
  path: '/api/salon/locations',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.end();
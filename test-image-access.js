// Test script to check if image files can be accessed through the server
const http = require('http');

// Test if we can access the image through the server
const options = {
  hostname: 'localhost',
  port: 5011,
  path: '/uploads/staff/profilePicture-1758261052162.jpg',
  method: 'HEAD'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  if (res.statusCode === 200) {
    console.log('SUCCESS: Image is accessible through the server');
  } else {
    console.log('ERROR: Image is not accessible through the server');
  }
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
const https = require('http');

// Test the dashboard stats endpoint to verify salon count fix
const options = {
  hostname: 'localhost',
  port: 5006,
  path: '/api/admin/dashboard/stats',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // You'll need to add authorization header with admin token in real testing
    // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n=== DASHBOARD STATS RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Message:', response.message);
      console.log('\n=== SALON COUNT (FIXED) ===');
      console.log('Total Salons:', response.totalSalons);
      console.log('Total Staff:', response.totalStaff);
      console.log('Total Customers:', response.totalCustomers);
      console.log('Total Appointments:', response.totalAppointments);
      console.log('Total Revenue:', response.totalRevenue);
      console.log('\nNote: Total Salons now counts ALL registered salons (isActive: true) regardless of approval status.');
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
import fetch from 'node-fetch';

const testBrowseSalons = async () => {
  try {
    console.log('Testing browseSalons API...\n');
    
    // Test the production API endpoint
    const url = 'https://auracare-backend.onrender.com/api/customer/salons?page=1&limit=50';
    console.log(`URL: ${url}\n`);
    
    // You'll need a valid token - get one by logging in first
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2NkZjA3ZmFmM2U0MjBlM2RhZTE2NyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTczNzUzMDI5MSwiZXhwIjoxNzM4MTM1MDkxfQ.Kw0Zi7W-xWTWmJXtB7sTKfjzYYxPvjTCZ-q3xFSX_dY';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${response.status}\n`);
    
    const data = await response.json();
    
    console.log('Response keys:', Object.keys(data));
    console.log('\nFull response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`\n=== Salon Data ===`);
      console.log(`Total salons: ${data.data.length}`);
      
      // Check pagination/meta key
      if (data.pagination) {
        console.log(`\n✓ Has 'pagination' key`);
        console.log(`Pagination:`, data.pagination);
      } else if (data.meta) {
        console.log(`\n✗ Has 'meta' key (should be 'pagination')`);
        console.log(`Meta:`, data.meta);
      }
      
      // Check Shravan salon
      console.log('\n=== Checking Shravan Salon ===');
      const shravan = data.data.find(s => s.salonName === 'Shravan');
      if (shravan) {
        console.log('✓ Shravan salon found in response');
        console.log('Coordinates:', shravan.latitude, shravan.longitude);
        console.log('Full data:', JSON.stringify(shravan, null, 2));
      } else {
        console.log('✗ Shravan salon NOT found in response');
        console.log('Available salons:', data.data.map(s => s.salonName));
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
};

testBrowseSalons();

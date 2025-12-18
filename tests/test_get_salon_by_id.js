/**
 * Test script for Get Salon By ID API endpoint
 * This script demonstrates how to use the get salon by ID endpoint
 */

// Import required modules
import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5009/api';
const ADMIN_TOKEN = 'your-admin-jwt-token-here';
const TEST_SALON_ID = 'test-salon-id';

// API client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
});

// Test function
async function testGetSalonById() {
  try {
    console.log('Testing Get Salon By ID API endpoint...\n');

    // Get salon by ID
    console.log('Testing /admin/salons/:id endpoint...');
    const response = await api.get(`/admin/salons/${TEST_SALON_ID}`);
    
    console.log('Salon Details:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetSalonById();
}

export { testGetSalonById };
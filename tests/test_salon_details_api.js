/**
 * Test script for Salon Details API endpoints
 * This script demonstrates how to use the salon details endpoints
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

// Test functions
async function testSalonDetails() {
  try {
    console.log('Testing Salon Details API endpoints...\n');

    // 1. Get salon financial data
    console.log('1. Testing /admin/salons/:id/financial-data endpoint...');
    const financialResponse = await api.get(`/admin/salons/${TEST_SALON_ID}/financial-data`, {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('Salon Financial Data:');
    console.log(JSON.stringify(financialResponse.data, null, 2));
    console.log('\n');

    // 2. Get salon revenue trend
    console.log('2. Testing /admin/salons/:id/revenue-trend endpoint...');
    const trendResponse = await api.get(`/admin/salons/${TEST_SALON_ID}/revenue-trend`, {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        period: 'monthly'
      }
    });
    
    console.log('Salon Revenue Trend:');
    console.log(JSON.stringify(trendResponse.data, null, 2));
    console.log('\n');

    // 3. Get salon expense breakdown
    console.log('3. Testing /admin/salons/:id/expense-breakdown endpoint...');
    const expenseResponse = await api.get(`/admin/salons/${TEST_SALON_ID}/expense-breakdown`, {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('Salon Expense Breakdown:');
    console.log(JSON.stringify(expenseResponse.data, null, 2));
    console.log('\n');

    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testSalonDetails();
}

export { testSalonDetails };
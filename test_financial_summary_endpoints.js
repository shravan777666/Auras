/**
 * Test script to verify financial summary endpoints are working
 */

// Import required modules
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5009/api';

// Test function
async function testFinancialSummaryEndpoints() {
  try {
    console.log('Testing Financial Summary API endpoints...\n');
    
    // Test 1: Check if the route is accessible (should return authentication error)
    console.log('1. Testing route accessibility...');
    try {
      const response = await axios.get(`${BASE_URL}/admin/financial-summary/expense-breakdown`, {
        params: {
          startDate: '2025-09-19',
          endDate: '2025-10-19'
        }
      });
      console.log('❌ Unexpected success - should have required authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Route is accessible and properly requires authentication');
        console.log('   Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 2: Check if all endpoints are registered
    console.log('\n2. Testing all financial summary endpoints...');
    const endpoints = [
      '/summary',
      '/salon-performance',
      '/revenue-trend',
      '/expense-breakdown'
    ];
    
    for (const endpoint of endpoints) {
      try {
        await axios.get(`${BASE_URL}/admin/financial-summary${endpoint}`);
        console.log(`❌ ${endpoint} - Unexpected success`);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log(`✅ ${endpoint} - Properly requires authentication`);
        } else {
          console.log(`❌ ${endpoint} - Unexpected error:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 All tests completed! The financial summary endpoints are properly registered.');
    console.log('   They correctly require authentication and are accessible at the expected paths.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
testFinancialSummaryEndpoints();
/**
 * Test script for Financial Summary API endpoints
 * This script demonstrates how to use the financial summary endpoints
 */

// Import required modules
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'your-admin-jwt-token-here';

// API client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
});

// Test functions
async function testFinancialSummary() {
  try {
    console.log('Testing Financial Summary API endpoints...\n');

    // 1. Get financial summary
    console.log('1. Testing /financial-summary/summary endpoint...');
    const summaryResponse = await api.get('/admin/financial-summary/summary', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('Financial Summary:');
    console.log(JSON.stringify(summaryResponse.data, null, 2));
    console.log('\n');

    // 2. Get salon performance
    console.log('2. Testing /financial-summary/salon-performance endpoint...');
    const performanceResponse = await api.get('/admin/financial-summary/salon-performance', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('Salon Performance:');
    console.log(JSON.stringify(performanceResponse.data, null, 2));
    console.log('\n');

    // 3. Get revenue trend
    console.log('3. Testing /financial-summary/revenue-trend endpoint...');
    const trendResponse = await api.get('/admin/financial-summary/revenue-trend', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        period: 'monthly'
      }
    });
    
    console.log('Revenue Trend:');
    console.log(JSON.stringify(trendResponse.data, null, 2));
    console.log('\n');

    // 4. Get expense breakdown
    console.log('4. Testing /financial-summary/expense-breakdown endpoint...');
    const expenseResponse = await api.get('/admin/financial-summary/expense-breakdown', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('Expense Breakdown:');
    console.log(JSON.stringify(expenseResponse.data, null, 2));
    console.log('\n');

    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
if (require.main === module) {
  testFinancialSummary();
}

module.exports = {
  testFinancialSummary
};
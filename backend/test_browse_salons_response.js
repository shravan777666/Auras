import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { paginatedResponse } from './utils/responses.js';

dotenv.config();

// Mock response object for testing
const mockRes = {
  status: (code) => {
    console.log(`Status Code: ${code}`);
    return {
      json: (data) => {
        console.log('\n=== Response Format Test ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('\n=== Verification ===');
        console.log(`✓ Has 'success' key: ${data.hasOwnProperty('success')}`);
        console.log(`✓ Has 'data' key: ${data.hasOwnProperty('data')}`);
        console.log(`✓ Has 'pagination' key: ${data.hasOwnProperty('pagination')}`);
        console.log(`✓ Has 'message' key: ${data.hasOwnProperty('message')}`);
        console.log(`✗ Has 'meta' key (should be false): ${data.hasOwnProperty('meta')}`);
        
        if (data.pagination) {
          console.log('\n=== Pagination Details ===');
          console.log(`  page: ${data.pagination.page}`);
          console.log(`  limit: ${data.pagination.limit}`);
          console.log(`  totalPages: ${data.pagination.totalPages}`);
          console.log(`  totalItems: ${data.pagination.totalItems}`);
        }
        return data;
      }
    };
  }
};

// Test data
const testSalons = [
  {
    _id: '507f1f77bcf86cd799439011',
    salonName: 'Test Salon 1',
    latitude: 12.9716,
    longitude: 77.5946,
    salonAddress: { city: 'Bangalore' }
  },
  {
    _id: '507f1f77bcf86cd799439012',
    salonName: 'Test Salon 2',
    latitude: 12.9800,
    longitude: 77.6000,
    salonAddress: { city: 'Bangalore' }
  }
];

const testMeta = {
  page: 1,
  limit: 50,
  totalPages: 1,
  totalItems: 2
};

console.log('Testing paginatedResponse format...\n');
paginatedResponse(mockRes, testSalons, testMeta);

console.log('\n=== Expected Format for Flutter App ===');
console.log('The response should have:');
console.log('  - success: true');
console.log('  - data: array of salons with latitude/longitude');
console.log('  - pagination: object with page, limit, totalPages, totalItems');
console.log('  - message: "Success"');
console.log('\n✓ Test complete!');

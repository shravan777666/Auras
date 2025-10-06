import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getNeedsAttentionAlerts } from './controllers/alertsController.js';
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

// Mock request and response objects for testing
const mockReq = {
  user: {
    id: 'test-user-id',
    type: 'salon'
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.body = data;
    return this;
  }
};

// Test function
async function testAlerts() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');
    
    // Call the function
    await getNeedsAttentionAlerts(mockReq, mockRes);
    
    // Output the result
    console.log('Status Code:', mockRes.statusCode);
    console.log('Response Body:', JSON.stringify(mockRes.body, null, 2));
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Test failed:', error);
    await mongoose.connection.close();
  }
}

// Run the test
testAlerts();
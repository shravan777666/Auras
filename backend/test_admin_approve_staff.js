import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import User from './models/User.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Mock response object for testing
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

// Mock asyncHandler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Import the approveStaff function
const { approveStaff } = await import('./controllers/adminController.js');

async function testApproveStaff() {
  try {
    console.log('=== Testing Staff Approval Function ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log('✅ Connected to MongoDB');
    
    // Find a staff member to approve (for testing purposes)
    const staff = await Staff.findOne({ approvalStatus: { $ne: 'approved' } });
    if (!staff) {
      console.log('⚠️ No unapproved staff members found for testing.');
      return;
    }
    
    console.log('Found staff member to approve:', {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      approvalStatus: staff.approvalStatus
    });
    
    // Mock request object
    const mockReq = {
      params: { staffId: staff._id.toString() },
      user: { id: 'admin-test-id' } // Mock admin user
    };
    
    // Call the approveStaff function
    console.log('Calling approveStaff function...');
    await approveStaff(mockReq, mockRes);
    
    console.log('✅ Staff approval function executed successfully');
    console.log('Response status:', mockRes.statusCode);
    console.log('Response body:', JSON.stringify(mockRes.body, null, 2));
    
    // Verify the staff was actually approved
    const updatedStaff = await Staff.findById(staff._id);
    console.log('Updated staff status:', {
      approvalStatus: updatedStaff.approvalStatus,
      isVerified: updatedStaff.isVerified
    });
    
  } catch (error) {
    console.error('❌ Error testing staff approval function:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testApproveStaff();
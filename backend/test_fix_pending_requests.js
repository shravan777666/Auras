#!/usr/bin/env node

/**
 * Test script to verify the fix for getPendingRequestsForOwner function
 * This script creates test data and tests the pending schedule requests functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import User from './models/User.js';

async function connectDB() {
  try {
    // Use the same connection logic as the main app
    const connectDBModule = await import('./config/database.js');
    connectDBModule.default();
    // Wait a bit for the connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestData() {
  console.log('\n🔧 Creating test data...\n');
  
  try {
    // Create a test salon owner user
    let salonOwnerUser = await User.findOne({ email: 'test-salon-owner@example.com' });
    if (!salonOwnerUser) {
      salonOwnerUser = new User({
        name: 'Test Salon Owner',
        email: 'test-salon-owner@example.com',
        password: 'password123',
        type: 'salon',
        isActive: true,
        setupCompleted: true
      });
      await salonOwnerUser.save();
      console.log('✅ Created salon owner user');
    } else {
      console.log('✅ Found existing salon owner user');
    }

    // Create a test salon
    let testSalon = await Salon.findOne({ email: 'test-salon-owner@example.com' });
    if (!testSalon) {
      testSalon = new Salon({
        ownerId: salonOwnerUser._id,
        salonName: 'Test Salon',
        ownerName: 'Test Salon Owner',
        email: 'test-salon-owner@example.com',
        approvalStatus: 'approved',
        isActive: true,
        isVerified: true,
        setupCompleted: true
      });
      await testSalon.save();
      console.log('✅ Created test salon');
    } else {
      // Update existing salon to ensure it's approved
      testSalon.approvalStatus = 'approved';
      testSalon.ownerId = salonOwnerUser._id;
      await testSalon.save();
      console.log('✅ Updated existing test salon');
    }

    // Create a test staff member
    let testStaff = await Staff.findOne({ email: 'test-staff@example.com' });
    if (!testStaff) {
      testStaff = new Staff({
        name: 'Test Staff Member',
        email: 'test-staff@example.com',
        assignedSalon: testSalon._id,
        approvalStatus: 'approved',
        isActive: true
      });
      await testStaff.save();
      console.log('✅ Created test staff member');
    } else {
      // Update existing staff to ensure they're assigned to the salon
      testStaff.assignedSalon = testSalon._id;
      testStaff.approvalStatus = 'approved';
      await testStaff.save();
      console.log('✅ Updated existing test staff member');
    }

    // Create a test leave request
    let testRequest = await ScheduleRequest.findOne({ 
      staffId: testStaff._id,
      type: 'leave'
    });
    if (!testRequest) {
      testRequest = new ScheduleRequest({
        staffId: testStaff._id,
        type: 'leave',
        leave: {
          startDate: '2025-12-25',
          endDate: '2025-12-26',
          reason: 'Holiday',
          notes: 'Christmas vacation'
        },
        status: 'pending'
      });
      await testRequest.save();
      console.log('✅ Created test leave request');
    } else {
      console.log('✅ Found existing test leave request');
    }

    return { salonOwnerUser, testSalon, testStaff, testRequest };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

// Mock request and response objects for testing
const createMockReqRes = (user) => {
  const req = {
    user: { id: user._id },
    query: {}
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  
  return { req, res };
};

async function testGetPendingRequestsForOwner() {
  console.log('\n🧪 Testing getPendingRequestsForOwner function...\n');
  
  try {
    // Get the controller function
    const { getPendingRequestsForOwner } = await import('./controllers/scheduleRequestController.js');
    
    // Create test data
    const { salonOwnerUser, testSalon, testStaff, testRequest } = await createTestData();
    
    // Create mock request/response
    const { req, res } = createMockReqRes(salonOwnerUser);
    
    // Test the function
    console.log('🔍 Calling getPendingRequestsForOwner...');
    await getPendingRequestsForOwner(req, res);
    
    // Check the response
    if (res.data && res.data.success) {
      console.log('✅ Function executed successfully');
      console.log(`📋 Found ${res.data.data.items.length} pending requests`);
      
      if (res.data.data.items.length > 0) {
        const firstRequest = res.data.data.items[0];
        console.log('📋 First request details:');
        console.log(`  - Type: ${firstRequest.type}`);
        console.log(`  - Status: ${firstRequest.status}`);
        console.log(`  - Staff Name: ${firstRequest.staffId?.name || 'N/A'}`);
        console.log(`  - Staff Position: ${firstRequest.staffId?.position || 'N/A'}`);
      }
      
      return true;
    } else {
      console.log('❌ Function failed');
      console.log('Response:', res.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getPendingRequestsForOwner:', error);
    return false;
  }
}

async function main() {
  await connectDB();
  // Wait a bit more for the connection to establish
  await new Promise(resolve => setTimeout(resolve, 2000));
  const success = await testGetPendingRequestsForOwner();
  
  if (success) {
    console.log('\n🎉 Test completed successfully! The fix is working.');
  } else {
    console.log('\n❌ Test failed. There may be additional issues to fix.');
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Database disconnected');
  process.exit(success ? 0 : 1);
}

// Run the test
main().catch(console.error);
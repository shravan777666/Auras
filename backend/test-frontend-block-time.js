// Test script to simulate the exact frontend API call for block time
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
import connectDB from './config/database.js';
connectDB();

// Import models
import Staff from './models/Staff.js';
import User from './models/User.js';

// Simulate the frontend API call
async function testFrontendBlockTime() {
  try {
    console.log('🔍 Testing frontend block time API call simulation...');
    
    // Find a sample staff member
    const staff = await Staff.findOne({}).populate('user');
    if (!staff) {
      console.log('❌ No staff member found in database');
      return;
    }
    
    console.log('📋 Found staff member:', {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      assignedSalon: staff.assignedSalon
    });
    
    if (!staff.assignedSalon) {
      console.log('❌ Staff member is not assigned to a salon');
      return;
    }
    
    // Create a JWT token for the staff member (simulating frontend auth)
    const token = jwt.sign(
      { 
        id: staff.user._id, 
        email: staff.user.email, 
        type: 'staff' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('🔐 Generated JWT token for staff member');
    
    // Simulate the exact API call that the frontend makes
    const testData = {
      date: '2025-10-30',
      startTime: '13:00',
      endTime: '14:00',
      reason: 'Lunch'
    };
    
    console.log('📝 Making block time request with data:', testData);
    
    // Import and call the controller function directly to simulate the API call
    const { createBlockTimeRequest } = await import('./controllers/scheduleRequestController.js');
    
    // Create a mock request and response object
    const mockReq = {
      user: { id: staff.user._id },
      body: testData
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        console.log(`✅ Response status: ${this.statusCode}`);
        console.log(`✅ Response body:`, data);
        return this;
      }
    };
    
    // Call the controller function
    await createBlockTimeRequest(mockReq, mockRes);
    
    // Check if the response was successful
    if (mockRes.statusCode === 200 && mockRes.body?.success) {
      console.log('\n🎉 Frontend block time API call simulation completed successfully!');
      console.log('✅ Schedule request ID:', mockRes.body.data._id);
    } else {
      console.log('\n❌ Frontend block time API call simulation failed!');
      console.log('❌ Status code:', mockRes.statusCode);
      console.log('❌ Response body:', mockRes.body);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    console.error('❌ Error stack:', error.stack);
  } finally {
    // Close connection
    mongoose.connection.close();
  }
}

testFrontendBlockTime();
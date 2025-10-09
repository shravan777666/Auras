import dotenv from 'dotenv';
import Salon from './models/Salon.js';
import Staff from './models/Staff.js';
import ScheduleRequest from './models/ScheduleRequest.js';
import { paginatedResponse } from './utils/responses.js';

// Load environment variables
dotenv.config();

// Mock response object
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.data = data;
    return this;
  }
};

import mongoose from 'mongoose';

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Test the getPendingRequestsForOwner function logic
const testGetPendingRequestsForOwner = async (salonOwnerId) => {
  try {
    console.log(`\n=== Testing getPendingRequestsForOwner for owner ID: ${salonOwnerId} ===`);
    
    // First get the salon owned by this user
    // Try to find by ownerId first, then fallback to email matching
    let salon = await Salon.findOne({ ownerId: salonOwnerId });
    console.log(`Found salon by ownerId: ${!!salon}`);
    
    // If not found by ownerId, try to find by user email
    if (!salon) {
      console.log('Trying fallback method...');
      const User = (await import('./models/User.js')).default;
      const user = await User.findById(salonOwnerId);
      console.log(`Found user: ${!!user}`);
      if (user && user.type === 'salon') {
        salon = await Salon.findOne({ email: user.email });
        console.log(`Found salon by email: ${!!salon}`);
      }
    }
    
    if (!salon) {
      console.log('❌ Salon not found');
      return;
    }
    
    console.log(`✅ Found salon: ${salon.salonName} (${salon._id})`);

    // Query for pending requests - prefer using salonId when available for better performance
    // For backward compatibility, also support the staff-based approach
    let requestsQuery;
    let countQuery;
    
    // Try to find requests by salonId first (more efficient)
    const salonIdRequests = await ScheduleRequest.find({ 
      salonId: salon._id,
      status: 'pending'
    }).limit(1);
    
    console.log(`Found ${salonIdRequests.length} requests with salonId`);
    
    if (salonIdRequests.length > 0) {
      console.log('Using salonId-based querying');
      // Use salonId-based querying (newer, more efficient approach)
      requestsQuery = ScheduleRequest.find({ 
        salonId: salon._id,
        status: 'pending'
      })
        .populate({
          path: 'staffId',
          select: 'name position'
        })
        .sort({ createdAt: -1 })
        .limit(10);
        
      countQuery = ScheduleRequest.countDocuments({ 
        salonId: salon._id,
        status: 'pending' 
      });
    } else {
      console.log('Using staff-based querying (fallback)');
      // Fallback to staff-based querying (backward compatibility)
      // Get staff members in this salon
      const staffMembers = await Staff.find({ assignedSalon: salon._id });
      const staffIds = staffMembers.map(staff => staff._id);
      console.log(`Found ${staffMembers.length} staff members in salon`);
      
      requestsQuery = ScheduleRequest.find({ 
        staffId: { $in: staffIds },
        status: 'pending'
      })
        .populate({
          path: 'staffId',
          select: 'name position'
        })
        .sort({ createdAt: -1 })
        .limit(10);
        
      countQuery = ScheduleRequest.countDocuments({ 
        staffId: { $in: staffIds },
        status: 'pending' 
      });
    }

    const [requests, totalRequests] = await Promise.all([
      requestsQuery,
      countQuery
    ]);
    
    console.log(`Found ${requests.length} pending requests`);
    console.log(`Total requests count: ${totalRequests}`);
    
    // Format the response to match frontend expectations
    const formattedRequests = requests.map(request => ({
      _id: request._id,
      type: request.type,
      status: request.status,
      createdAt: request.createdAt,
      staffId: request.staffId ? {
        _id: request.staffId._id,
        name: request.staffId.name,
        position: request.staffId.position
      } : null,
      blockTime: request.blockTime,
      leave: request.leave,
      shiftSwap: request.shiftSwap
    }));
    
    console.log('Formatted requests:', JSON.stringify(formattedRequests, null, 2));
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error testing getPendingRequestsForOwner:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the test with a specific salon owner ID
const salonOwnerId = '68cceb53faf3e420e3dae253'; // This is the owner ID for "Shravan" salon
testGetPendingRequestsForOwner(salonOwnerId);
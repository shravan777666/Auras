// Test the actual API response format
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';
import Staff from './models/Staff.js';
import ScheduleRequest from './models/ScheduleRequest.js';

// Load environment variables
dotenv.config();

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

// Mock the paginatedResponse function
const paginatedResponse = (items, options) => {
  return {
    success: true,
    data: {
      items: items,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: options.totalPages || 1,
        totalItems: options.totalItems || items.length
      }
    }
  };
};

// Test the actual getPendingRequestsForOwner function logic
const testResponseFormat = async () => {
  try {
    await connectDB();
    
    const salonOwnerId = '68cceb53faf3e420e3dae253';
    console.log(`\n=== Testing response format for owner ID: ${salonOwnerId} ===`);
    
    // First get the salon owned by this user
    let salon = await Salon.findOne({ ownerId: salonOwnerId });
    
    if (!salon) {
      console.log('Trying fallback method...');
      const User = (await import('./models/User.js')).default;
      const user = await User.findById(salonOwnerId);
      if (user && user.type === 'salon') {
        salon = await Salon.findOne({ email: user.email });
      }
    }
    
    if (!salon) {
      console.log('❌ Salon not found');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`✅ Found salon: ${salon.salonName} (${salon._id})`);

    // Query for pending requests using salonId approach
    const requests = await ScheduleRequest.find({ 
      salonId: salon._id,
      status: 'pending'
    })
    .populate({
      path: 'staffId',
      select: 'name position'
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    const totalRequests = await ScheduleRequest.countDocuments({ 
      salonId: salon._id,
      status: 'pending' 
    });
    
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
    
    // Create the actual response that would be sent
    const response = paginatedResponse(formattedRequests, {
      page: 1,
      limit: 10,
      totalPages: Math.ceil(totalRequests / 10),
      totalItems: totalRequests
    });
    
    console.log('\n=== Actual Response Format ===');
    console.log(JSON.stringify(response, null, 2));
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error testing response format:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

testResponseFormat();
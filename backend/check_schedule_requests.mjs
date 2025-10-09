import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

// Function to check schedule requests
const checkScheduleRequests = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find the specific schedule request
    const scheduleRequestId = '68e4798fa8966bcdaf2f99b0';
    const scheduleRequest = await ScheduleRequest.findById(scheduleRequestId);
    
    if (!scheduleRequest) {
      console.log(`Schedule request with ID ${scheduleRequestId} not found`);
      
      // Let's check all schedule requests
      const allRequests = await ScheduleRequest.find({}, '_id staffId type status salonId');
      console.log(`Found ${allRequests.length} schedule requests:`);
      allRequests.forEach(req => {
        console.log(`ID: ${req._id}, Staff: ${req.staffId}, Type: ${req.type}, Status: ${req.status}, Salon: ${req.salonId}`);
      });
    } else {
      console.log('Found schedule request:', scheduleRequest);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error checking schedule requests:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
checkScheduleRequests();
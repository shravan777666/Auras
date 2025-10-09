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

// Function to reset the status of the specific schedule request
const resetScheduleRequestStatus = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // The specific request ID from the error
    const requestId = '68e4a0542665c8375ab21952';
    
    // Find the schedule request
    const scheduleRequest = await ScheduleRequest.findById(requestId);
    
    if (!scheduleRequest) {
      console.log(`Schedule request with ID ${requestId} not found`);
      await mongoose.connection.close();
      return;
    }
    
    console.log('Schedule Request Details:');
    console.log(`ID: ${scheduleRequest._id}`);
    console.log(`Type: ${scheduleRequest.type}`);
    console.log(`Status: ${scheduleRequest.status}`);
    console.log(`Staff ID: ${scheduleRequest.staffId}`);
    
    // Reset the status to pending if it's currently rejected
    if (scheduleRequest.status === 'rejected') {
      scheduleRequest.status = 'pending';
      // Clear rejection fields
      scheduleRequest.rejectedBy = undefined;
      scheduleRequest.rejectedAt = undefined;
      scheduleRequest.rejectionReason = undefined;
      
      await scheduleRequest.save();
      console.log(`✅ Successfully reset schedule request status to pending`);
    } else {
      console.log(`ℹ️  Schedule request status is already ${scheduleRequest.status}`);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error resetting schedule request status:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
resetScheduleRequestStatus();
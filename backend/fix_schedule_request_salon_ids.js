import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';

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

// Function to fix schedule requests missing salonId
const fixScheduleRequestSalonIds = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find all schedule requests that don't have salonId populated
    const requestsWithoutSalonId = await ScheduleRequest.find({ 
      $or: [
        { salonId: { $exists: false } },
        { salonId: null }
      ]
    });
    
    console.log(`Found ${requestsWithoutSalonId.length} schedule requests without salonId`);
    
    let fixedCount = 0;
    
    // Process each request
    for (const request of requestsWithoutSalonId) {
      try {
        // Get the staff member for this request
        const staff = await Staff.findById(request.staffId);
        
        if (staff && staff.assignedSalon) {
          // Update the request with the salonId
          request.salonId = staff.assignedSalon;
          await request.save();
          console.log(`Fixed salonId for request ${request._id}`);
          fixedCount++;
        } else {
          console.log(`Could not fix request ${request._id} - staff not found or not assigned to salon`);
        }
      } catch (error) {
        console.error(`Error fixing request ${request._id}:`, error.message);
      }
    }
    
    console.log(`\nFixed ${fixedCount} schedule requests`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error fixing schedule request salon IDs:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
fixScheduleRequestSalonIds();
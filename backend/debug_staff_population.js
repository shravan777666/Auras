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

// Function to debug staff population in schedule requests
const debugStaffPopulation = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find a few pending schedule requests
    const requests = await ScheduleRequest.find({ status: 'pending' })
      .limit(5)
      .populate({
        path: 'staffId',
        select: 'name position profilePicture'
      });
    
    console.log(`Found ${requests.length} pending schedule requests:`);
    
    for (const request of requests) {
      console.log(`\n--- Request ID: ${request._id} ---`);
      console.log(`Staff ID: ${request.staffId}`);
      console.log(`Staff ID Type: ${typeof request.staffId}`);
      
      if (request.staffId) {
        console.log(`Staff Name: ${request.staffId.name}`);
        console.log(`Staff Position: ${request.staffId.position}`);
        console.log(`Staff Profile Picture: ${request.staffId.profilePicture}`);
        
        // Let's also check the raw staff document
        const rawStaff = await Staff.findById(request.staffId._id || request.staffId);
        console.log(`Raw Staff Document:`);
        console.log(`  Name: ${rawStaff?.name}`);
        console.log(`  Position: ${rawStaff?.position}`);
        console.log(`  Email: ${rawStaff?.email}`);
      } else {
        console.log('No staff data populated');
        
        // Try to fetch the staff member directly
        if (request.staffId) {
          const staff = await Staff.findById(request.staffId._id || request.staffId);
          console.log(`Direct staff lookup:`);
          console.log(`  Staff found: ${!!staff}`);
          if (staff) {
            console.log(`  Name: ${staff.name}`);
            console.log(`  Position: ${staff.position}`);
          }
        }
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error debugging staff population:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
debugStaffPopulation();
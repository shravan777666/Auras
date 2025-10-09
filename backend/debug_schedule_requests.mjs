import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';

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

// Function to check schedule requests and related data
const checkScheduleRequests = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find all schedule requests
    const allRequests = await ScheduleRequest.find({})
      .populate('staffId', 'name position assignedSalon')
      .populate('salonId', 'salonName');
    
    console.log(`Found ${allRequests.length} schedule requests:`);
    
    allRequests.forEach((req, index) => {
      console.log(`\n--- Request ${index + 1} ---`);
      console.log(`ID: ${req._id}`);
      console.log(`Type: ${req.type}`);
      console.log(`Status: ${req.status}`);
      console.log(`Staff ID: ${req.staffId?._id || req.staffId}`);
      console.log(`Staff Name: ${req.staffId?.name || 'N/A'}`);
      console.log(`Staff Salon: ${req.staffId?.assignedSalon || 'N/A'}`);
      console.log(`Salon ID: ${req.salonId?._id || req.salonId || 'N/A'}`);
      console.log(`Salon Name: ${req.salonId?.salonName || 'N/A'}`);
      console.log(`Created At: ${req.createdAt}`);
      
      if (req.type === 'leave' && req.leave) {
        console.log(`Leave Details: ${req.leave.startDate} to ${req.leave.endDate} (${req.leave.reason})`);
      }
    });
    
    // Check staff members
    console.log('\n--- Staff Members ---');
    const staffMembers = await Staff.find({}, '_id name email assignedSalon');
    console.log(`Found ${staffMembers.length} staff members:`);
    staffMembers.forEach(staff => {
      console.log(`ID: ${staff._id}, Name: ${staff.name}, Email: ${staff.email}, Salon: ${staff.assignedSalon}`);
    });
    
    // Check salons
    console.log('\n--- Salons ---');
    const salons = await Salon.find({}, '_id salonName ownerId email');
    console.log(`Found ${salons.length} salons:`);
    salons.forEach(salon => {
      console.log(`ID: ${salon._id}, Name: ${salon.salonName}, Owner ID: ${salon.ownerId}, Email: ${salon.email}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error checking schedule requests:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
checkScheduleRequests();
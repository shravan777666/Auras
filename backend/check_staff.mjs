import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

// Function to check staff members
const checkStaff = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find all staff members
    const staffMembers = await Staff.find({}, '_id name email assignedSalon');
    
    console.log(`Found ${staffMembers.length} staff members:`);
    staffMembers.forEach(staff => {
      console.log(`ID: ${staff._id}, Name: ${staff.name}, Email: ${staff.email}, Salon: ${staff.assignedSalon}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error checking staff members:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
checkStaff();
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

// Function to check for duplicate staff
const checkDuplicateStaff = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Check for staff with email "kevin@gmail.com"
    const kevinStaff = await Staff.find({ email: "kevin@gmail.com" });
    console.log(`Found ${kevinStaff.length} staff members with email "kevin@gmail.com":`);
    kevinStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} - ${staff._id} - ${staff.email}`);
    });
    
    // Check for staff with email "lamala@gmail.com"
    const lamalaStaff = await Staff.find({ email: "lamala@gmail.com" });
    console.log(`\nFound ${lamalaStaff.length} staff members with email "lamala@gmail.com":`);
    lamalaStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} - ${staff._id} - ${staff.email}`);
    });
    
    // Check for the unknown staff members
    const unknownStaff = await Staff.find({ 
      name: { $regex: /^Unknown Staff/ } 
    });
    
    console.log(`\nFound ${unknownStaff.length} staff members with unknown names:`);
    unknownStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} - ${staff._id} - ${staff.email}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error checking duplicate staff:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
checkDuplicateStaff();
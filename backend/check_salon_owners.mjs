import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

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

// Function to check salon owners
const checkSalonOwners = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find all users with type 'salon'
    const salonUsers = await User.find({ type: 'salon' }, '_id name email');
    
    console.log(`Found ${salonUsers.length} salon users:`);
    salonUsers.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error checking salon owners:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
checkSalonOwners();
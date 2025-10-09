import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
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

// Function to check all staff passwords
const checkAllStaffPasswords = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Checking all staff users...\n');
    
    // Find all staff in Staff collection
    const allStaff = await Staff.find({ isActive: true });
    console.log(`Found ${allStaff.length} active staff members`);
    
    for (const staff of allStaff) {
      console.log(`\n--- Staff: ${staff.name} (${staff.email}) ---`);
      console.log(`Staff ID: ${staff._id}`);
      console.log(`Staff password: ${staff.password ? 'SET' : 'NOT SET'}`);
      console.log(`Staff user ref: ${staff.user || 'NONE'}`);
      
      // Find corresponding user
      let user = null;
      if (staff.user) {
        user = await User.findById(staff.user);
      } else {
        user = await User.findOne({ email: staff.email, type: 'staff' });
      }
      
      console.log(`User found: ${user ? 'YES' : 'NO'}`);
      if (user) {
        console.log(`User ID: ${user._id}`);
        console.log(`User password: ${user.password ? 'SET' : 'NOT SET'}`);
        if (user.password) {
          console.log(`User password hash: ${user.password.substring(0, 20)}...`);
        }
      }
    }
    
    // Also check users directly
    console.log('\n--- Checking all staff users directly ---');
    const staffUsers = await User.find({ type: 'staff', isActive: true });
    console.log(`Found ${staffUsers.length} staff users in User collection`);
    
    for (const user of staffUsers) {
      console.log(`\nUser: ${user.name} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Password: ${user.password ? 'SET' : 'NOT SET'}`);
      if (user.password) {
        console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
      }
      
      // Try to find corresponding staff profile
      const staffProfile = await Staff.findOne({ user: user._id });
      console.log(`  Staff profile: ${staffProfile ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
checkAllStaffPasswords();
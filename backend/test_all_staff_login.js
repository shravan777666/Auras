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

// Function to test all staff logins
const testAllStaffLogins = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Testing all staff logins\n');
    
    // Find all active staff members
    const allStaff = await Staff.find({ isActive: true });
    console.log(`Found ${allStaff.length} active staff members\n`);
    
    // Test each staff member
    for (const [index, staff] of allStaff.entries()) {
      console.log(`--- Testing Staff ${index + 1}: ${staff.name} (${staff.email}) ---`);
      
      // Check if staff has user reference
      if (!staff.user) {
        console.log('❌ No user reference found');
        continue;
      }
      
      // Find corresponding user
      const user = await User.findById(staff.user);
      if (!user) {
        console.log('❌ Associated user not found');
        continue;
      }
      
      console.log(`✅ User found: ${user.name} (${user.email})`);
      
      // Check if user has password
      if (!user.password) {
        console.log('❌ User has no password set');
        continue;
      }
      
      console.log('✅ User has password set');
      
      // Check approval status
      console.log(`📋 Approval status: ${staff.approvalStatus}`);
      
      if (staff.approvalStatus === 'approved') {
        console.log('✅ Staff is approved for login');
      } else if (staff.approvalStatus === 'pending') {
        console.log('⚠️  Staff is pending approval');
      } else if (staff.approvalStatus === 'rejected') {
        console.log('❌ Staff is rejected');
      } else {
        console.log('⚠️  Unknown approval status');
      }
      
      console.log('');
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
testAllStaffLogins();
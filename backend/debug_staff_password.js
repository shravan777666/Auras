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

// Function to debug staff password
const debugStaffPassword = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test credentials (replace with actual test credentials)
    const email = 'kevin@gmail.com'; // Example staff email
    const password = '123456'; // Example password
    const userType = 'staff';
    
    console.log(`\n🔍 Debugging staff password for ${email} (${userType})\n`);
    
    // Step 1: Find staff in Staff collection
    console.log('1️⃣ Looking for staff in Staff collection...');
    const staff = await Staff.findOne({ email, isActive: true });
    console.log('Staff found:', staff ? {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      password: staff.password ? 'SET' : 'NOT SET',
      approvalStatus: staff.approvalStatus,
      isActive: staff.isActive,
      userRef: staff.user
    } : 'NOT FOUND');
    
    // Step 2: Find staff in User collection
    console.log('\n2️⃣ Looking for staff in User collection...');
    let user = null;
    if (staff && staff.user) {
      user = await User.findById(staff.user);
    } else {
      user = await User.findOne({ email, type: userType, isActive: true });
    }
    console.log('User found:', user ? {
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      password: user.password ? 'SET' : 'NOT SET',
      isActive: user.isActive
    } : 'NOT FOUND');
    
    // Step 3: Check actual password values
    if (staff && user) {
      console.log('\n3️⃣ Checking actual password values...');
      console.log(`Staff password value: ${staff.password || 'NULL'}`);
      console.log(`User password value: ${user.password || 'NULL'}`);
      
      // Try to validate the user password
      if (user.password) {
        console.log('\n4️⃣ Testing password validation...');
        try {
          // Test with a known incorrect password first
          const isMatchWrong = await bcrypt.compare('wrongpassword', user.password);
          console.log(`Password match with 'wrongpassword': ${isMatchWrong}`);
          
          // Test with the actual password
          const isMatchCorrect = await bcrypt.compare(password, user.password);
          console.log(`Password match with '${password}': ${isMatchCorrect}`);
          
          // Try a few common passwords
          const commonPasswords = ['123456', 'password', 'admin123'];
          for (const pwd of commonPasswords) {
            const isMatch = await bcrypt.compare(pwd, user.password);
            console.log(`Password match with '${pwd}': ${isMatch}`);
          }
        } catch (error) {
          console.log(`Password validation error: ${error.message}`);
        }
      }
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
debugStaffPassword();
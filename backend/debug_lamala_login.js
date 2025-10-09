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

// Function to debug Lamala's login specifically
const debugLamalaLogin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test credentials for Lamala
    const email = 'lamala@gmail.com';
    const password = '123456'; // This might not be the correct password
    const userType = 'staff';
    
    console.log(`\n🔍 Debugging Lamala's login for ${email} (${userType})\n`);
    
    // Step 1: Find staff in Staff collection
    console.log('1️⃣ Looking for staff in Staff collection...');
    const staff = await Staff.findOne({ email, isActive: true });
    console.log('Staff found:', staff ? {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      hasPassword: !!staff.password,
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
      hasPassword: !!user.password,
      isActive: user.isActive
    } : 'NOT FOUND');
    
    // Step 3: Check password comparison
    if (staff && user) {
      console.log('\n3️⃣ Checking password comparison...');
      console.log(`Staff password: ${staff.password ? 'SET' : 'NOT SET'}`);
      console.log(`User password: ${user.password ? 'SET' : 'NOT SET'}`);
      
      if (staff.password) {
        try {
          const isMatch = await bcrypt.compare(password, staff.password);
          console.log(`Password match (staff): ${isMatch}`);
        } catch (error) {
          console.log(`Password comparison error (staff): ${error.message}`);
        }
      }
      
      if (user.password) {
        try {
          const isMatch = await bcrypt.compare(password, user.password);
          console.log(`Password match (user): ${isMatch}`);
        } catch (error) {
          console.log(`Password comparison error (user): ${error.message}`);
        }
      }
    }
    
    // Step 4: Check approval status
    if (staff) {
      console.log('\n4️⃣ Checking approval status...');
      console.log(`Approval status: ${staff.approvalStatus}`);
      console.log(`Is verified: ${staff.isVerified}`);
      
      if (staff.approvalStatus === 'rejected') {
        console.log(`❌ Staff rejected: ${staff.rejectionReason || 'No reason provided'}`);
      } else if (staff.approvalStatus === 'pending') {
        console.log('⚠️  Staff pending approval');
      } else if (staff.approvalStatus !== 'approved') {
        console.log(`⚠️  Staff not approved: ${staff.approvalStatus}`);
      } else {
        console.log('✅ Staff approved');
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
debugLamalaLogin();
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

// Function to simulate staff login
const testStaffLogin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test credentials
    const email = 'kevin@gmail.com';
    const password = '123456';
    const userType = 'staff';
    
    console.log(`\n🔍 Testing staff login for ${email} (${userType})\n`);
    
    // Simulate the login process step by step
    
    // Step 1: Find staff in Staff collection
    console.log('1️⃣ Looking for staff in Staff collection...');
    const specificModelUser = await Staff.findOne({ email, isActive: true });
    console.log('Staff found:', specificModelUser ? 'YES' : 'NO');
    
    if (!specificModelUser) {
      console.log('❌ Staff not found in Staff collection');
      await mongoose.connection.close();
      return;
    }
    
    // Step 2: Find corresponding User document
    console.log('\n2️⃣ Looking for corresponding User document...');
    let centralUser = null;
    if (specificModelUser.user) {
      centralUser = await User.findById(specificModelUser.user);
    } else {
      centralUser = await User.findOne({ email: specificModelUser.email, type: userType });
    }
    
    console.log('Central user found:', centralUser ? 'YES' : 'NO');
    
    if (!centralUser) {
      console.log('❌ Central user not found');
      await mongoose.connection.close();
      return;
    }
    
    // Step 3: Create user object for login flow
    console.log('\n3️⃣ Creating user object...');
    const user = {
      _id: centralUser._id,
      name: specificModelUser.name,
      email: specificModelUser.email,
      password: centralUser.password, // Use central User's password
      type: userType,
      setupCompleted: specificModelUser.setupCompleted || false,
      isActive: specificModelUser.isActive,
      approvalStatus: specificModelUser.approvalStatus || undefined,
    };
    
    console.log('User object created:', {
      id: user._id,
      email: user.email,
      type: user.type,
      passwordExists: !!user.password
    });
    
    // Step 4: Check password
    console.log('\n4️⃣ Checking password...');
    console.log(`Password to check: ${password}`);
    console.log(`Stored password hash: ${user.password}`);
    
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match: ${isMatch}`);
      
      if (!isMatch) {
        console.log('❌ Password does not match');
        await mongoose.connection.close();
        return;
      }
    } catch (error) {
      console.log(`❌ Password comparison error: ${error.message}`);
      await mongoose.connection.close();
      return;
    }
    
    // Step 5: Check approval status (for staff)
    console.log('\n5️⃣ Checking approval status...');
    console.log(`Staff approval status: ${specificModelUser.approvalStatus}`);
    
    if (specificModelUser.approvalStatus === 'rejected') {
      console.log('❌ Staff is rejected');
      await mongoose.connection.close();
      return;
    }
    
    if (specificModelUser.approvalStatus === 'pending') {
      console.log('⚠️  Staff is pending approval');
      await mongoose.connection.close();
      return;
    }
    
    if (specificModelUser.approvalStatus !== 'approved') {
      console.log('❌ Staff is not approved');
      await mongoose.connection.close();
      return;
    }
    
    console.log('✅ Staff login successful');
    
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
testStaffLogin();
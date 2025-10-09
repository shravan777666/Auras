import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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

// Function to reset staff password with detailed logging
const resetStaffPasswordDetailed = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test credentials
    const email = 'kevin@gmail.com';
    const newPassword = '123456'; // Known password for testing
    
    console.log(`\n🔍 Resetting password for staff ${email}\n`);
    
    // Find the user in User collection
    const user = await User.findOne({ email, type: 'staff' });
    
    if (!user) {
      console.log('❌ User not found in User collection');
      await mongoose.connection.close();
      return;
    }
    
    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      currentPassword: user.password ? 'SET' : 'NOT SET'
    });
    
    if (user.password) {
      console.log(`Current password hash: ${user.password.substring(0, 30)}...`);
    }
    
    // Hash the new password
    console.log('\nGenerating new password hash...');
    const salt = await bcrypt.genSalt(10);
    console.log(`Salt: ${salt}`);
    
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log(`New hashed password: ${hashedPassword.substring(0, 30)}...`);
    
    // Update the user's password
    console.log('\nUpdating user password...');
    user.password = hashedPassword;
    
    // Save the user
    console.log('Saving user...');
    const savedUser = await user.save();
    console.log('User saved successfully');
    
    console.log('\nVerifying saved password...');
    console.log(`Saved password hash: ${savedUser.password.substring(0, 30)}...`);
    
    // Test the new password
    console.log('\nTesting password verification...');
    const isMatch = await bcrypt.compare(newPassword, savedUser.password);
    console.log(`Password verification result: ${isMatch}`);
    
    if (!isMatch) {
      console.log('❌ Password verification failed');
      // Try again with the exact same hash
      console.log('Retesting with exact hash...');
      const isMatch2 = await bcrypt.compare(newPassword, hashedPassword);
      console.log(`Immediate verification result: ${isMatch2}`);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
resetStaffPasswordDetailed();
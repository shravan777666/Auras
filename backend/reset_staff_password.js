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

// Function to reset staff password
const resetStaffPassword = async () => {
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
      email: user.email
    });
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password reset successfully');
    console.log(`New password hash: ${user.password.substring(0, 20)}...`);
    
    // Test the new password
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log(`Password verification: ${isMatch}`);
    
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
resetStaffPassword();
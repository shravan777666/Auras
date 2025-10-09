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

// Function to fix Lamala's password
const fixLamalaPassword = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test credentials
    const email = 'lamala@gmail.com';
    const newPassword = '123456'; // Known password for testing
    
    console.log(`\n🔍 Fixing password for staff ${email}\n`);
    
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
    
    // Set the plain text password - the pre-save hook will hash it automatically
    console.log('\nSetting plain text password (pre-save hook will hash it)...');
    user.password = newPassword;
    
    // Save the user - the pre-save hook will automatically hash the password
    console.log('Saving user...');
    const savedUser = await user.save();
    console.log('User saved successfully');
    
    console.log('\nVerifying saved password...');
    console.log(`Saved password hash: ${savedUser.password.substring(0, 30)}...`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('\n✅ Password fixed. You can now test login with password: 123456');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
fixLamalaPassword();
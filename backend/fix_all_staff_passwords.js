import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

// Function to fix all staff passwords
const fixAllStaffPasswords = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Fixing passwords for all staff members\n');
    
    // Find all active staff members
    const allStaff = await Staff.find({ isActive: true });
    console.log(`Found ${allStaff.length} active staff members\n`);
    
    let fixedCount = 0;
    
    // Fix each staff member
    for (const [index, staff] of allStaff.entries()) {
      console.log(`--- Processing Staff ${index + 1}: ${staff.name} (${staff.email}) ---`);
      
      // Check if staff has user reference
      if (!staff.user) {
        console.log('❌ No user reference found - skipping');
        continue;
      }
      
      // Find corresponding user
      const user = await User.findById(staff.user);
      if (!user) {
        console.log('❌ Associated user not found - skipping');
        continue;
      }
      
      console.log(`✅ User found: ${user.name} (${user.email})`);
      
      // Set a default password for all staff
      const defaultPassword = '123456';
      console.log(`Setting password to: ${defaultPassword}`);
      user.password = defaultPassword;
      
      // Save the user - the pre-save hook will automatically hash the password
      console.log('Saving user...');
      const savedUser = await user.save();
      console.log('User saved successfully');
      
      fixedCount++;
      console.log('');
    }
    
    console.log(`\n✅ Fixed passwords for ${fixedCount} staff members`);
    
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
fixAllStaffPasswords();
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

// Function to fix staff user references
const fixStaffUserReferences = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Fixing staff user references\n');
    
    // Find all active staff members without user references
    const staffWithoutUser = await Staff.find({ 
      isActive: true, 
      user: { $exists: false } 
    });
    
    console.log(`Found ${staffWithoutUser.length} staff members without user references\n`);
    
    // Fix each staff member
    for (const [index, staff] of staffWithoutUser.entries()) {
      console.log(`--- Fixing Staff ${index + 1}: ${staff.name} (${staff.email}) ---`);
      
      // Try to find corresponding user
      const user = await User.findOne({ email: staff.email, type: 'staff' });
      
      if (!user) {
        console.log('❌ No corresponding user found');
        continue;
      }
      
      console.log(`✅ Found user: ${user.name} (${user.email})`);
      
      // Update staff with user reference
      staff.user = user._id;
      await staff.save();
      
      console.log('✅ User reference added to staff profile');
      console.log('');
    }
    
    // Also check for staff with null user references
    const staffWithNullUser = await Staff.find({ 
      isActive: true, 
      user: null 
    });
    
    console.log(`Found ${staffWithNullUser.length} staff members with null user references\n`);
    
    for (const [index, staff] of staffWithNullUser.entries()) {
      console.log(`--- Fixing Staff with null reference ${index + 1}: ${staff.name} (${staff.email}) ---`);
      
      // Try to find corresponding user
      const user = await User.findOne({ email: staff.email, type: 'staff' });
      
      if (!user) {
        console.log('❌ No corresponding user found');
        continue;
      }
      
      console.log(`✅ Found user: ${user.name} (${user.email})`);
      
      // Update staff with user reference
      staff.user = user._id;
      await staff.save();
      
      console.log('✅ User reference added to staff profile');
      console.log('');
    }
    
    console.log('✅ Staff user reference fix completed');
    
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
fixStaffUserReferences();
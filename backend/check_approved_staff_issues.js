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

// Function to check approved staff issues
const checkApprovedStaffIssues = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Checking approved staff for issues\n');
    
    // Find all approved staff members
    const approvedStaff = await Staff.find({ 
      isActive: true, 
      approvalStatus: 'approved' 
    });
    
    console.log(`Found ${approvedStaff.length} approved staff members\n`);
    
    // Check each approved staff member
    for (const [index, staff] of approvedStaff.entries()) {
      console.log(`--- Checking Approved Staff ${index + 1}: ${staff.name} (${staff.email}) ---`);
      
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
checkApprovedStaffIssues();
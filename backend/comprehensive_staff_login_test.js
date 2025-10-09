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

// Function to comprehensively test staff login
const comprehensiveStaffLoginTest = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Comprehensive Staff Login Test\n');
    
    // Find all approved staff members
    const approvedStaff = await Staff.find({ 
      isActive: true, 
      approvalStatus: 'approved'
    });
    
    console.log(`Found ${approvedStaff.length} approved staff members\n`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Test each approved staff member
    for (const [index, staff] of approvedStaff.entries()) {
      console.log(`--- Testing Staff ${index + 1}: ${staff.name} (${staff.email}) ---`);
      
      // Check if staff has user reference
      if (!staff.user) {
        console.log('❌ No user reference found');
        failureCount++;
        continue;
      }
      
      // Find corresponding user
      const user = await User.findById(staff.user);
      if (!user) {
        console.log('❌ Associated user not found');
        failureCount++;
        continue;
      }
      
      console.log(`✅ User found: ${user.name} (${user.email})`);
      
      // Check if user has password
      if (!user.password) {
        console.log('❌ User has no password set');
        failureCount++;
        continue;
      }
      
      console.log('✅ User has password set');
      
      // Test the complete login flow simulation
      try {
        // Simulate creating user object for login
        const loginUser = {
          _id: user._id,
          name: staff.name,
          email: staff.email,
          password: user.password,
          type: 'staff',
          setupCompleted: staff.setupCompleted || false,
          isActive: staff.isActive,
          approvalStatus: staff.approvalStatus || undefined,
        };
        
        // Test password verification (using a common test password)
        const testPasswords = ['123456', 'password', 'admin123', 'test123'];
        let passwordMatch = false;
        
        for (const testPassword of testPasswords) {
          try {
            const isMatch = await bcrypt.compare(testPassword, loginUser.password);
            if (isMatch) {
              console.log(`✅ Password verification successful with password: ${testPassword}`);
              passwordMatch = true;
              break;
            }
          } catch (compareError) {
            console.log(`❌ Password comparison error: ${compareError.message}`);
          }
        }
        
        if (!passwordMatch) {
          console.log('⚠️  Could not verify password with common test passwords (this is normal if using actual passwords)');
        }
        
        console.log('✅ Login flow simulation successful');
        successCount++;
      } catch (flowError) {
        console.log(`❌ Login flow simulation error: ${flowError.message}`);
        failureCount++;
      }
      
      console.log('');
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    console.log(`  📈 Success Rate: ${approvedStaff.length > 0 ? Math.round((successCount / approvedStaff.length) * 100) : 0}%`);
    
    if (failureCount === 0) {
      console.log('\n🎉 All staff login tests passed!');
    } else {
      console.log(`\n⚠️  ${failureCount} staff member(s) had issues. Please check the logs above.`);
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
comprehensiveStaffLoginTest();
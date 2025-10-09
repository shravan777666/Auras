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

// Function to simulate the exact login process and catch errors
const simulateLoginError = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test credentials that would cause the error
    const email = 'kevin@gmail.com';
    const password = '123456';
    const userType = 'staff';
    
    console.log(`\n🔍 Simulating login error for ${email} (${userType})\n`);
    
    try {
      console.log('Login attempt:', { email, userType });

      // Validate required fields
      if (!email || !password || !userType) {
        console.log('❌ Validation error: Missing required fields');
        await mongoose.connection.close();
        return;
      }

      let user = null;
      let specificModelUser = null;

      // Prioritize finding user in specific model based on userType
      switch (userType) {
        case 'customer':
          const Customer = (await import('./models/Customer.js')).default;
          specificModelUser = await Customer.findOne({ email, isActive: true });
          break;
        case 'salon':
          const Salon = (await import('./models/Salon.js')).default;
          specificModelUser = await Salon.findOne({ email, isActive: true });
          break;
        case 'staff':
          const Staff = (await import('./models/Staff.js')).default;
          specificModelUser = await Staff.findOne({ email, isActive: true });
          break;
        case 'admin':
          const Admin = (await import('./models/Admin.js')).default;
          specificModelUser = await Admin.findOne({ email, isActive: true });
          break;
        default:
          console.log('❌ Validation error: Invalid user type');
          await mongoose.connection.close();
          return;
      }

      if (!specificModelUser) {
        // If not found in specific model, try central User model as a fallback
        user = await User.findOne({ email, type: userType, isActive: true });
        if (!user) {
          console.log('❌ Authentication error: No user found');
          await mongoose.connection.close();
          return;
        }
      } else {
        // If found in specific model, retrieve the corresponding User document
        // This is crucial for ensuring the JWT token contains the central User ID
        let centralUser = null;
        if (specificModelUser.ownerId) { // For Salon and potentially Staff
          centralUser = await User.findById(specificModelUser.ownerId);
        } else if (specificModelUser.user) { // For Staff
          centralUser = await User.findById(specificModelUser.user);
        } else { // For Customer/Admin, specificModelUser might be the User itself or linked by _id
          centralUser = await User.findOne({ email: specificModelUser.email, type: userType });
        }

        if (!centralUser) {
          console.log('❌ Authentication error: Associated central user not found');
          await mongoose.connection.close();
          return;
        }

        // Create a user object compatible with the rest of the login flow, using centralUser's _id
        // Use the password from the central User model for authentication, not from specific models
        user = {
          _id: centralUser._id, // Use the central User's _id for the token
          name: specificModelUser.name,
          email: specificModelUser.email,
          password: centralUser.password, // Use central User's password for bcrypt compare
          type: userType,
          setupCompleted: specificModelUser.setupCompleted || false,
          isActive: specificModelUser.isActive,
          approvalStatus: specificModelUser.approvalStatus || undefined,
        };
      }
      console.log('Specific model user found:', specificModelUser ? { id: specificModelUser._id, email: specificModelUser.email, type: userType, isActive: specificModelUser.isActive } : 'None');
      console.log('User object for password check:', user ? { id: user._id, email: user.email, type: user.type, passwordExists: !!user.password } : 'None');

      // Check password
      console.log('User object before password check:', { id: user._id, email: user.email, type: user.type });
      
      // This is where the error might be occurring
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match result for ${user.email}: ${isMatch}`);
        if (!isMatch) {
          console.log(`Authentication failed for ${user.email}: Incorrect password.`);
          await mongoose.connection.close();
          return;
        }
      } catch (bcryptError) {
        console.log(`❌ Bcrypt error during password comparison: ${bcryptError.message}`);
        console.log(`Password value: ${user.password}`);
        console.log(`Password type: ${typeof user.password}`);
        await mongoose.connection.close();
        return;
      }

      // For staff users, check approval status
      if (userType === 'staff') {
        console.log('=== STAFF LOGIN DEBUG ===');
        console.log('User email:', user.email);
        console.log('User type:', userType);
        
        const StaffModel = (await import('./models/Staff.js')).default;
        const staff = specificModelUser || await StaffModel.findOne({ email: user.email });
        
        console.log('Staff found:', staff ? {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          approvalStatus: staff.approvalStatus,
          isVerified: staff.isVerified,
          setupCompleted: staff.setupCompleted
        } : 'null');
        
        if (!staff) {
          console.log('Staff profile not found for email:', user.email);
          await mongoose.connection.close();
          return;
        }
        
        // Add approvalStatus to the user object before signing the token
        user.approvalStatus = staff.approvalStatus;

        if (staff.approvalStatus === 'rejected') {
          console.log('Staff is rejected');
          await mongoose.connection.close();
          return;
        }
        
        if (staff.approvalStatus === 'pending') {
          console.log('Staff is still pending');
          await mongoose.connection.close();
          return;
        }
        
        if (staff.approvalStatus !== 'approved') {
          console.log('Staff approval status is not approved:', staff.approvalStatus);
          await mongoose.connection.close();
          return;
        }
        
        console.log('Staff approval check passed - login allowed');
      }

      console.log('✅ Login process completed successfully');
      
    } catch (err) {
      // Log error and return user-friendly message
      console.log('❌ Login error caught in catch block:', err);
      console.log('Error name:', err.name);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
simulateLoginError();
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { login } from './controllers/authController.js'; // Import the login function

// Load environment variables
dotenv.config();

// Mock request and response objects for testing
const createMockReqRes = (email, password, userType) => {
  const req = {
    body: { email, password, userType }
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };
  
  return { req, res };
};

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

// Function to test all staff logins with the fixed password
const testAllStaffLoginsFinal = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Testing all staff logins with fixed passwords\n');
    
    // Test cases for all active staff members with fixed passwords
    const testCases = [
      {
        email: 'kevin@gmail.com',
        password: '123456',
        userType: 'staff',
        description: 'Kevin (approved staff)'
      },
      {
        email: 'shravanachu77@gmail.com',
        password: '123456',
        userType: 'staff',
        description: 'Shravan S (rejected staff - should fail login due to approval status)'
      },
      {
        email: 'lamala@gmail.com',
        password: '123456',
        userType: 'staff',
        description: 'Lamala (approved staff)'
      },
      {
        email: 'staff@test.com',
        password: '123456',
        userType: 'staff',
        description: 'Test Staff (approved staff)'
      }
    ];
    
    let successCount = 0;
    let failureCount = 0;
    
    // Test each case
    for (const [index, testCase] of testCases.entries()) {
      console.log(`--- Test Case ${index + 1}: ${testCase.description} ---`);
      console.log(`Email: ${testCase.email}`);
      console.log(`User Type: ${testCase.userType}`);
      
      // Create mock req/res
      const { req, res } = createMockReqRes(
        testCase.email, 
        testCase.password, 
        testCase.userType
      );
      
      try {
        // Call the login function
        await login(req, res);
        
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response:`, res.body);
        
        if (res.statusCode === 200 && res.body?.success) {
          console.log('✅ Login successful');
          successCount++;
        } else if (res.statusCode === 401) {
          console.log('❌ Authentication failed (incorrect credentials)');
          failureCount++;
        } else if (res.statusCode === 403) {
          console.log('⚠️  Login forbidden (approval status issue)');
          // This is expected for rejected staff
          if (testCase.email.includes('shravan')) {
            console.log('  (This is expected for rejected staff)');
            successCount++; // Count as success since it's the correct behavior
          } else {
            failureCount++;
          }
        } else {
          console.log(`⚠️  Login failed with status ${res.statusCode}`);
          failureCount++;
        }
      } catch (error) {
        console.log(`❌ Error during login test: ${error.message}`);
        failureCount++;
      }
      
      console.log('');
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    
    if (failureCount === 0) {
      console.log('\n🎉 All staff login tests passed!');
    } else {
      console.log(`\n⚠️  ${failureCount} staff login test(s) had issues.`);
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
testAllStaffLoginsFinal();
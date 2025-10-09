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

// Function to test the actual login endpoint
const testLoginEndpoint = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n🔍 Testing Login Endpoint\n');
    
    // Test cases
    const testCases = [
      {
        email: 'kevin@gmail.com',
        password: '123456',
        userType: 'staff',
        description: 'Kevin (approved staff with known password)'
      },
      {
        email: 'lamala@gmail.com',
        password: '123456', // We don't know Lamala's actual password
        userType: 'staff',
        description: 'Lamala (approved staff)'
      }
    ];
    
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
        } else if (res.statusCode === 401) {
          console.log('❌ Authentication failed (incorrect credentials)');
        } else {
          console.log(`⚠️  Login failed with status ${res.statusCode}`);
        }
      } catch (error) {
        console.log(`❌ Error during login test: ${error.message}`);
      }
      
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
testLoginEndpoint();
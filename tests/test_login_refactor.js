// Test script to verify login refactor
import axios from 'axios';

// Test the login endpoint with automatic role detection
async function testLogin() {
  try {
    console.log('Testing login with automatic role detection...');
    
    // Test login without specifying userType (should be detected automatically)
    const response = await axios.post('http://localhost:5011/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Login successful with automatic role detection');
      console.log('User role:', response.data.data.user.type);
    } else {
      console.log('❌ Login failed:', response.data.message);
    }
  } catch (error) {
    console.log('Error during login test:', error.message);
  }
}

testLogin();
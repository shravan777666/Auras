// Test the reschedule appointment API endpoint
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5014/api'; // Updated to the correct port
const TEST_APPOINTMENT_ID = '68f524f7b3aa5c360d8b2fb9';
const TEST_STAFF_ID = '68ccef3cfaf3e420e3dae39f'; // Kevin who now has the "Hair" skill

// Test data
const testData = {
  newDateTime: '2025-10-25T14:30',
  newStaffId: TEST_STAFF_ID,
  newStatus: 'Approved',
  notes: 'Testing reschedule functionality'
};

async function testReschedule() {
  try {
    console.log('Testing reschedule appointment functionality...');
    
    // Make the reschedule request
    // Note: In a real test, you would need a valid authentication token
    const response = await axios.patch(
      `${BASE_URL}/salon/appointments/${TEST_APPOINTMENT_ID}/reschedule`,
      testData
      // Note: We're not including authentication headers for this test
      // In a real scenario, you would need to include a valid JWT token
    );
    
    console.log('Reschedule successful:', response.data);
  } catch (error) {
    // Log the full error details
    console.log('Reschedule test completed with status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Error message:', error.message);
    
    // If it's a 401/403 error, it's expected since we don't have auth
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication required - this is expected in a test without valid tokens');
    } else if (error.response?.status === 400) {
      console.log('Bad request - checking if it\'s the skill validation error');
      if (error.response?.data?.message?.includes('skills')) {
        console.log('❌ Skill validation error still present');
      } else {
        console.log('❌ Other validation error');
      }
    } else {
      console.log('❌ Unexpected error');
    }
  }
}

testReschedule();
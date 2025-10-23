// Test script to verify reschedule appointment functionality
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5011/api';
const TEST_APPOINTMENT_ID = '68f524f7b3aa5c360d8b2fb9'; // Replace with actual appointment ID

// Test data
const testData = {
  newDateTime: '2025-10-25T14:30',
  newStaffId: '67f524f7b3aa5c360d8b2fb8', // Replace with actual staff ID
  newStatus: 'Approved',
  notes: 'Testing reschedule functionality'
};

async function testReschedule() {
  try {
    console.log('Testing reschedule appointment functionality...');
    
    // Make the reschedule request
    const response = await axios.patch(
      `${BASE_URL}/salon/appointments/${TEST_APPOINTMENT_ID}/reschedule`,
      testData,
      {
        headers: {
          'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE', // Replace with actual token
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Reschedule successful:', response.data);
  } catch (error) {
    console.error('Reschedule failed:', error.response?.data || error.message);
  }
}

testReschedule();
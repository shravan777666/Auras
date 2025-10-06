// Test script for the new next appointment endpoint
import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5003/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with a valid staff JWT token

async function testNextAppointmentEndpoint() {
  try {
    console.log('Testing Next Appointment Endpoint...\n');
    
    // Make request to the new endpoint
    const response = await axios.get(`${BASE_URL}/staff/next-appointment`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Endpoint is working correctly!');
      if (response.data.data) {
        console.log('Next appointment found:');
        console.log('- Client:', response.data.data.clientName);
        console.log('- Service:', response.data.data.serviceName);
        console.log('- Start Time:', response.data.data.startTime);
        console.log('- Countdown:', response.data.data.countdownText);
        console.log('- Color:', response.data.data.countdownColor);
        console.log('- Notes:', response.data.data.clientNotes || 'None');
      } else {
        console.log('No upcoming appointments found for today.');
      }
    } else {
      console.log('\n❌ Endpoint returned an error:');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    console.error('\n❌ Error testing endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Run the test
testNextAppointmentEndpoint();
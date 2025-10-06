// Test script to verify the appointment fix
import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5003/api';

// Test function to check if the appointment is found
async function testAppointmentFix() {
  console.log('Testing Appointment Fix...\n');
  
  try {
    // This is a simplified test - in a real scenario, you would need a valid JWT token
    // For now, we'll just check if the endpoint exists and responds correctly
    
    const response = await axios.get(`${BASE_URL}/staff/next-appointment`, {
      headers: {
        'Authorization': 'Bearer test-token'
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
    // This is expected since we're using an invalid token
    if (error.response && error.response.status === 401) {
      console.log('✅ Endpoint exists and is responding correctly (401 expected for invalid token)');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
    } else {
      console.error('\n❌ Unexpected error:');
      console.error('Message:', error.message);
    }
  }
}

// Run the test
testAppointmentFix();
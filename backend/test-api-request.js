// Test script to make an actual HTTP request to the block time endpoint
import axios from 'axios';

async function testApiRequest() {
  try {
    console.log('🔍 Testing API request to block time endpoint...');
    
    const testData = {
      date: '2025-10-30',
      startTime: '14:00',
      endTime: '15:00',
      reason: 'Lunch'
    };
    
    console.log('📝 Making request with data:', testData);
    
    // Make the actual HTTP request
    const response = await axios.post('http://localhost:50111/api/schedule-requests/block-time', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', response.data);
    
    if (response.status === 200 && response.data?.success) {
      console.log('\n🎉 API request completed successfully!');
    } else {
      console.log('\n❌ API request failed!');
    }
  } catch (error) {
    console.error('❌ Error making API request:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

testApiRequest();
// Test the exact API call that the frontend would make
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFrontendAPICall() {
  try {
    // Create an axios instance similar to the frontend api.js
    const api = axios.create({
      baseURL: 'http://localhost:5003/api',
      withCredentials: true,
    });
    
    // We'll need to login first to get a token
    console.log('=== Testing frontend API call ===');
    
    // Since we can't easily authenticate without the full login flow,
    // let's directly test the backend function with the same logic
    // that the frontend service uses
    
    // Import and test the actual service function
    const { scheduleRequestService } = await import('../frontend/src/services/scheduleRequests.js');
    
    console.log('Frontend service imported successfully');
    
  } catch (error) {
    console.error('Error testing frontend API call:', error.message);
    
    // Let's check what the actual axios call would return
    console.log('\n=== Simulating axios response structure ===');
    
    // Based on our test, this is what the actual response looks like:
    const mockResponse = {
      data: {
        success: true,
        data: {
          items: [
            {
              _id: "68e4798fa8966bcdaf2f99b0",
              type: "leave",
              status: "pending",
              createdAt: "2025-10-07T02:23:11.507Z",
              staffId: {
                _id: "68ccef3cfaf3e420e3dae39f",
                name: "kevin",
                position: "Hair Extensions Specialist"
              },
              blockTime: {},
              leave: {
                startDate: "2025-10-09",
                endDate: "2025-10-10",
                reason: "Leave",
                notes: "please......."
              },
              shiftSwap: {}
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 1
          }
        }
      }
    };
    
    console.log('Mock response:', JSON.stringify(mockResponse, null, 2));
    
    // Test how the component would process this:
    console.log('\n=== Testing component logic ===');
    const processedData = mockResponse.data.data.items || mockResponse.data.data;
    console.log('Processed data:', processedData);
    console.log('Data type:', Array.isArray(processedData) ? 'Array' : typeof processedData);
    console.log('Array length:', Array.isArray(processedData) ? processedData.length : 'N/A');
  }
}

testFrontendAPICall();
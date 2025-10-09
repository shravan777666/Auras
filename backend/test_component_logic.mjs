// Test how the frontend component processes the response
async function testComponentLogic() {
  console.log('=== Testing component response processing logic ===');
  
  // This is the actual response format from our backend
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
  
  console.log('Mock response structure:');
  console.log(JSON.stringify(mockResponse, null, 2));
  
  // This is how the component processes the response (line 13 in PendingScheduleRequests.jsx)
  console.log('\n=== Component processing logic ===');
  const requests = mockResponse.data.data.items || mockResponse.data.data;
  console.log('Result of (response.data.data.items || response.data.data):', requests);
  console.log('Is array:', Array.isArray(requests));
  console.log('Array length:', requests.length);
  
  if (Array.isArray(requests) && requests.length > 0) {
    console.log('\nFirst request details:');
    console.log('- ID:', requests[0]._id);
    console.log('- Type:', requests[0].type);
    console.log('- Staff Name:', requests[0].staffId?.name);
    console.log('- Staff Position:', requests[0].staffId?.position);
  }
  
  console.log('\n=== Conclusion ===');
  console.log('The component logic should work correctly with this response format.');
  console.log('If the dashboard is showing "No pending schedule requests", the issue might be:');
  console.log('1. Authentication/authorization - the API call might be failing');
  console.log('2. Network issues - the API call might not be reaching the backend');
  console.log('3. The user might not be a salon owner');
  console.log('4. There might be an error in the API call that is being caught');
}

testComponentLogic();
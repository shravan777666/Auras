import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5005';

// Test the forgot password endpoint
async function testForgotPassword() {
  console.log('🧪 Testing forgot password endpoint...\n');

  const testCases = [
    {
      name: 'Valid email with customer user type',
      data: {
        email: 'test@example.com',
        userType: 'customer'
      }
    },
    {
      name: 'Non-existent email with customer user type',
      data: {
        email: 'nonexistent@example.com',
        userType: 'customer'
      }
    },
    {
      name: 'Invalid email format',
      data: {
        email: 'invalid-email',
        userType: 'customer'
      }
    },
    {
      name: 'Missing email field',
      data: {
        userType: 'customer'
      }
    },
    {
      name: 'Missing userType field',
      data: {
        email: 'test@example.com'
      }
    },
    {
      name: 'Invalid userType',
      data: {
        email: 'test@example.com',
        userType: 'invalid'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`📤 Sending:`, JSON.stringify(testCase.data, null, 2));

    try {
      const response = await fetch(`${BASE_URL}/api/forgot-password/request-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);

      const responseText = await response.text();
      console.log(`📥 Response:`, responseText);

      // Try to parse as JSON if possible
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          console.log(`📦 Parsed:`, JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          console.log(`❌ Failed to parse JSON:`, parseError.message);
        }
      }

    } catch (error) {
      console.error(`❌ Request failed:`, error.message);
    }

    console.log('---'.repeat(20));
  }
}

testForgotPassword().catch(console.error);
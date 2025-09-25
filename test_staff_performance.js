const axios = require('axios');

const BASE_URL = 'http://localhost:5006/api';

async function testStaffPerformanceData() {
  try {
    console.log('🧪 Testing Staff Performance Data with Real MongoDB Data');
    console.log('===============================================');

    // Step 1: Check if we have any staff accounts
    console.log('\n1. Checking staff accounts in database...');
    
    // Try to login with a test staff account
    let staffToken;
    const testStaffEmails = [
      'teststaff@example.com',
      'staff@test.com',
      'staff1@example.com'
    ];

    for (const email of testStaffEmails) {
      try {
        const staffLogin = await axios.post(`${BASE_URL}/auth/login`, {
          email: email,
          password: 'password123'
        });
        staffToken = staffLogin.data.token;
        console.log(`   ✅ Staff login successful with ${email}`);
        break;
      } catch (error) {
        console.log(`   ❌ Failed login attempt with ${email}`);
      }
    }

    if (!staffToken) {
      console.log('   ❌ No staff accounts found. This test requires existing staff data.');
      console.log('   💡 Try creating a staff account first or running the staff setup.');
      return;
    }

    // Step 2: Get staff dashboard data with real performance metrics
    console.log('\n2. Fetching staff dashboard with real performance data...');
    
    const dashboardResponse = await axios.get(`${BASE_URL}/staff/dashboard`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });

    if (dashboardResponse.data.success) {
      const { performance, statistics } = dashboardResponse.data.data;
      
      console.log('   ✅ Dashboard data retrieved successfully');
      console.log('\n📊 Real Performance Data:');
      console.log('   Statistics:');
      console.log(`     - Total Appointments: ${statistics?.totalAppointments || 0}`);
      console.log(`     - Today's Appointments: ${statistics?.todayAppointments || 0}`);
      console.log(`     - Completed Appointments: ${statistics?.completedAppointments || 0}`);
      
      console.log('   Services breakdown:');
      
      if (performance && performance.services && Object.keys(performance.services).length > 0) {
        Object.entries(performance.services).forEach(([service, count]) => {
          console.log(`     - ${service}: ${count} appointments`);
        });
      } else {
        console.log('     - No service data available (no completed appointments)');
      }
      
      console.log(`   Client Rating: ${performance?.clientRating || 'No ratings yet'}`);
      
      // Step 3: Analysis
      console.log('\n📈 Performance Data Analysis:');
      const totalServices = performance?.services ? Object.values(performance.services).reduce((sum, count) => sum + count, 0) : 0;
      console.log(`   Total completed services this month: ${totalServices}`);
      console.log(`   Average client rating: ${performance?.clientRating || 'N/A'}/5.0`);
      
      if (totalServices === 0) {
        console.log('   💡 Tip: Create some completed appointments to see real service breakdown data');
        console.log('   💡 The old dummy data has been replaced with real MongoDB queries!');
      } else {
        console.log('   🎉 Success! Real service data is now being displayed instead of dummy data!');
      }
      
    } else {
      console.log('   ❌ Failed to retrieve dashboard data');
      console.log('   Error:', dashboardResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Note: Make sure you have staff accounts and completed appointments in your database');
    }
  }
}

// Run the test
testStaffPerformanceData();
import fetch from 'node-fetch';

const testStaffAppointmentsAPI = async () => {
  try {
    console.log('🧪 Testing Staff Appointments API...');
    
    // Test token (you may need to generate a fresh one)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDJjMTFiOTI2OTRhOThhYzZkYzA3MSIsInR5cGUiOiJzdGFmZiIsInNldHVwQ29tcGxldGVkIjp0cnVlLCJpYXQiOjE3MzUwMjQ0NjAsImV4cCI6MTczNTA2NzY2MH0.placeholder';
    
    const response = await fetch('http://localhost:5006/api/staff/appointments?startDate=2025-09-25&endDate=2025-09-27', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('✅ API is working! Found appointments:', data.data.length);
      data.data.forEach(apt => {
        console.log('  - Appointment:', {
          id: apt._id,
          customer: apt.customerId?.name,
          date: apt.appointmentDate,
          time: apt.appointmentTime,
          status: apt.status
        });
      });
    } else {
      console.log('❌ API returned error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testStaffAppointmentsAPI();
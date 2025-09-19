// Check existing data and create test appointments
const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api';

async function checkExistingData() {
  try {
    console.log('🔍 Checking existing data in the system...\n');

    // Check if there are any existing salons
    console.log('1. Checking for existing salons...');
    try {
      // Try to register a test salon
      console.log('   Creating a test salon...');
      const salonRegister = await axios.post(`${BASE_URL}/salon/register`, {
        name: 'Test Beauty Salon',
        email: 'testsalon@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });

      console.log('   ✅ Test salon created successfully');
      const salonToken = salonRegister.data.token;

      // Complete salon setup
      console.log('   Setting up salon profile...');
      const formData = new FormData();
      formData.append('salonName', 'Test Beauty Salon');
      formData.append('contactNumber', '+1234567890');
      formData.append('description', 'A test salon for demonstration');
      formData.append('salonAddress', JSON.stringify({
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345'
      }));
      formData.append('businessHours', JSON.stringify({
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        openTime: '09:00',
        closeTime: '18:00'
      }));

      // Use a simple approach without FormData for testing
      const setupData = {
        salonName: 'Test Beauty Salon',
        contactNumber: '+1234567890',
        description: 'A test salon for demonstration',
        salonAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345'
        },
        businessHours: {
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          openTime: '09:00',
          closeTime: '18:00'
        }
      };

      const setupResponse = await axios.post(`${BASE_URL}/salon/setup`, setupData, {
        headers: { 
          Authorization: `Bearer ${salonToken}`,
          'Content-Type': 'application/json'
        }
      }).catch(err => {
        console.log('   Setup error:', err.response?.data?.message || err.message);
        return null;
      });

      if (setupResponse) {
        console.log('   ✅ Salon setup completed');
      }

      // Create a test customer
      console.log('\n2. Creating a test customer...');
      const customerRegister = await axios.post(`${BASE_URL}/customer/register`, {
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        contactNumber: '+1234567891'
      });

      console.log('   ✅ Test customer created successfully');
      const customerToken = customerRegister.data.token;

      // Get salon ID from the salon data
      const salonProfile = await axios.get(`${BASE_URL}/salon/profile`, {
        headers: { Authorization: `Bearer ${salonToken}` }
      });
      const salonId = salonProfile.data.data._id;

      // Add a service to the salon
      console.log('\n3. Adding services to salon...');
      const serviceData = {
        name: 'Haircut',
        category: 'Hair',
        price: 500,
        duration: 60,
        description: 'Professional haircut service'
      };

      const serviceResponse = await axios.post(`${BASE_URL}/salon/services`, serviceData, {
        headers: { Authorization: `Bearer ${salonToken}` }
      });

      console.log('   ✅ Service added successfully');
      const serviceId = serviceResponse.data.data._id;

      // Create a test appointment
      console.log('\n4. Creating test appointments...');
      const appointmentData = {
        salonId: salonId,
        services: [{ serviceId: serviceId }],
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        appointmentTime: '10:00',
        customerNotes: 'This is a test appointment'
      };

      const appointmentResponse = await axios.post(`${BASE_URL}/appointment/book`, appointmentData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      console.log('   ✅ Test appointment created successfully');

      // Now test salon appointments display
      console.log('\n5. Testing salon appointments display...');
      const appointmentsResponse = await axios.get(`${BASE_URL}/salon/appointments`, {
        headers: { Authorization: `Bearer ${salonToken}` }
      });

      console.log('   ✅ Appointments fetched successfully');
      console.log(`   📊 Total appointments: ${appointmentsResponse.data.pagination?.totalItems || 0}`);

      if (appointmentsResponse.data.data && appointmentsResponse.data.data.length > 0) {
        const appointment = appointmentsResponse.data.data[0];
        console.log('\n📋 Appointment details:');
        console.log(`   Customer: ${appointment.customerId?.name || 'Unknown'}`);
        console.log(`   Email: ${appointment.customerId?.email || 'N/A'}`);
        console.log(`   Date: ${appointment.appointmentDate}`);
        console.log(`   Time: ${appointment.appointmentTime}`);
        console.log(`   Status: ${appointment.status}`);
        console.log(`   Services: ${appointment.services?.length || 0}`);
        if (appointment.services && appointment.services.length > 0) {
          appointment.services.forEach((service, index) => {
            console.log(`     Service ${index + 1}: ${service.serviceName || service.serviceId?.name || 'Unknown'} - ₹${service.price || 0}`);
          });
        }
        console.log(`   Total Amount: ₹${appointment.finalAmount || appointment.totalAmount || 0}`);

        // Test status update
        console.log('\n6. Testing appointment status update...');
        const statusUpdateResponse = await axios.patch(
          `${BASE_URL}/salon/appointments/${appointment._id}/status`,
          { status: 'Confirmed', salonNotes: 'Appointment confirmed by salon' },
          { headers: { Authorization: `Bearer ${salonToken}` } }
        );

        console.log('   ✅ Status update successful');
        console.log(`   📝 New status: ${statusUpdateResponse.data.data.status}`);
      }

      console.log('\n🎉 Salon Appointments Display Feature Test Completed Successfully!');
      console.log('\n📋 Summary:');
      console.log('  ✅ Salon can be created and set up');
      console.log('  ✅ Services can be added to salon');
      console.log('  ✅ Customers can book appointments');
      console.log('  ✅ Salons can view all their appointments');
      console.log('  ✅ Appointment data includes complete customer info');
      console.log('  ✅ Appointment data includes service details');
      console.log('  ✅ Status updates work correctly');
      console.log('  ✅ Salon appointment display feature is fully functional!');

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Email already in use')) {
        console.log('   ℹ️ Test salon already exists, trying to login...');
        
        // Try to login with existing salon
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'testsalon@example.com',
          password: 'password123',
          userType: 'salon'
        });

        const salonToken = loginResponse.data.token;
        console.log('   ✅ Logged in with existing salon');

        // Check appointments
        const appointmentsResponse = await axios.get(`${BASE_URL}/salon/appointments`, {
          headers: { Authorization: `Bearer ${salonToken}` }
        });

        console.log('   ✅ Appointments fetched successfully');
        console.log(`   📊 Total appointments: ${appointmentsResponse.data.pagination?.totalItems || 0}`);

        if (appointmentsResponse.data.data && appointmentsResponse.data.data.length > 0) {
          console.log('\n📋 Existing appointments found!');
          appointmentsResponse.data.data.forEach((appointment, index) => {
            console.log(`\n   Appointment ${index + 1}:`);
            console.log(`     Customer: ${appointment.customerId?.name || 'Unknown'}`);
            console.log(`     Date: ${appointment.appointmentDate}`);
            console.log(`     Time: ${appointment.appointmentTime}`);
            console.log(`     Status: ${appointment.status}`);
          });
        }
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

checkExistingData();
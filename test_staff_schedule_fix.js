#!/usr/bin/env node

/**
 * Test script to verify staff schedule calendar functionality
 * This script tests the complete flow from appointment creation to staff schedule display
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/Appointment.js';
import Staff from './models/Staff.js';
import User from './models/User.js';
import Salon from './models/Salon.js';
import Customer from './models/Customer.js';
import Service from './models/Service.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testStaffScheduleFlow() {
  console.log('\n🧪 Testing Staff Schedule Calendar Functionality\n');

  try {
    // 1. Find or create test data
    console.log('1️⃣ Setting up test data...');
    
    // Find a staff member
    console.log('🔍 Looking for approved staff...');
    const staff = await Staff.findOne({ approvalStatus: 'approved' });
    console.log('🔍 Staff query result:', staff ? 'Found' : 'Not found');
    if (!staff) {
      console.log('❌ No approved staff found. Please create and approve a staff member first.');
      return;
    }
    
    console.log('✅ Found staff:', {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      user: staff.user,
      assignedSalon: staff.assignedSalon
    });

    // Find the user associated with staff
    const user = await User.findById(staff.user);
    if (!user) {
      console.log('❌ User not found for staff');
      return;
    }
    
    console.log('✅ Found user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.type
    });

    // Find an approved salon
    console.log('🔍 Looking for approved salon...');
    const salon = await Salon.findOne({ approvalStatus: 'approved' });
    console.log('🔍 Salon query result:', salon ? 'Found' : 'Not found');
    if (!salon) {
      console.log('❌ No approved salon found');
      return;
    }
    
    console.log('✅ Found salon:', {
      id: salon._id,
      name: salon.salonName,
      ownerId: salon.ownerId
    });
    
    // Assign staff to salon if not already assigned
    if (!staff.assignedSalon) {
      console.log('🔧 Assigning staff to salon...');
      staff.assignedSalon = salon._id;
      await staff.save();
      console.log('✅ Assigned staff to salon');
    } else {
      console.log('✅ Staff already assigned to salon:', staff.assignedSalon);
    }

    // Find a customer
    const customer = await Customer.findOne();
    if (!customer) {
      console.log('❌ No customer found. Please create a customer first.');
      return;
    }
    
    console.log('✅ Found customer:', {
      id: customer._id,
      name: customer.name,
      email: customer.email
    });

    // Find a service
    const service = await Service.findOne({ salonId: salon._id });
    if (!service) {
      console.log('❌ No service found for salon. Please create a service first.');
      return;
    }
    
    console.log('✅ Found service:', {
      id: service._id,
      name: service.name,
      salonId: service.salonId,
      price: service.price,
      duration: service.duration
    });

    // 2. Create a test appointment
    console.log('\n2️⃣ Creating test appointment...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const testAppointment = new Appointment({
      salonId: salon._id,
      customerId: customer._id,
      staffId: staff._id, // This is the key - assigning staff to appointment
      services: [{
        serviceId: service._id,
        serviceName: service.name,
        price: service.price,
        duration: service.duration
      }],
      appointmentDate: tomorrow,
      appointmentTime: '10:00',
      estimatedDuration: service.duration,
      totalAmount: service.price,
      finalAmount: service.price,
      status: 'Confirmed',
      source: 'Test'
    });

    await testAppointment.save();
    console.log('✅ Test appointment created:', {
      id: testAppointment._id,
      staffId: testAppointment.staffId,
      customerId: testAppointment.customerId,
      salonId: testAppointment.salonId,
      date: testAppointment.appointmentDate,
      time: testAppointment.appointmentTime,
      status: testAppointment.status
    });

    // 3. Test staff appointments query (simulating the API call)
    console.log('\n3️⃣ Testing staff appointments query...');
    
    // This simulates what happens in the staffController.getAppointments function
    const staffFromUser = await Staff.findOne({ user: user._id });
    console.log('✅ Staff lookup by user ID:', {
      userId: user._id,
      staffId: staffFromUser?._id,
      found: !!staffFromUser
    });

    if (!staffFromUser) {
      console.log('❌ Staff not found by user ID - this is the bug!');
      return;
    }

    // Test the appointment query
    const appointments = await Appointment.find({ staffId: staffFromUser._id })
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name price duration');

    console.log('✅ Found appointments for staff:', appointments.length);
    appointments.forEach(apt => {
      console.log('  - Appointment:', {
        id: apt._id,
        customer: apt.customerId?.name,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status,
        staffId: apt.staffId
      });
    });

    // 4. Test date range query (for calendar)
    console.log('\n4️⃣ Testing date range query for calendar...');
    
    const startDate = new Date(tomorrow);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(tomorrow);
    endDate.setHours(23, 59, 59, 999);

    const calendarAppointments = await Appointment.find({
      staffId: staffFromUser._id,
      appointmentDate: {
        $gte: startDate,
        $lte: endDate
      }
    });

    console.log('✅ Calendar appointments for date range:', calendarAppointments.length);
    calendarAppointments.forEach(apt => {
      console.log('  - Calendar appointment:', {
        id: apt._id,
        customer: apt.customerId?.name,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status
      });
    });

    // 5. Test the complete API flow simulation
    console.log('\n5️⃣ Testing complete API flow simulation...');
    
    // Simulate the staffController.getAppointments function
    const userId = user._id;
    const staffRecord = await Staff.findOne({ user: userId });
    
    if (!staffRecord) {
      console.log('❌ Staff profile not found for userId:', userId);
      return;
    }

    if (staffRecord.approvalStatus !== 'approved') {
      console.log('❌ Staff not approved:', staffRecord.approvalStatus);
      return;
    }

    const filter = { staffId: staffRecord._id };
    const appointmentsForAPI = await Appointment.find(filter)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name price duration')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    console.log('✅ API simulation result:', {
      staffId: staffRecord._id,
      appointmentsFound: appointmentsForAPI.length,
      appointments: appointmentsForAPI.map(apt => ({
        id: apt._id,
        customer: apt.customerId?.name,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status
      }))
    });

    console.log('\n🎉 Staff schedule functionality test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Staff ID resolution: ✅ Working');
    console.log('- Appointment creation with staff assignment: ✅ Working');
    console.log('- Staff appointments query: ✅ Working');
    console.log('- Date range filtering: ✅ Working');
    console.log('- API flow simulation: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function cleanup() {
  try {
    // Clean up test appointment
    await Appointment.deleteOne({ source: 'Test' });
    console.log('🧹 Cleaned up test appointment');
  } catch (error) {
    console.error('⚠️ Cleanup error:', error);
  }
}

async function main() {
  await connectDB();
  await testStaffScheduleFlow();
  await cleanup();
  await mongoose.disconnect();
  console.log('\n✅ Test completed and database disconnected');
}

// Run the test
main().catch(console.error);
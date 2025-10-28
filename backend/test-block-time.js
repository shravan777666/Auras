// Test script to verify block time functionality
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
import connectDB from './config/database.js';
connectDB();

// Import models
import Staff from './models/Staff.js';
import ScheduleRequest from './models/ScheduleRequest.js';
import Appointment from './models/Appointment.js';

// Test block time creation
async function testBlockTime() {
  try {
    console.log('🔍 Testing block time functionality...');
    
    // Find a sample staff member
    const staff = await Staff.findOne({});
    if (!staff) {
      console.log('❌ No staff member found in database');
      return;
    }
    
    console.log('📋 Found staff member:', {
      id: staff._id,
      name: staff.name,
      assignedSalon: staff.assignedSalon
    });
    
    if (!staff.assignedSalon) {
      console.log('❌ Staff member is not assigned to a salon');
      return;
    }
    
    // Test data for block time
    const blockTimeData = {
      date: '2025-10-30',
      startTime: '12:00',
      endTime: '13:00',
      reason: 'Lunch'
    };
    
    console.log('📝 Creating block time request with data:', blockTimeData);
    
    // Calculate duration in minutes
    const calculateDurationInMinutes = (startTime, endTime) => {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      // Handle case where end time is next day (e.g., 23:00 to 01:00)
      if (endTotalMinutes < startTotalMinutes) {
        return (24 * 60 - startTotalMinutes) + endTotalMinutes;
      }
      
      return endTotalMinutes - startTotalMinutes;
    };
    
    // Create the schedule request
    const scheduleRequest = await ScheduleRequest.create({
      staffId: staff._id,
      salonId: staff.assignedSalon,
      type: 'block-time',
      blockTime: blockTimeData,
      status: 'approved'
    });
    
    console.log('✅ Schedule request created:', scheduleRequest._id);
    
    // Create a STAFF_BLOCKED appointment
    const blockedAppointment = await Appointment.create({
      salonId: staff.assignedSalon,
      staffId: staff._id,
      customerId: null, // No customer for blocked time
      services: [{
        serviceId: null,
        serviceName: `Blocked Time - ${blockTimeData.reason}`,
        price: 0,
        duration: calculateDurationInMinutes(blockTimeData.startTime, blockTimeData.endTime)
      }],
      appointmentDate: `${blockTimeData.date}T${blockTimeData.startTime}`,
      appointmentTime: blockTimeData.startTime,
      estimatedDuration: calculateDurationInMinutes(blockTimeData.startTime, blockTimeData.endTime),
      estimatedEndTime: blockTimeData.endTime,
      totalAmount: 0,
      finalAmount: 0,
      status: 'STAFF_BLOCKED',
      customerNotes: `Staff blocked time for ${blockTimeData.reason}`,
      specialRequests: blockTimeData.reason
    });
    
    console.log('✅ STAFF_BLOCKED appointment created:', blockedAppointment._id);
    
    console.log('\n🎉 Block time functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    console.error('❌ Error stack:', error.stack);
  } finally {
    // Close connection
    mongoose.connection.close();
  }
}

testBlockTime();
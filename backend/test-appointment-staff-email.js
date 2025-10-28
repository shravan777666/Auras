// Test script to verify appointment staff assignment email functionality
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
import Appointment from './models/Appointment.js';
import Customer from './models/Customer.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';

// Import email utility
import { sendAppointmentStaffAssignmentEmail } from './utils/email.js';

async function testAppointmentStaffEmail() {
  try {
    console.log('🔍 Testing appointment staff assignment email functionality...');
    
    // Find a sample appointment with customer and salon data
    const appointment = await Appointment.findOne({
      status: 'Pending',
      customerId: { $exists: true },
      salonId: { $exists: true }
    })
    .populate('customerId', 'name email')
    .populate('salonId', 'salonName')
    .populate('services.serviceId', 'name');
    
    if (!appointment) {
      console.log('❌ No suitable appointment found for testing');
      return;
    }
    
    console.log('📋 Found appointment:', {
      id: appointment._id,
      customer: appointment.customerId?.name,
      customerEmail: appointment.customerId?.email,
      salon: appointment.salonId?.salonName
    });
    
    // Find a sample staff member
    const staff = await Staff.findOne({
      assignedSalon: appointment.salonId._id,
      isActive: true
    });
    
    if (!staff) {
      console.log('❌ No staff member found for the salon');
      return;
    }
    
    console.log('👤 Found staff member:', {
      id: staff._id,
      name: staff.name,
      position: staff.position
    });
    
    // Prepare appointment details for email
    const appointmentDetails = {
      salonName: appointment.salonId?.salonName || 'Sample Salon',
      staffName: staff.name || 'Staff Member',
      staffPosition: staff.position || 'Staff',
      date: new Date(appointment.appointmentDate).toDateString(),
      time: appointment.appointmentTime,
      services: appointment.services.map(s => s.serviceId?.name || 'Service'),
      status: 'Approved'
    };
    
    console.log('📧 Sending appointment staff assignment email with details:', appointmentDetails);
    
    // Send the email
    const result = await sendAppointmentStaffAssignmentEmail(
      appointment.customerId.email,
      appointment.customerId.name || 'Customer',
      appointmentDetails
    );
    
    if (result.success) {
      console.log('✅ Appointment staff assignment email sent successfully!');
    } else {
      console.log('❌ Failed to send appointment staff assignment email:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    // Close connection
    mongoose.connection.close();
  }
}

testAppointmentStaffEmail();
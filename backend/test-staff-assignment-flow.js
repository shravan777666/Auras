// Test script to simulate the complete staff assignment flow
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

// Import the update appointment function
import { updateAppointment } from './controllers/appointmentController.js';

async function testStaffAssignmentFlow() {
  try {
    console.log('🔍 Testing complete staff assignment flow...');
    
    // Find a sample pending appointment with customer and salon data
    const appointment = await Appointment.findOne({
      status: 'Pending',
      customerId: { $exists: true },
      salonId: { $exists: true }
    })
    .populate('customerId', 'name email')
    .populate('salonId', 'salonName')
    .populate('services.serviceId', 'name');
    
    if (!appointment) {
      console.log('❌ No suitable pending appointment found for testing');
      return;
    }
    
    console.log('📋 Found pending appointment:', {
      id: appointment._id,
      customer: appointment.customerId?.name,
      customerEmail: appointment.customerId?.email,
      salon: appointment.salonId?.salonName,
      status: appointment.status
    });
    
    // Find a sample staff member from the same salon
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
    
    // Create mock request and response objects
    const mockReq = {
      params: { appointmentId: appointment._id.toString() },
      body: { 
        staffId: staff._id.toString(),
        status: 'Approved' // This should be set automatically when staff is assigned
      },
      user: { 
        id: appointment.salonId._id.toString(), // Salon owner ID
        type: 'salon'
      }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        console.log(`✅ Response status: ${this.statusCode}`);
        console.log(`✅ Response data:`, data);
        return this;
      }
    };
    
    console.log('🔄 Simulating staff assignment update...');
    
    // Call the update appointment function
    await updateAppointment(mockReq, mockRes);
    
    // Check if the response was successful
    if (mockRes.statusCode === 200 && mockRes.body?.success) {
      console.log('\n🎉 Staff assignment flow completed successfully!');
      console.log('✅ Appointment ID:', mockRes.body.data._id);
      console.log('✅ New status:', mockRes.body.data.status);
      console.log('✅ Assigned staff ID:', mockRes.body.data.staffId);
    } else {
      console.log('\n❌ Staff assignment flow failed!');
      console.log('❌ Status code:', mockRes.statusCode);
      console.log('❌ Response body:', mockRes.body);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    // Close connection
    mongoose.connection.close();
  }
}

testStaffAssignmentFlow();
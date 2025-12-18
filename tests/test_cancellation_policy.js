// Test script for the cancellation policy system
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './backend/models/Appointment.js';
import CancellationPolicy from './backend/models/CancellationPolicy.js';
import connectDB from './backend/config/database.js';

dotenv.config();

const testCancellationPolicy = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Create a test salon ID (replace with actual salon ID)
    const testSalonId = new mongoose.Types.ObjectId();
    
    // Create a test cancellation policy
    const policy = await CancellationPolicy.create({
      salonId: testSalonId,
      noticePeriod: 24,
      lateCancellationPenalty: 50,
      noShowPenalty: 100,
      isActive: true,
      policyMessage: 'Please cancel your appointment at least 24 hours in advance to avoid penalties.'
    });
    
    console.log('Created test cancellation policy:', policy);
    
    // Create a test appointment
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2); // 2 days in the future
    
    const appointment = await Appointment.create({
      salonId: testSalonId,
      customerId: new mongoose.Types.ObjectId(),
      staffId: new mongoose.Types.ObjectId(),
      services: [{
        serviceId: new mongoose.Types.ObjectId(),
        serviceName: 'Haircut',
        price: 100,
        duration: 30
      }],
      appointmentDate: futureDate.toISOString().split('T')[0] + 'T10:00',
      appointmentTime: '10:00',
      estimatedDuration: 30,
      totalAmount: 100,
      finalAmount: 100,
      status: 'Approved'
    });
    
    console.log('Created test appointment:', appointment);
    
    // Test cancellation policy methods
    const canCancel = await appointment.canBeCancelledUnderPolicy();
    console.log('Can cancel under policy:', canCancel);
    
    const fee = await appointment.calculateCancellationFee();
    console.log('Calculated cancellation fee:', fee);
    
    // Test late cancellation (simulate by changing appointment date)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday
    
    appointment.appointmentDate = pastDate.toISOString().split('T')[0] + 'T10:00';
    await appointment.save();
    
    const noShowFee = await appointment.calculateCancellationFee();
    console.log('No-show cancellation fee:', noShowFee);
    
    // Clean up test data
    await CancellationPolicy.deleteOne({ _id: policy._id });
    await Appointment.deleteOne({ _id: appointment._id });
    
    console.log('Test completed successfully');
    
    // Close connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Test failed:', error);
    mongoose.connection.close();
  }
};

// Run test
testCancellationPolicy();
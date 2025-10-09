import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Function to debug the specific schedule request causing the error
const debugRejectError = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // The specific request ID from the error
    const requestId = '68e4a0542665c8375ab21952';
    
    // Find the schedule request
    const scheduleRequest = await ScheduleRequest.findById(requestId);
    
    if (!scheduleRequest) {
      console.log(`Schedule request with ID ${requestId} not found`);
      await mongoose.connection.close();
      return;
    }
    
    console.log('Schedule Request Details:');
    console.log(`ID: ${scheduleRequest._id}`);
    console.log(`Type: ${scheduleRequest.type}`);
    console.log(`Status: ${scheduleRequest.status}`);
    console.log(`Staff ID: ${scheduleRequest.staffId}`);
    console.log(`Salon ID: ${scheduleRequest.salonId}`);
    console.log(`Created At: ${scheduleRequest.createdAt}`);
    
    // Check the staff member
    const staff = await Staff.findById(scheduleRequest.staffId);
    console.log('\nStaff Details:');
    console.log(`Staff Found: ${!!staff}`);
    if (staff) {
      console.log(`Staff ID: ${staff._id}`);
      console.log(`Staff Name: ${staff.name}`);
      console.log(`Staff Email: ${staff.email}`);
      console.log(`Staff Assigned Salon: ${staff.assignedSalon}`);
      console.log(`Staff User Ref: ${staff.user}`);
    }
    
    // Check the salon
    if (scheduleRequest.salonId) {
      const salon = await Salon.findById(scheduleRequest.salonId);
      console.log('\nSalon Details:');
      console.log(`Salon Found: ${!!salon}`);
      if (salon) {
        console.log(`Salon ID: ${salon._id}`);
        console.log(`Salon Name: ${salon.salonName}`);
        console.log(`Salon Owner ID: ${salon.ownerId}`);
      }
    }
    
    // Try to simulate the reject process
    console.log('\n--- Simulating Reject Process ---');
    
    try {
      // Update request status
      scheduleRequest.status = 'rejected';
      scheduleRequest.rejectedBy = '68cceb53faf3e420e3dae253'; // Sample salon owner ID
      scheduleRequest.rejectedAt = new Date();
      scheduleRequest.rejectionReason = 'Request denied by salon owner';
      
      await scheduleRequest.save();
      console.log('✅ Successfully updated schedule request status');
    } catch (saveError) {
      console.log('❌ Error saving schedule request:', saveError.message);
      console.log('Save error details:', saveError);
    }
    
    // Try to create staff notification
    if (staff && staff.user) {
      try {
        // Get salon information for the notification
        let salonName = 'Your Salon';
        let salonOwnerName = 'Salon Owner';
        if (staff.assignedSalon) {
          const salon = await Salon.findById(staff.assignedSalon);
          if (salon) {
            salonName = salon.salonName;
            salonOwnerName = salon.ownerName || 'Salon Owner';
          }
        }
        
        console.log('\n--- Notification Details ---');
        console.log(`Staff ID: ${staff._id}`);
        console.log(`Staff Name: ${staff.name}`);
        console.log(`Staff Email: ${staff.email}`);
        console.log(`Sender ID: 68cceb53faf3e420e3dae253`);
        console.log(`Sender Type: Salon`);
        console.log(`Sender Name: ${salonOwnerName}`);
        console.log(`Sender Email: ${staff.email}`);
        console.log(`Sender Salon Name: ${salonName}`);
        console.log(`Subject: Request Rejected`);
        console.log(`Message: Your ${scheduleRequest.type} request has been rejected. Reason: Request denied by salon owner`);
        
      } catch (notificationError) {
        console.log('❌ Error creating staff notification:', notificationError.message);
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error debugging reject error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
debugRejectError();
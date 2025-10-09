import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';
import StaffNotification from './models/StaffNotification.js';

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

// Function to test the reject fix
const testRejectFix = async () => {
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
    
    console.log('Testing reject functionality...');
    console.log(`Current status: ${scheduleRequest.status}`);
    
    // Simulate the reject process with proper error handling
    if (scheduleRequest.status === 'rejected') {
      console.log('❌ Request is already rejected');
      await mongoose.connection.close();
      return;
    }
    
    // Update request status
    scheduleRequest.status = 'rejected';
    scheduleRequest.rejectedBy = '68cceb53faf3e420e3dae253'; // Sample salon owner ID
    scheduleRequest.rejectedAt = new Date();
    scheduleRequest.rejectionReason = 'Request denied by salon owner';
    
    await scheduleRequest.save();
    console.log('✅ Successfully updated schedule request status');
    
    // Send notification to staff
    const staff = await Staff.findById(scheduleRequest.staffId);
    if (staff && staff.user) {
      try {
        // Get salon information for the notification
        let salonName = 'Your Salon';
        let salonOwnerName = 'Salon Owner';
        if (staff.assignedSalon) {
          const salon = await Salon.findById(staff.assignedSalon);
          if (salon) {
            salonName = salon.salonName || 'Your Salon';
            salonOwnerName = salon.ownerName || 'Salon Owner';
          }
        }
        
        const notification = await StaffNotification.create({
          staffId: staff._id,
          staffName: staff.name,
          staffEmail: staff.email,
          senderId: '68cceb53faf3e420e3dae253',
          senderType: 'Salon',
          senderName: salonOwnerName,
          senderEmail: staff.email,
          senderSalonName: salonName,
          type: 'broadcast',
          subject: 'Request Rejected',
          message: `Your ${scheduleRequest.type} request has been rejected. Reason: Request denied by salon owner`,
          targetSkill: 'All Staff',
          category: 'announcement', // Changed to valid category
          priority: 'medium'
        });
        
        console.log('✅ Successfully created staff notification');
        console.log(`Notification ID: ${notification._id}`);
      } catch (notificationError) {
        console.log('❌ Error creating staff notification:', notificationError.message);
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error testing reject fix:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
testRejectFix();
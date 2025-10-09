import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from './models/Staff.js';
import ScheduleRequest from './models/ScheduleRequest.js';

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

// Function to fix schedule request salonId
const fixScheduleRequestSalonId = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // The specific schedule request ID from your query
    const scheduleRequestId = '68e4798fa8966bcdaf2f99b0';
    
    // Find the schedule request
    const scheduleRequest = await ScheduleRequest.findById(scheduleRequestId);
    if (!scheduleRequest) {
      console.log('Schedule request not found');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('Found schedule request:', scheduleRequest._id);
    console.log('Current staff ID in request:', scheduleRequest.staffId);
    
    // Check if the staffId exists
    let staff = await Staff.findById(scheduleRequest.staffId);
    let correctedStaffId = null;
    
    if (!staff) {
      console.log('Staff member not found. Looking for similar staff members...');
      
      // Let's find all staff members to see if there's a close match
      const allStaff = await Staff.find({}, '_id name email assignedSalon');
      console.log(`Found ${allStaff.length} staff members:`);
      allStaff.forEach(staff => {
        console.log(`ID: ${staff._id}, Name: ${staff.name}, Email: ${staff.email}, Salon: ${staff.assignedSalon}`);
        
        // Check if this is a close match (differs by only one character)
        const staffIdStr = staff._id.toString();
        const requestIdStr = scheduleRequest.staffId.toString();
        
        if (staffIdStr.length === requestIdStr.length) {
          let diffCount = 0;
          for (let i = 0; i < staffIdStr.length; i++) {
            if (staffIdStr[i] !== requestIdStr[i]) {
              diffCount++;
            }
          }
          
          if (diffCount === 1) {
            console.log(`Found close match: ${staff._id}`);
            correctedStaffId = staff._id;
          }
        }
      });
      
      if (correctedStaffId) {
        console.log(`Correcting staff ID from ${scheduleRequest.staffId} to ${correctedStaffId}`);
        // Update the schedule request with the corrected staffId and add salonId
        const updatedScheduleRequest = await ScheduleRequest.findByIdAndUpdate(
          scheduleRequestId,
          { 
            staffId: correctedStaffId,
            salonId: allStaff.find(s => s._id.toString() === correctedStaffId.toString()).assignedSalon
          },
          { new: true, runValidators: true }
        );
        
        console.log('Successfully updated schedule request with corrected staffId and salonId:', {
          _id: updatedScheduleRequest._id,
          staffId: updatedScheduleRequest.staffId,
          salonId: updatedScheduleRequest.salonId
        });
      } else {
        console.log('No close match found. Cannot automatically correct.');
        await mongoose.connection.close();
        process.exit(1);
      }
    } else {
      console.log(`Found staff member: ${staff.name} (${staff.email})`);
      
      if (!staff.assignedSalon) {
        console.log('Staff member has no assigned salon');
        await mongoose.connection.close();
        process.exit(1);
      }
      
      console.log(`Staff assigned salon: ${staff.assignedSalon}`);
      
      // Update the schedule request with the salonId
      const updatedScheduleRequest = await ScheduleRequest.findByIdAndUpdate(
        scheduleRequestId,
        { salonId: staff.assignedSalon },
        { new: true, runValidators: true }
      );
      
      console.log('Successfully updated schedule request with salonId:', {
        _id: updatedScheduleRequest._id,
        staffId: updatedScheduleRequest.staffId,
        salonId: updatedScheduleRequest.salonId
      });
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error updating schedule request:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
fixScheduleRequestSalonId();
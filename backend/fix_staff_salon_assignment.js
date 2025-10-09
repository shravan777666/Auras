#!/usr/bin/env node

/**
 * Script to fix staff salon assignments based on existing schedule requests
 * This script will update staff members to have the correct assignedSalon field
 * based on the salonId in their schedule requests
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import connectDB from './config/database.js';
import ScheduleRequest from './models/ScheduleRequest.js';
import Staff from './models/Staff.js';
import Salon from './models/Salon.js';

async function fixStaffSalonAssignments() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Find all schedule requests with salonId but without staff having assignedSalon
    const requestsWithSalonId = await ScheduleRequest.find({ 
      salonId: { $exists: true, $ne: null }
    }).select('staffId salonId');
    
    console.log(`Found ${requestsWithSalonId.length} schedule requests with salonId`);
    
    let updatedCount = 0;
    
    // Process each request
    for (const request of requestsWithSalonId) {
      try {
        // Check if staff member exists and has assignedSalon
        const staff = await Staff.findById(request.staffId);
        
        if (staff && !staff.assignedSalon) {
          // Update the staff member with the salonId from the request
          staff.assignedSalon = request.salonId;
          await staff.save();
          updatedCount++;
          console.log(`✅ Updated staff ${staff._id} with assignedSalon ${request.salonId}`);
        } else if (staff && staff.assignedSalon && staff.assignedSalon.toString() !== request.salonId.toString()) {
          console.log(`⚠️  Staff ${staff._id} already has assignedSalon ${staff.assignedSalon}, but request has salonId ${request.salonId}`);
        } else if (!staff) {
          console.log(`❌ Staff ${request.staffId} not found`);
        }
      } catch (error) {
        console.error(`❌ Error updating staff ${request.staffId}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fix completed! Updated ${updatedCount} staff members with assignedSalon`);
    
    // Also fix any schedule requests that are missing salonId
    console.log('\n🔍 Checking for schedule requests missing salonId...');
    const requestsWithoutSalonId = await ScheduleRequest.find({ 
      salonId: { $exists: false },
      staffId: { $exists: true }
    }).select('staffId');
    
    console.log(`Found ${requestsWithoutSalonId.length} schedule requests without salonId`);
    
    let updatedRequestCount = 0;
    
    // Process each request
    for (const request of requestsWithoutSalonId) {
      try {
        // Get the staff member
        const staff = await Staff.findById(request.staffId);
        
        if (staff && staff.assignedSalon) {
          // Update the request with salonId
          request.salonId = staff.assignedSalon;
          await request.save();
          updatedRequestCount++;
          console.log(`✅ Updated request ${request._id} with salonId ${staff.assignedSalon}`);
        } else if (staff && !staff.assignedSalon) {
          console.log(`⚠️  Staff ${staff._id} has no assignedSalon, cannot update request ${request._id}`);
        } else if (!staff) {
          console.log(`❌ Staff ${request.staffId} not found for request ${request._id}`);
        }
      } catch (error) {
        console.error(`❌ Error updating request ${request._id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fix completed! Updated ${updatedRequestCount} schedule requests with salonId`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
}

// Run the fix
fixStaffSalonAssignments();
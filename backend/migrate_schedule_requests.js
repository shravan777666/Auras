#!/usr/bin/env node

/**
 * Migration script to add salonId field to existing schedule requests
 * This script populates the salonId field for all existing schedule requests
 * based on the staff member's assigned salon
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

async function runMigration() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Find all schedule requests without salonId
    const requestsWithoutSalonId = await ScheduleRequest.find({ 
      salonId: { $exists: false } 
    });
    
    console.log(`Found ${requestsWithoutSalonId.length} schedule requests without salonId`);
    
    let updatedCount = 0;
    
    // Process each request
    for (const request of requestsWithoutSalonId) {
      try {
        // Get the staff member
        const staff = await Staff.findById(request.staffId);
        
        if (staff && staff.assignedSalon) {
          // Update the request with salonId
          request.salonId = staff.assignedSalon;
          await request.save();
          updatedCount++;
          console.log(`✅ Updated request ${request._id} with salonId ${staff.assignedSalon}`);
        } else {
          console.log(`⚠️  Could not find salon for request ${request._id} (staff: ${request.staffId})`);
        }
      } catch (error) {
        console.error(`❌ Error updating request ${request._id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed! Updated ${updatedCount} schedule requests with salonId`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
}

// Run the migration
runMigration();
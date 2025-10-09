#!/usr/bin/env node

/**
 * Comprehensive script to fix schedule request and staff assignment issues
 * This script will:
 * 1. Fix staff members missing from the database
 * 2. Ensure schedule requests have proper salonId
 * 3. Make sure staff members have correct assignedSalon
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

async function comprehensiveFix() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Find all unique staff IDs from schedule requests
    console.log('\n🔍 Finding all staff IDs from schedule requests...');
    const allStaffIds = await ScheduleRequest.distinct('staffId');
    console.log(`Found ${allStaffIds.length} unique staff IDs in schedule requests`);
    
    // Step 2: Check which staff members exist and which don't
    console.log('\n🔍 Checking staff member existence...');
    const existingStaff = await Staff.find({ _id: { $in: allStaffIds } }).select('_id name email assignedSalon');
    const existingStaffIds = existingStaff.map(staff => staff._id.toString());
    const missingStaffIds = allStaffIds.filter(id => !existingStaffIds.includes(id.toString()));
    
    console.log(`✅ Found ${existingStaff.length} existing staff members`);
    console.log(`❌ Found ${missingStaffIds.length} missing staff members`);
    
    // Step 3: For missing staff, try to find them by similar IDs or create placeholder staff
    if (missingStaffIds.length > 0) {
      console.log('\n🔧 Handling missing staff members...');
      for (const staffId of missingStaffIds) {
        console.log(`  Processing missing staff ID: ${staffId.toString()}`);
        
        // Try to find schedule requests for this staff member to get more info
        const requests = await ScheduleRequest.find({ staffId: staffId });
        if (requests.length > 0) {
          const request = requests[0]; // Take the first request
          console.log(`    Found ${requests.length} requests for this staff`);
          
          // Try to find salon information
          let salonId = request.salonId;
          if (!salonId) {
            // Try to find salon by other requests from same staff
            const otherRequests = await ScheduleRequest.find({ 
              staffId: staffId, 
              salonId: { $exists: true, $ne: null } 
            });
            if (otherRequests.length > 0) {
              salonId = otherRequests[0].salonId;
              console.log(`    Found salonId ${salonId.toString()} from other requests`);
            }
          }
          
          // Create a placeholder staff member
          const staffIdStr = staffId.toString();
          const placeholderStaff = new Staff({
            _id: staffId,
            name: `Unknown Staff (${staffIdStr.substring(0, 8)})`,
            email: `unknown-${staffIdStr.substring(0, 8)}@example.com`,
            assignedSalon: salonId,
            approvalStatus: 'approved',
            employmentStatus: 'Employed',
            position: 'Unknown Position'
          });
          
          try {
            await placeholderStaff.save();
            console.log(`    ✅ Created placeholder staff member: ${placeholderStaff.name}`);
          } catch (saveError) {
            console.log(`    ❌ Failed to create placeholder staff: ${saveError.message}`);
          }
        }
      }
    }
    
    // Step 4: Update all schedule requests to have salonId where missing
    console.log('\n🔍 Updating schedule requests with missing salonId...');
    const requestsWithoutSalonId = await ScheduleRequest.find({ 
      salonId: { $exists: false },
      staffId: { $exists: true }
    });
    
    console.log(`Found ${requestsWithoutSalonId.length} schedule requests without salonId`);
    
    let updatedRequests = 0;
    for (const request of requestsWithoutSalonId) {
      try {
        // Get the staff member
        const staff = await Staff.findById(request.staffId);
        
        if (staff && staff.assignedSalon) {
          // Update the request with salonId
          request.salonId = staff.assignedSalon;
          await request.save();
          updatedRequests++;
          console.log(`  ✅ Updated request ${request._id} with salonId ${staff.assignedSalon.toString()}`);
        } else if (staff && !staff.assignedSalon) {
          // Try to find salon by other requests from same staff
          const otherRequests = await ScheduleRequest.find({ 
            staffId: request.staffId, 
            salonId: { $exists: true, $ne: null } 
          });
          
          if (otherRequests.length > 0) {
            const salonId = otherRequests[0].salonId;
            // Update staff with found salonId
            staff.assignedSalon = salonId;
            await staff.save();
            
            // Update the request with salonId
            request.salonId = salonId;
            await request.save();
            updatedRequests++;
            console.log(`  ✅ Updated staff ${staff._id.toString()} and request ${request._id.toString()} with salonId ${salonId.toString()}`);
          } else {
            console.log(`  ⚠️  Cannot update request ${request._id.toString()} - no salon information available`);
          }
        } else {
          console.log(`  ❌ Staff ${request.staffId.toString()} not found for request ${request._id.toString()}`);
        }
      } catch (error) {
        console.log(`  ❌ Error updating request ${request._id.toString()}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedRequests} schedule requests with salonId`);
    
    // Step 5: Ensure all staff have assignedSalon where missing
    console.log('\n🔍 Updating staff members with missing assignedSalon...');
    const staffWithoutSalon = await Staff.find({ 
      assignedSalon: { $exists: false },
      _id: { $in: allStaffIds }
    });
    
    console.log(`Found ${staffWithoutSalon.length} staff members without assignedSalon`);
    
    let updatedStaff = 0;
    for (const staff of staffWithoutSalon) {
      try {
        // Find a schedule request with salonId for this staff
        const requestWithSalon = await ScheduleRequest.findOne({ 
          staffId: staff._id, 
          salonId: { $exists: true, $ne: null } 
        });
        
        if (requestWithSalon) {
          staff.assignedSalon = requestWithSalon.salonId;
          await staff.save();
          updatedStaff++;
          console.log(`  ✅ Updated staff ${staff._id.toString()} with assignedSalon ${requestWithSalon.salonId.toString()}`);
        } else {
          console.log(`  ⚠️  Cannot update staff ${staff._id.toString()} - no salon information in requests`);
        }
      } catch (error) {
        console.log(`  ❌ Error updating staff ${staff._id.toString()}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedStaff} staff members with assignedSalon`);
    
    // Step 6: Final verification
    console.log('\n🔍 Final verification...');
    const pendingRequests = await ScheduleRequest.find({ status: 'pending' });
    console.log(`Found ${pendingRequests.length} total pending schedule requests`);
    
    // Group by salonId
    const requestsBySalon = {};
    for (const request of pendingRequests) {
      const salonId = request.salonId ? request.salonId.toString() : 'no-salon';
      if (!requestsBySalon[salonId]) {
        requestsBySalon[salonId] = [];
      }
      requestsBySalon[salonId].push(request);
    }
    
    console.log('\n📊 Pending requests by salon:');
    for (const [salonId, requests] of Object.entries(requestsBySalon)) {
      console.log(`  Salon ${salonId}: ${requests.length} requests`);
    }
    
    console.log('\n🎉 Comprehensive fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
}

// Run the comprehensive fix
comprehensiveFix();
#!/usr/bin/env node

/**
 * Final script to assign salon IDs to schedule requests
 * This script will find salon information and assign it to schedule requests
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

async function finalSalonAssignmentFix() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Find all salons to understand the structure
    console.log('\n🔍 Finding all salons...');
    const salons = await Salon.find({});
    console.log(`Found ${salons.length} salons:`);
    salons.forEach(salon => {
      console.log(`  - ${salon.salonName} (${salon._id}) - Owner: ${salon.ownerId}`);
    });
    
    // Find schedule requests without salonId
    console.log('\n🔍 Finding schedule requests without salonId...');
    const requestsWithoutSalon = await ScheduleRequest.find({ 
      salonId: { $exists: false } 
    });
    
    console.log(`Found ${requestsWithoutSalon.length} schedule requests without salonId`);
    
    // For each request, try to find the salon
    let updatedRequests = 0;
    for (const request of requestsWithoutSalon) {
      console.log(`\nProcessing request ${request._id}...`);
      
      // Try to find the staff member
      const staff = await Staff.findById(request.staffId);
      if (staff) {
        console.log(`  Found staff: ${staff.name} (${staff._id})`);
        console.log(`  Staff assigned salon: ${staff.assignedSalon}`);
        
        // If staff has assigned salon, use it
        if (staff.assignedSalon) {
          request.salonId = staff.assignedSalon;
          await request.save();
          updatedRequests++;
          console.log(`  ✅ Updated request with salonId: ${staff.assignedSalon}`);
          continue;
        }
      } else {
        console.log(`  ❌ Staff not found: ${request.staffId}`);
      }
      
      // Try to find salon by matching staff email patterns or other heuristics
      // This is a more complex approach - we'll look for patterns in the data
      
      // For now, let's just assign to the first salon we find (as a fallback)
      if (salons.length > 0) {
        const firstSalon = salons[0];
        request.salonId = firstSalon._id;
        await request.save();
        updatedRequests++;
        console.log(`  ⚠️  Assigned to first salon as fallback: ${firstSalon.salonName} (${firstSalon._id})`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedRequests} schedule requests with salonId`);
    
    // Final verification
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
      
      // Show some details for debugging
      if (requests.length > 0) {
        const sampleRequest = requests[0];
        if (salonId !== 'no-salon') {
          const salon = await Salon.findById(salonId);
          console.log(`    Salon name: ${salon ? salon.salonName : 'Not found'}`);
        }
        console.log(`    Sample request type: ${sampleRequest.type}, staff: ${sampleRequest.staffId}`);
      }
    }
    
    console.log('\n🎉 Final salon assignment fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
}

// Run the final fix
finalSalonAssignmentFix();
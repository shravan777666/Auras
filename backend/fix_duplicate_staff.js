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

// Function to fix duplicate staff records
const fixDuplicateStaff = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Mapping of unknown staff IDs to correct staff IDs
    const staffIdMapping = {
      '68ccef3cfaf3e420e3dae39d': '68ccef3cfaf3e420e3dae39f', // kevin
      '68ddf75fd7a63f35fd7dc138': '68ddf75fd7a63f35fd7dc13a'  // lamala
    };
    
    console.log('Fixing duplicate staff records...\n');
    
    // Process each mapping
    for (const [unknownId, correctId] of Object.entries(staffIdMapping)) {
      console.log(`Processing staff mapping: ${unknownId} -> ${correctId}`);
      
      // Find the unknown staff member
      const unknownStaff = await Staff.findById(unknownId);
      if (!unknownStaff) {
        console.log(`  ❌ Unknown staff not found: ${unknownId}`);
        continue;
      }
      
      console.log(`  Found unknown staff: ${unknownStaff.name} (${unknownStaff.email})`);
      
      // Find the correct staff member
      const correctStaff = await Staff.findById(correctId);
      if (!correctStaff) {
        console.log(`  ❌ Correct staff not found: ${correctId}`);
        continue;
      }
      
      console.log(`  Found correct staff: ${correctStaff.name} (${correctStaff.email})`);
      
      // Update all schedule requests that reference the unknown staff
      const requestsToUpdate = await ScheduleRequest.find({ staffId: unknownId });
      console.log(`  Found ${requestsToUpdate.length} schedule requests to update`);
      
      let updatedRequests = 0;
      for (const request of requestsToUpdate) {
        try {
          request.staffId = correctId;
          await request.save();
          console.log(`    ✅ Updated request ${request._id} to reference correct staff`);
          updatedRequests++;
        } catch (error) {
          console.log(`    ❌ Failed to update request ${request._id}: ${error.message}`);
        }
      }
      
      console.log(`  Updated ${updatedRequests} schedule requests`);
      
      // Delete the unknown staff member
      try {
        await Staff.findByIdAndDelete(unknownId);
        console.log(`  ✅ Deleted unknown staff member: ${unknownId}`);
      } catch (error) {
        console.log(`  ❌ Failed to delete unknown staff member: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Verify the fix
    console.log('--- Verifying fix ---');
    const remainingUnknownStaff = await Staff.find({ 
      name: { $regex: /^Unknown Staff/ } 
    });
    
    console.log(`Remaining unknown staff members: ${remainingUnknownStaff.length}`);
    remainingUnknownStaff.forEach(staff => {
      console.log(`  ${staff.name} - ${staff._id} - ${staff.email}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error fixing duplicate staff:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
fixDuplicateStaff();
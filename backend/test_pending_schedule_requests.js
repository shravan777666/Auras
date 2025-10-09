#!/usr/bin/env node

/**
 * Test script to verify the getPendingRequestsForOwner function fix
 * This script tests the pending schedule requests functionality for salon owners
 */

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

// Function to test the pending requests query logic
const testPendingRequestsQuery = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Assume a salon owner ID (you'll need to replace this with an actual owner ID)
    // For testing purposes, let's find the first salon owner
    const salon = await Salon.findOne({});
    if (!salon) {
      console.log('No salon found in database');
      await mongoose.connection.close();
      return;
    }
    
    const salonOwnerId = salon.ownerId;
    console.log(`Testing with salon owner ID: ${salonOwnerId}`);
    console.log(`Salon ID: ${salon._id}`);
    console.log(`Salon name: ${salon.salonName}`);
    
    // Find all staff members for this salon
    const staffMembers = await Staff.find({ assignedSalon: salon._id }).select('_id');
    const staffIds = staffMembers.map(staff => staff._id);
    console.log(`Found ${staffIds.length} staff members for this salon`);
    
    // Test the original query (staffId based)
    const originalQuery = {
      status: 'pending',
      staffId: { $in: staffIds }
    };
    
    const originalResults = await ScheduleRequest.find(originalQuery)
      .populate({
        path: 'staffId',
        select: 'name position profilePicture'
      });
    
    console.log(`\nOriginal query found ${originalResults.length} pending requests`);
    
    // Test the updated query (with salonId fallback)
    const updatedQuery = {
      status: 'pending',
      $or: [
        { staffId: { $in: staffIds } },
        { salonId: salon._id }
      ]
    };
    
    const updatedResults = await ScheduleRequest.find(updatedQuery)
      .populate({
        path: 'staffId',
        select: 'name position profilePicture'
      });
    
    console.log(`\nUpdated query found ${updatedResults.length} pending requests`);
    
    // Show details of requests found by updated query
    if (updatedResults.length > 0) {
      console.log('\n--- Pending Requests Details ---');
      updatedResults.forEach((req, index) => {
        console.log(`\nRequest ${index + 1}:`);
        console.log(`  ID: ${req._id}`);
        console.log(`  Type: ${req.type}`);
        console.log(`  Staff ID: ${req.staffId?._id || 'N/A'}`);
        console.log(`  Staff Name: ${req.staffId?.name || 'N/A'}`);
        console.log(`  Salon ID: ${req.salonId || 'N/A'}`);
        console.log(`  Created: ${req.createdAt}`);
      });
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error testing pending requests query:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
testPendingRequestsQuery();

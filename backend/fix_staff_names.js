import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from './models/Staff.js';
import User from './models/User.js';

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

// Function to fix staff names and positions
const fixStaffNames = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find all staff members with "Unknown Staff" in their name
    const unknownStaff = await Staff.find({ 
      name: { $regex: /^Unknown Staff/ } 
    });
    
    console.log(`Found ${unknownStaff.length} staff members with unknown names`);
    
    let fixedCount = 0;
    
    // Process each unknown staff member
    for (const staff of unknownStaff) {
      try {
        console.log(`\nProcessing staff: ${staff._id} - ${staff.name}`);
        
        // Try to find a user with matching ID
        let user = null;
        
        // First try exact match with staff.user if it exists
        if (staff.user) {
          user = await User.findById(staff.user);
          console.log(`  Found user by staff.user reference: ${user ? user.email : 'null'}`);
        }
        
        // If no user found, try to find by email
        if (!user && staff.email && !staff.email.startsWith('unknown-')) {
          user = await User.findOne({ email: staff.email });
          console.log(`  Found user by email: ${user ? user.email : 'null'}`);
        }
        
        if (user) {
          // Update only the name and position if they're still "unknown"
          const updates = {};
          const oldName = staff.name;
          const oldPosition = staff.position;
          
          if (staff.name.startsWith('Unknown Staff')) {
            updates.name = user.name || staff.name;
          }
          
          if (staff.email.startsWith('unknown-') && user.email) {
            updates.email = user.email;
          }
          
          if (staff.position === 'Unknown Position') {
            updates.position = user.position || '';
          }
          
          // Only update if we have changes
          if (Object.keys(updates).length > 0) {
            console.log(`  Updating staff with:`, updates);
            await Staff.findByIdAndUpdate(staff._id, updates, { new: true });
            console.log(`  Fixed staff member: ${staff._id} - ${oldName} -> ${updates.name || oldName}`);
            fixedCount++;
          } else {
            console.log(`  No updates needed for staff member: ${staff._id}`);
          }
        } else {
          console.log(`  No user found for staff member: ${staff._id} (${staff.name})`);
        }
      } catch (error) {
        console.error(`  Error fixing staff ${staff._id}:`, error.message);
      }
    }
    
    console.log(`\nFixed names for ${fixedCount} staff members`);
    
    // Also check for staff with "Unknown Position" and try to fix those
    const unknownPositionStaff = await Staff.find({ 
      position: 'Unknown Position',
      name: { $not: { $regex: /^Unknown Staff/ } } // Exclude those we already processed
    });
    
    console.log(`\nFound ${unknownPositionStaff.length} additional staff members with unknown positions`);
    
    let positionFixedCount = 0;
    
    for (const staff of unknownPositionStaff) {
      try {
        if (staff.position === 'Unknown Position') {
          // Try to get position from user if available
          let newPosition = '';
          if (staff.user) {
            const user = await User.findById(staff.user);
            if (user && user.position) {
              newPosition = user.position;
            }
          }
          
          // Update the position
          await Staff.findByIdAndUpdate(staff._id, { position: newPosition });
          console.log(`  Fixed position for staff member: ${staff._id} - Unknown Position -> ${newPosition || '(empty)'}`);
          positionFixedCount++;
        }
      } catch (error) {
        console.error(`  Error fixing position for staff ${staff._id}:`, error.message);
      }
    }
    
    console.log(`Fixed positions for ${positionFixedCount} staff members`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error fixing staff names:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
fixStaffNames();
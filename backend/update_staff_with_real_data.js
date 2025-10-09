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

// Function to update staff with real data
const updateStaffWithRealData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Mapping of unknown staff to real user data
    const staffUpdates = [
      {
        staffId: '68ccef3cfaf3e420e3dae39d',
        userId: '68ccef3cfaf3e420e3dae39d',
        name: 'kevin',
        email: 'kevin@gmail.com'
      },
      {
        staffId: '68ddf75fd7a63f35fd7dc138',
        userId: '68ddf75fd7a63f35fd7dc138',
        name: 'Lamala',
        email: 'lamala@gmail.com'
      }
    ];
    
    console.log(`Updating ${staffUpdates.length} staff members with real data...\n`);
    
    let updatedCount = 0;
    
    // Process each staff member
    for (const update of staffUpdates) {
      try {
        console.log(`Updating staff: ${update.staffId}`);
        
        // Find the staff member
        const staff = await Staff.findById(update.staffId);
        if (!staff) {
          console.log(`  ❌ Staff not found: ${update.staffId}`);
          continue;
        }
        
        console.log(`  Current data: ${staff.name} (${staff.email}) - ${staff.position || 'No position'}`);
        
        // Get the real user data
        const user = await User.findById(update.userId);
        if (!user) {
          console.log(`  ❌ User not found: ${update.userId}`);
          continue;
        }
        
        console.log(`  Real user data: ${user.name} (${user.email}) - ${user.position || 'No position'}`);
        
        // Update the staff member with real data
        const updates = {
          name: user.name,
          email: user.email,
          position: user.position || ''
        };
        
        // Only update if the current data is still "unknown"
        if (staff.name.startsWith('Unknown Staff') || 
            staff.email.startsWith('unknown-') || 
            staff.position === 'Unknown Position') {
          
          await Staff.findByIdAndUpdate(update.staffId, updates, { new: true });
          console.log(`  ✅ Updated staff: ${user.name} (${user.email})`);
          updatedCount++;
        } else {
          console.log(`  ℹ️  Staff data already updated, skipping`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating staff ${update.staffId}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} staff members`);
    
    // Verify the updates
    console.log('\n--- Verifying updates ---');
    for (const update of staffUpdates) {
      const staff = await Staff.findById(update.staffId);
      if (staff) {
        console.log(`${staff.name} (${staff.email}) - ${staff.position || 'No position'}`);
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error updating staff with real data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
updateStaffWithRealData();
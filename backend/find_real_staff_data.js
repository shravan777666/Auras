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

// Function to find real staff data
const findRealStaffData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find all staff members with "Unknown Staff" in their name
    const unknownStaff = await Staff.find({ 
      name: { $regex: /^Unknown Staff/ } 
    });
    
    console.log(`Found ${unknownStaff.length} staff members with unknown names`);
    
    // Get all users to search through them
    const allUsers = await User.find({ type: 'staff' });
    console.log(`Found ${allUsers.length} total staff users`);
    
    // Process each unknown staff member
    for (const staff of unknownStaff) {
      console.log(`\n--- Processing staff: ${staff._id} ---`);
      console.log(`Name: ${staff.name}`);
      console.log(`Email: ${staff.email}`);
      
      // Extract the ID part from the name (e.g., "Unknown Staff (68ccef3c)" -> "68ccef3c")
      const idMatch = staff.name.match(/\(([^)]+)\)/);
      if (idMatch && idMatch[1]) {
        const idPart = idMatch[1];
        console.log(`ID part to match: ${idPart}`);
        
        // Try to find a user whose ID contains this part
        const matchingUsers = allUsers.filter(user => user._id.toString().includes(idPart));
        
        if (matchingUsers.length > 0) {
          console.log(`Found ${matchingUsers.length} matching users:`);
          matchingUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user._id}`);
          });
        } else {
          console.log(`No matching users found for ID part: ${idPart}`);
          
          // Let's also check if there are users with similar emails
          if (staff.email && staff.email.startsWith('unknown-')) {
            const emailPart = staff.email.replace('unknown-', '').replace('@example.com', '');
            console.log(`Searching for users with email part: ${emailPart}`);
            
            const emailMatchingUsers = allUsers.filter(user => 
              user._id.toString().includes(emailPart) || 
              (user.email && user.email.includes(emailPart))
            );
            
            if (emailMatchingUsers.length > 0) {
              console.log(`Found ${emailMatchingUsers.length} email-matching users:`);
              emailMatchingUsers.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user._id}`);
              });
            } else {
              console.log(`No email-matching users found`);
            }
          }
        }
      } else {
        console.log(`Could not extract ID from staff name: ${staff.name}`);
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error finding real staff data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
findRealStaffData();
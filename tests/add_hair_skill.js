// Add "Hair" skill to a staff member
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

// Simple schema
const staffSchema = new mongoose.Schema({
  name: { type: String },
  skills: [{ type: String }],
  assignedSalon: { type: mongoose.Schema.Types.ObjectId }
}, { collection: 'staffs' });

const Staff = mongoose.model('Staff', staffSchema);

async function addHairSkill() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Staff ID to update (kevin)
    const staffId = '68ccef3cfaf3e420e3dae39f';
    
    // Find the staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      console.log('Staff member not found');
      return;
    }
    
    console.log('Current staff details:');
    console.log('Name:', staff.name);
    console.log('Current skills:', staff.skills);
    
    // Add "Hair" to skills if not already present
    if (!staff.skills.includes('Hair')) {
      staff.skills.push('Hair');
      await staff.save();
      console.log('Added "Hair" to staff skills');
      console.log('Updated skills:', staff.skills);
    } else {
      console.log('"Hair" skill already present');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

addHairSkill();
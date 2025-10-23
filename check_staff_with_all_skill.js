// Check if any staff member has the "All" skill
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

async function checkAllSkill() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find staff with "All" skill
    const staffWithAll = await Staff.find({ skills: 'All' });
    console.log('Staff with "All" skill:');
    if (staffWithAll.length === 0) {
      console.log('  None found');
    } else {
      staffWithAll.forEach(staff => {
        console.log(`  - ${staff.name} (${staff._id})`);
        console.log('    Skills:', staff.skills);
      });
    }
    
    // Find staff with "Hair" skill
    const staffWithHair = await Staff.find({ skills: 'Hair' });
    console.log('\nStaff with "Hair" skill:');
    if (staffWithHair.length === 0) {
      console.log('  None found');
    } else {
      staffWithHair.forEach(staff => {
        console.log(`  - ${staff.name} (${staff._id})`);
        console.log('    Skills:', staff.skills);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAllSkill();
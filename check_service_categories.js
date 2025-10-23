// Check what service categories exist in the database
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

// Simple schema
const serviceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  category: { type: String },
  price: { type: Number },
  duration: { type: Number }
}, { collection: 'services' });

const Service = mongoose.model('Service', serviceSchema);

async function checkCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all unique categories
    const categories = await Service.distinct('category');
    console.log('All service categories:');
    categories.forEach(category => {
      console.log(`  - ${category}`);
    });
    
    // Get services with "Hair" category
    console.log('\nServices with "Hair" category:');
    const hairServices = await Service.find({ category: 'Hair' });
    hairServices.forEach(service => {
      console.log(`  - ${service.name} (${service._id})`);
    });
    
    // Get services with "Hair Treatment" category
    console.log('\nServices with "Hair Treatment" category:');
    const hairTreatmentServices = await Service.find({ category: 'Hair Treatment' });
    hairTreatmentServices.forEach(service => {
      console.log(`  - ${service.name} (${service._id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCategories();
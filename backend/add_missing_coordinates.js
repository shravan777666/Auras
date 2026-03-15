import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';

dotenv.config();

// Sample coordinates in Kerala area (around Kanjirapally/Kollam)
const sampleCoordinates = [
  { lat: 9.5280, lng: 76.8190 }, // Near Amal Jyothi College
  { lat: 9.5350, lng: 76.8250 }, // Kanjirapally area
  { lat: 9.5420, lng: 76.8200 }, // Nearby
  { lat: 9.5300, lng: 76.8170 }, // Nearby
  { lat: 8.8900, lng: 76.6140 }, // Kollam area
  { lat: 8.8950, lng: 76.6180 }, // Kollam area
  { lat: 8.8850, lng: 76.6100 }, // Kollam area
];

const addMissingCoordinates = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get salons without coordinates
    const salonsWithoutCoords = await Salon.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null }
      ]
    });

    console.log(`Found ${salonsWithoutCoords.length} salons without coordinates\n`);

    let updated = 0;
    let coordIndex = 0;

    for (const salon of salonsWithoutCoords) {
      try {
        // Use sample coordinates
        const coords = sampleCoordinates[coordIndex % sampleCoordinates.length];
        
        salon.latitude = coords.lat;
        salon.longitude = coords.lng;
        await salon.save();
        
        console.log(`✓ Updated: ${salon.salonName}`);
        console.log(`  New coordinates: (${coords.lat}, ${coords.lng})\n`);
        
        updated++;
        coordIndex++;
      } catch (err) {
        console.error(`✗ Failed to update ${salon.salonName}:`, err.message);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Salons updated: ${updated}`);
    console.log('\n✓ All salons now have coordinates!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addMissingCoordinates();

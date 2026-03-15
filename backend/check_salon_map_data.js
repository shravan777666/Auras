import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';

dotenv.config();

const checkSalonMapData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all active and approved salons
    const salons = await Salon.find({
      isActive: true,
      setupCompleted: true,
      approvalStatus: 'approved'
    }).select('salonName latitude longitude salonAddress');

    console.log(`=== Salon Map Data Check ===`);
    console.log(`Total active & approved salons: ${salons.length}\n`);

    let salonsWithCoords = 0;
    let salonsWithoutCoords = 0;

    salons.forEach((salon, index) => {
      const hasLat = salon.latitude != null && salon.latitude !== undefined;
      const hasLng = salon.longitude != null && salon.longitude !== undefined;
      const hasCoords = hasLat && hasLng;

      if (hasCoords) {
        salonsWithCoords++;
        console.log(`✓ ${index + 1}. ${salon.salonName}`);
        console.log(`   Coordinates: (${salon.latitude}, ${salon.longitude})`);
      } else {
        salonsWithoutCoords++;
        console.log(`✗ ${index + 1}. ${salon.salonName} - MISSING COORDINATES`);
        console.log(`   Latitude: ${salon.latitude}, Longitude: ${salon.longitude}`);
        if (salon.salonAddress) {
          console.log(`   Address: ${JSON.stringify(salon.salonAddress)}`);
        }
      }
      console.log('');
    });

    console.log(`\n=== Summary ===`);
    console.log(`Salons with coordinates: ${salonsWithCoords}`);
    console.log(`Salons without coordinates: ${salonsWithoutCoords}`);
    console.log(`\nPercentage with coordinates: ${((salonsWithCoords / salons.length) * 100).toFixed(1)}%`);

    if (salonsWithoutCoords > 0) {
      console.log(`\n⚠️ WARNING: ${salonsWithoutCoords} salon(s) are missing latitude/longitude coordinates!`);
      console.log(`These salons will not appear on the map.`);
      console.log(`\nTo fix: Add latitude and longitude values to these salons in the database.`);
    } else {
      console.log(`\n✓ All salons have coordinates!`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkSalonMapData();

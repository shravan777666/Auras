import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';

dotenv.config();

const migrateSalonCoordinates = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all salons
    const salons = await Salon.find({});
    console.log(`Found ${salons.length} total salons\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const salon of salons) {
      try {
        // Check if top-level coordinates are missing
        const needsUpdate = !salon.latitude || !salon.longitude;
        
        if (needsUpdate) {
          // Try to get coordinates from salonAddress
          let lat = null;
          let lng = null;
          
          if (salon.salonAddress && typeof salon.salonAddress === 'object') {
            lat = salon.salonAddress.latitude;
            lng = salon.salonAddress.longitude;
          }
          
          if (lat && lng) {
            // Update top-level coordinates
            salon.latitude = lat;
            salon.longitude = lng;
            await salon.save();
            
            console.log(`✓ Updated: ${salon.salonName}`);
            console.log(`  Coordinates: (${lat}, ${lng})`);
            updated++;
          } else {
            console.log(`⚠ Skipped: ${salon.salonName} - No coordinates in salonAddress`);
            skipped++;
          }
        } else {
          console.log(`→ Already has coordinates: ${salon.salonName} (${salon.latitude}, ${salon.longitude})`);
          skipped++;
        }
      } catch (err) {
        console.error(`✗ Failed to update ${salon.salonName}:`, err.message);
        failed++;
      }
      console.log('');
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total salons: ${salons.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

migrateSalonCoordinates();

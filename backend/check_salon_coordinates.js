import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import Salon from './models/Salon.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkSalonCoordinates() {
  console.log('🔍 Checking Salon Coordinates...\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check specific salons
    const salonNames = ['Shravan', 'Amal'];
    
    for (const salonName of salonNames) {
      console.log(`🏢 Checking salon: ${salonName}\n`);
      const salon = await Salon.findOne({ salonName: salonName });
      
      if (salon) {
        console.log(`   Name: ${salon.salonName}`);
        console.log(`   Latitude: ${salon.latitude}`);
        console.log(`   Longitude: ${salon.longitude}`);
        console.log(`   Salon Address:`, salon.salonAddress);
        
        // Check if coordinates are valid numbers
        if (typeof salon.latitude === 'number' && !isNaN(salon.latitude)) {
          console.log(`   ✅ Latitude is valid: ${salon.latitude}`);
        } else {
          console.log(`   ❌ Latitude is invalid: ${salon.latitude}`);
        }
        
        if (typeof salon.longitude === 'number' && !isNaN(salon.longitude)) {
          console.log(`   ✅ Longitude is valid: ${salon.longitude}`);
        } else {
          console.log(`   ❌ Longitude is invalid: ${salon.longitude}`);
        }
        
        // Also check if coordinates exist in salonAddress for backward compatibility
        if (salon.salonAddress && typeof salon.salonAddress === 'object') {
          console.log(`   Salon Address Coordinates:`);
          console.log(`     latitude: ${salon.salonAddress.latitude}`);
          console.log(`     longitude: ${salon.salonAddress.longitude}`);
          console.log(`     lat: ${salon.salonAddress.lat}`);
          console.log(`     lng: ${salon.salonAddress.lng}`);
        }
      } else {
        console.log(`   ❌ Salon "${salonName}" not found`);
      }
      
      console.log('----------------------------------------\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSalonCoordinates();
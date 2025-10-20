import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import AddonSales from './models/AddonSales.js';
import Salon from './models/Salon.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'auracare',
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

const checkData = async () => {
  await connectDB();
  
  try {
    console.log('Checking Addon Sales Data...');
    
    // Count total addon sales
    const totalAddonSales = await AddonSales.countDocuments();
    console.log(`Total Addon Sales Records: ${totalAddonSales}`);
    
    if (totalAddonSales > 0) {
      // Get sample addon sales
      const sampleSales = await AddonSales.find().limit(5).populate('salonId', 'salonName');
      console.log('\nSample Addon Sales:');
      sampleSales.forEach(sale => {
        console.log(`- ${sale.serviceName} at ${sale.salonId?.salonName || 'Unknown Salon'} for ₹${sale.discountedPrice}`);
      });
      
      // Get unique salons
      const uniqueSalons = await AddonSales.distinct('salonId');
      console.log(`\nUnique Salons with Addon Sales: ${uniqueSalons.length}`);
      
      // Get unique services
      const uniqueServices = await AddonSales.distinct('serviceName');
      console.log(`Unique Addon Services: ${uniqueServices.length}`);
      
      // Check if salon IDs exist in Salon collection
      console.log('\nChecking Salon Data:');
      for (const salonId of uniqueSalons.slice(0, 3)) {
        const salon = await Salon.findById(salonId);
        if (salon) {
          console.log(`- Salon found: ${salon.salonName} (${salon.approvalStatus})`);
        } else {
          console.log(`- Salon not found for ID: ${salonId}`);
        }
      }
    } else {
      console.log('No addon sales data found in the database.');
      
      // Check if there are any salons
      const totalSalons = await Salon.countDocuments();
      console.log(`\nTotal Salons: ${totalSalons}`);
      
      if (totalSalons > 0) {
        const approvedSalons = await Salon.countDocuments({ approvalStatus: 'approved' });
        console.log(`Approved Salons: ${approvedSalons}`);
        
        // Show sample salons
        const sampleSalons = await Salon.find({ approvalStatus: 'approved' }).limit(3);
        console.log('\nSample Approved Salons:');
        sampleSalons.forEach(salon => {
          console.log(`- ${salon.salonName} (${salon.email})`);
        });
      }
    }
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error checking data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkData();
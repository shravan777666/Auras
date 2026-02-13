import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';
import Service from './models/Service.js';

dotenv.config();

const testSalonData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get active salons with services
    const salons = await Salon.find({ 
      isActive: true, 
      setupCompleted: true,
      approvalStatus: 'approved'
    })
    .select('salonName salonAddress contactNumber latitude longitude services')
    .populate({
      path: 'services',
      match: { isActive: true },
      select: 'name price category duration',
      options: { limit: 10 }
    })
    .limit(3)
    .lean();

    console.log(`\nFound ${salons.length} active salons\n`);

    salons.forEach((salon, index) => {
      console.log(`\n=== Salon ${index + 1} ===`);
      console.log('Name:', salon.salonName);
      console.log('Address:', JSON.stringify(salon.salonAddress));
      console.log('Coordinates:', { lat: salon.latitude, lng: salon.longitude });
      console.log('Services count:', salon.services?.length || 0);
      if (salon.services && salon.services.length > 0) {
        console.log('First service:', salon.services[0]);
      }
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testSalonData();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';
import Service from './models/Service.js';

dotenv.config();

const checkSalonServices = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all active and approved salons
    const salons = await Salon.find({
      isActive: true,
      setupCompleted: true,
      approvalStatus: 'approved'
    }).populate('services', 'name category');

    console.log(`=== Salon Services Check ===`);
    console.log(`Total active & approved salons: ${salons.length}\n`);

    // Get all haircut services
    const haircutServices = await Service.find({
      name: { $regex: /haircut/i }
    });
    
    console.log('Haircut services found:');
    haircutServices.forEach(service => {
      console.log(`  - ${service.name} (Salon: ${service.salonId})`);
    });
    console.log('');

    let salonsWithServices = 0;
    let salonsWithHaircut = 0;

    for (const salon of salons) {
      console.log(`\n📍 ${salon.salonName} (${salon.latitude}, ${salon.longitude})`);
      
      if (salon.services && salon.services.length > 0) {
        salonsWithServices++;
        console.log(`  Services (${salon.services.length}):`);
        
        const hasHaircut = salon.services.some(service => 
          service.name && service.name.toLowerCase().includes('haircut')
        );
        
        if (hasHaircut) {
          salonsWithHaircut++;
        }
        
        salon.services.forEach(service => {
          const isHaircut = service.name && service.name.toLowerCase().includes('haircut');
          const marker = isHaircut ? '✂️' : '  ';
          console.log(`  ${marker} - ${service.name} (${service.category || 'N/A'})`);
        });
      } else {
        console.log(`  ⚠️  No services configured`);
      }
    }

    console.log('\n\n=== Summary ===');
    console.log(`Total active & approved salons: ${salons.length}`);
    console.log(`Salons with services: ${salonsWithServices}`);
    console.log(`Salons offering Haircut: ${salonsWithHaircut}`);
    console.log(`Salons without services: ${salons.length - salonsWithServices}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkSalonServices();

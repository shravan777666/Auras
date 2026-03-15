import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Salon from './models/Salon.js';
import Service from './models/Service.js';

dotenv.config();

const addHaircutServices = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get active salons without services or with few services
    const salons = await Salon.find({
      isActive: true,
      setupCompleted: true,
      approvalStatus: 'approved'
    }).populate('services');

    console.log(`Found ${salons.length} active & approved salons\n`);

    let added = 0;

    for (const salon of salons) {
      try {
        // Check if salon already has a haircut service
        const hasHaircut = salon.services && salon.services.some(service => 
          service.name && service.name.toLowerCase().includes('haircut')
        );

        if (!hasHaircut && salon._id) {
          // Create a haircut service for this salon
          const newService = new Service({
            name: 'Haircut',
            description: 'Professional haircut service',
            category: 'Hair',
            price: 300,
            duration: 45,
            salonId: salon._id,
            isActive: true
          });

          await newService.save();

          // Add service to salon's services array
          if (!salon.services) {
            salon.services = [];
          }
          salon.services.push(newService._id);
          await salon.save();

          console.log(`✓ Added Haircut service to: ${salon.salonName}`);
          added++;
        } else if (hasHaircut) {
          console.log(`→ Already has Haircut: ${salon.salonName}`);
        }
      } catch (err) {
        console.error(`✗ Failed for ${salon.salonName}:`, err.message);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Haircut services added: ${added}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

addHaircutServices();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Revenue from './models/Revenue.js';
import Salon from './models/Salon.js';
import User from './models/User.js';

dotenv.config();

const seedRevenue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all salons
    const salons = await Salon.find({});
    if (salons.length === 0) {
      console.log('No salons found. Please create salons first.');
      return;
    }

    // Create a dummy owner user if salons don't have ownerId
    let dummyOwnerId = null;
    for (const salon of salons) {
      if (!salon.ownerId) {
        if (!dummyOwnerId) {
          // Create dummy owner
          const dummyOwner = await User.create({
            name: 'Test Salon Owner',
            email: 'owner@test.com',
            password: 'password123',
            type: 'salon'
          });
          dummyOwnerId = dummyOwner._id;
        }
        // Assign dummy owner to salon
        salon.ownerId = dummyOwnerId;
        await salon.save();
      }
    }

    // Sample services and their typical prices
    const sampleServices = [
      { name: 'Haircut', price: 150 },
      { name: 'Hair Coloring', price: 250 },
      { name: 'Facial', price: 200 },
      { name: 'Manicure', price: 80 },
      { name: 'Pedicure', price: 100 },
      { name: 'Hair Wash', price: 50 },
      { name: 'Beard Trim', price: 70 },
      { name: 'Eyebrow Shaping', price: 60 }
    ];

    // Generate revenue data for each salon
    for (const salon of salons) {
      console.log(`Creating revenue data for salon: ${salon.salonName}`);

      // Create multiple revenue records for each service type
      for (const service of sampleServices) {
        // Create 5-15 random records per service
        const numRecords = Math.floor(Math.random() * 11) + 5;

        for (let i = 0; i < numRecords; i++) {
          // Random date within last 30 days
          const randomDays = Math.floor(Math.random() * 30);
          const date = new Date();
          date.setDate(date.getDate() - randomDays);

          // Slight price variation
          const priceVariation = (Math.random() - 0.5) * 0.2; // ±10%
          const finalPrice = Math.round(service.price * (1 + priceVariation));

          await Revenue.create({
            service: service.name,
            amount: finalPrice,
            salonId: salon._id,
            ownerId: salon.ownerId,
            date: date
          });
        }
      }
    }

    console.log('Revenue data seeded successfully!');

    // Display summary
    const totalRevenue = await Revenue.aggregate([
      { $group: { _id: '$salonId', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    console.log('\nRevenue Summary:');
    for (const summary of totalRevenue) {
      const salon = await Salon.findById(summary._id);
      if (salon) {
        console.log(`${salon.salonName}: ₹${summary.total} (${summary.count} transactions)`);
      } else {
        console.log(`Salon ${summary._id}: ₹${summary.total} (${summary.count} transactions)`);
      }
    }

  } catch (error) {
    console.error('Error seeding revenue data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedRevenue();
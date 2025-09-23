import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Revenue from './models/Revenue.js';

dotenv.config();

const sampleRevenueData = [
  { service: "Haircut", amount: 150 },
  { service: "Haircut", amount: 120 },
  { service: "Haircut", amount: 180 },
  { service: "Coloring", amount: 250 },
  { service: "Coloring", amount: 300 },
  { service: "Coloring", amount: 200 },
  { service: "Manicure", amount: 80 },
  { service: "Manicure", amount: 90 },
  { service: "Pedicure", amount: 100 },
  { service: "Pedicure", amount: 110 },
  { service: "Facial", amount: 120 },
  { service: "Facial", amount: 140 },
  { service: "Massage", amount: 160 },
  { service: "Massage", amount: 180 },
  { service: "Waxing", amount: 70 },
  { service: "Waxing", amount: 85 },
  { service: "Styling", amount: 95 },
  { service: "Styling", amount: 110 },
  { service: "Haircut", amount: 135 },
  { service: "Coloring", amount: 275 }
];

async function populateRevenue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aura-cares');

    // Clear existing data
    await Revenue.deleteMany({});
    console.log('Cleared existing revenue data');

    // Insert sample data
    const revenueEntries = sampleRevenueData.map(data => ({
      ...data,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    }));

    await Revenue.insertMany(revenueEntries);
    console.log(`Inserted ${revenueEntries.length} revenue entries`);

    // Verify the data
    const totalRevenue = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    console.log('Total revenue:', totalRevenue[0]?.total || 0);

    await mongoose.disconnect();
    console.log('Revenue data populated successfully');
  } catch (error) {
    console.error('Error populating revenue data:', error);
    process.exit(1);
  }
}

populateRevenue();
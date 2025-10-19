import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

// Import models
import Salon from './models/Salon.js';
import Revenue from './models/Revenue.js';
import Expense from './models/Expense.js';

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Test data
const testSalons = [
  {
    salonName: 'Test Salon 1',
    email: 'test1@salon.com',
    approvalStatus: 'approved',
    isActive: true
  },
  {
    salonName: 'Test Salon 2',
    email: 'test2@salon.com',
    approvalStatus: 'approved',
    isActive: true
  }
];

const testRevenue = [
  {
    service: 'Haircut',
    amount: 1500,
    date: new Date()
  },
  {
    service: 'Coloring',
    amount: 3500,
    date: new Date()
  }
];

const testExpenses = [
  {
    category: 'Supplies',
    amount: 500,
    description: 'Hair products',
    date: new Date()
  },
  {
    category: 'Rent',
    amount: 2000,
    description: 'Monthly rent',
    date: new Date()
  }
];

// Test function
const testFinancialSummary = async () => {
  try {
    await connectDB();
    
    // Clear existing test data
    await Salon.deleteMany({ email: { $in: ['test1@salon.com', 'test2@salon.com'] } });
    console.log('Cleared existing test salons');
    
    // Create test salons
    const salons = await Salon.insertMany(testSalons);
    console.log('Created test salons:', salons.map(s => ({ id: s._id, name: s.salonName })));
    
    // Create test revenue for each salon
    for (const salon of salons) {
      for (const revenue of testRevenue) {
        await Revenue.create({
          ...revenue,
          salonId: salon._id,
          ownerId: salon.ownerId || salon._id
        });
      }
      
      for (const expense of testExpenses) {
        await Expense.create({
          ...expense,
          salonId: salon._id
        });
      }
    }
    
    console.log('Created test revenue and expense data');
    
    // Test aggregation queries
    const salonIds = salons.map(s => s._id);
    
    // Test revenue aggregation
    const revenueResult = await Revenue.aggregate([
      {
        $match: {
          salonId: { $in: salonIds }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    console.log('Total Revenue:', revenueResult.length > 0 ? revenueResult[0].total : 0);
    
    // Test expense aggregation
    const expenseResult = await Expense.aggregate([
      {
        $match: {
          salonId: { $in: salonIds }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    console.log('Total Expenses:', expenseResult.length > 0 ? expenseResult[0].total : 0);
    
    console.log('Financial summary test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the test
testFinancialSummary();
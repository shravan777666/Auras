import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'backend', '.env') });

// Models
import Expense from './backend/models/Expense.js';
import Salon from './backend/models/Salon.js';
import User from './backend/models/User.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestExpenseData = async () => {
  try {
    // Find a test salon owner (you may need to adjust this based on your test data)
    const salonOwner = await User.findOne({ type: 'salon' });
    
    if (!salonOwner) {
      console.log('No salon owner found in database');
      return;
    }
    
    console.log('Found salon owner:', salonOwner.email);
    
    // Find the salon for this owner
    const salon = await Salon.findOne({ user: salonOwner._id });
    
    if (!salon) {
      console.log('No salon found for this owner');
      return;
    }
    
    console.log('Found salon:', salon.salonName);
    
    // Create sample expense data for the last 12 months
    const expenses = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const expenseDate = new Date(now);
      expenseDate.setMonth(now.getMonth() - i);
      
      const expense = new Expense({
        salonId: salon._id,
        category: 'Supplies',
        amount: 3000 + Math.random() * 2000, // Random amount between 3000-5000
        description: `Monthly supplies for ${expenseDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        date: expenseDate
      });
      
      expenses.push(expense);
    }
    
    // Save all expenses
    await Expense.insertMany(expenses);
    console.log('Created', expenses.length, 'test expense records');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test data:', error);
    mongoose.connection.close();
  }
};

createTestExpenseData();
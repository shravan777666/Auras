// Script to create test expense data
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function createTestExpenses() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find a test salon (you may need to adjust this query based on your data)
    const salon = await db.collection('salons').findOne({ type: 'salon' });
    
    if (!salon) {
      console.log('No salon found');
      return;
    }
    
    console.log('Found salon:', salon.salonName);
    
    // Create sample expense data for the last 12 months
    const expenses = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const expenseDate = new Date(now);
      expenseDate.setMonth(now.getMonth() - i);
      
      expenses.push({
        salonId: salon._id,
        category: 'Supplies',
        amount: 3000 + Math.random() * 2000, // Random amount between 3000-5000
        description: `Monthly supplies for ${expenseDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        date: expenseDate,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Insert test expenses
    const result = await db.collection('expenses').insertMany(expenses);
    console.log('Created', result.insertedCount, 'test expense records');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await client.close();
  }
}

createTestExpenses();
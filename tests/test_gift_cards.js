/**
 * Test script to verify Gift Cards functionality
 */

import mongoose from 'mongoose';
import GiftCard from './backend/models/GiftCard.js';
import Salon from './backend/models/Salon.js';
import User from './backend/models/User.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare');
    console.log('MongoDB connected for testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test creating a sample gift card
const testGiftCardCreation = async () => {
  try {
    console.log('Testing Gift Card creation...');
    
    // Find a salon to associate with the gift card
    const salon = await Salon.findOne();
    if (!salon) {
      console.log('No salon found for testing');
      return;
    }
    
    // Find a salon user to associate with the gift card
    const user = await User.findOne({ type: 'salon' });
    if (!user) {
      console.log('No salon user found for testing');
      return;
    }
    
    // Create a sample gift card
    const giftCard = new GiftCard({
      name: 'Premium Spa Experience',
      amount: 5000,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      usageType: 'BOTH',
      description: 'Enjoy premium spa services and products worth ₹5000',
      termsAndConditions: 'Valid for services and products. Cannot be exchanged for cash.',
      minPurchaseAmount: 1000,
      maxDiscountAmount: 500,
      salonId: salon._id,
      createdBy: user._id
    });
    
    await giftCard.save();
    console.log('Sample gift card created successfully:', giftCard);
    
    // Test finding active gift cards for the salon
    const activeCards = await GiftCard.find({
      salonId: salon._id,
      status: 'ACTIVE',
      expiryDate: { $gte: new Date() }
    });
    
    console.log('Active gift cards found:', activeCards.length);
    if (activeCards.length > 0) {
      console.log('First active card:', activeCards[0]);
    }
    
    console.log('Gift Card functionality test completed successfully!');
  } catch (error) {
    console.error('Error in gift card test:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testGiftCardCreation();
  await mongoose.disconnect();
  console.log('Test completed and disconnected from DB');
};

// Execute the test
runTest().catch(console.error);
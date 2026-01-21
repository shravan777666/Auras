import mongoose from 'mongoose';
import GiftCard from './models/GiftCard.js';
import Salon from './models/Salon.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

const createTestGiftCard = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
    
    // First, find a salon to associate the gift card with
    const salon = await Salon.findOne({ isActive: true });
    
    if (!salon) {
      console.log('❌ No active salon found. Creating a test salon first...');
      
      // Create a test salon
      const testSalon = await Salon.create({
        salonName: 'Test Salon for Gift Cards',
        email: 'test-salon@giftcard.com',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456',
        isActive: true,
        approvalStatus: 'approved'
      });
      
      console.log('✅ Created test salon:', testSalon._id);
      
      // Create gift card for this salon
      const giftCard = await GiftCard.create({
        name: 'Test Gift Card',
        amount: 1000,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        usageType: 'BOTH',
        description: 'Test gift card for payment testing',
        termsAndConditions: 'Test terms and conditions',
        salonId: testSalon._id,
        createdBy: testSalon._id,
        status: 'ACTIVE',
        balance: 1000,
        redemptionCount: 0,
        code: 'TEST-GC-001'
      });
      
      console.log('✅ Created test gift card:', {
        id: giftCard._id,
        name: giftCard.name,
        amount: giftCard.amount,
        salonId: giftCard.salonId
      });
      
      console.log('\n🎉 Test data created successfully!');
      console.log('Gift Card ID:', giftCard._id);
      console.log('Salon ID:', testSalon._id);
      
    } else {
      console.log('✅ Found existing salon:', salon.salonName);
      
      // Create gift card for existing salon
      const giftCard = await GiftCard.create({
        name: 'Test Gift Card',
        amount: 1000,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageType: 'BOTH',
        description: 'Test gift card for payment testing',
        termsAndConditions: 'Test terms and conditions',
        salonId: salon._id,
        createdBy: salon._id,
        status: 'ACTIVE',
        balance: 1000,
        redemptionCount: 0,
        code: 'TEST-GC-001'
      });
      
      console.log('✅ Created test gift card:', {
        id: giftCard._id,
        name: giftCard.name,
        amount: giftCard.amount,
        salonId: giftCard.salonId
      });
      
      console.log('\n🎉 Test data created successfully!');
      console.log('Gift Card ID:', giftCard._id);
      console.log('Salon ID:', salon._id);
    }
    
  } catch (error) {
    console.error('❌ Error creating test gift card:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestGiftCard();
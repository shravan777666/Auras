import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';

// Load environment variables
dotenv.config();

console.log('=== Payment Gateway Configuration Test ===\n');

// Test 1: Check Environment Variables
console.log('1. Checking environment variables:');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Not set');
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Not set');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

// Test 2: Initialize Razorpay
console.log('\n2. Testing Razorpay initialization:');
try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('   ✅ Razorpay initialized successfully');

  // Test 3: Create a test order
  console.log('\n3. Creating test Razorpay order:');
  const options = {
    amount: 50000, // Amount in paise (500 INR)
    currency: 'INR',
    receipt: 'test_receipt_123',
    payment_capture: 1
  };

  const order = await razorpay.orders.create(options);
  console.log('   ✅ Test order created successfully');
  console.log('   Order ID:', order.id);
  console.log('   Amount:', order.amount / 100, 'INR');
  console.log('   Currency:', order.currency);
  console.log('   Status:', order.status);
} catch (error) {
  console.error('   ❌ Error:', error.message);
  if (error.error) {
    console.error('   Error details:', error.error);
  }
}

// Test 4: Check Database Connection
console.log('\n4. Testing database connection:');
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('   ✅ Database connected successfully');
  
  // Get appointment count
  const Appointment = (await import('./models/Appointment.js')).default;
  const count = await Appointment.countDocuments();
  console.log(`   Total appointments in database: ${count}`);
  
  // Check if there's at least one appointment
  if (count > 0) {
    const sampleAppointment = await Appointment.findOne()
      .populate('customerId', 'name email')
      .populate('services.serviceId', 'name');
    
    if (sampleAppointment) {
      console.log('\n5. Sample appointment details:');
      console.log('   ID:', sampleAppointment._id);
      console.log('   Customer:', sampleAppointment.customerId?.name || 'N/A');
      console.log('   Final Amount:', sampleAppointment.finalAmount || 'N/A');
      console.log('   Payment Status:', sampleAppointment.paymentStatus || 'N/A');
      console.log('   Services:', sampleAppointment.services?.length || 0);
    }
  }
  
  await mongoose.connection.close();
  console.log('\n   ✅ Database connection closed');
} catch (error) {
  console.error('   ❌ Database error:', error.message);
}

console.log('\n=== Test Complete ===\n');

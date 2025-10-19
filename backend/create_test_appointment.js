import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/Appointment.js';
import Customer from './models/Customer.js';
import Salon from './models/Salon.js';
import Service from './models/Service.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestAppointment = async () => {
  await connectDB();
  
  try {
    // Find any customer (using the first one we find)
    const customer = await Customer.findOne({});
    if (!customer) {
      console.log('❌ No customers found in the database.');
      return;
    }
    
    // Find test salon
    const salon = await Salon.findOne({ email: 'test-salon-owner@example.com' });
    if (!salon) {
      console.log('❌ Test salon not found. Please run create_test_salon_owner.mjs first.');
      return;
    }
    
    console.log('✅ Found customer and salon');
    console.log(`Customer: ${customer.name} (${customer.email})`);
    console.log(`Salon: ${salon.salonName} (${salon.email})`);
    
    // Check if salon has services, create one if not
    let service = await Service.findOne({ salonId: salon._id });
    if (!service) {
      console.log('Creating a test service for the salon...');
      service = await Service.create({
        salonId: salon._id,
        name: 'Haircut & Styling',
        category: 'Hair',
        price: 750,
        duration: 60,
        description: 'Professional haircut and styling service',
        isActive: true
      });
      console.log('✅ Created test service');
    }
    
    // Create test appointments with different dates to simulate "recent visits"
    const today = new Date();
    const dates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5), // 5 days ago
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10), // 10 days ago
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15), // 15 days ago
    ];
    
    for (let i = 0; i < dates.length; i++) {
      const appointmentDate = dates[i].toISOString().split('T')[0];
      
      const appointment = new Appointment({
        customerId: customer._id,
        salonId: salon._id,
        services: [
          {
            serviceId: service._id,
            serviceName: service.name,
            price: service.price,
            duration: service.duration
          }
        ],
        appointmentDate: `${appointmentDate}T14:30`,
        appointmentTime: '14:30',
        estimatedDuration: service.duration,
        totalAmount: service.price,
        finalAmount: service.price,
        customerNotes: 'Test appointment for recent salons feature',
        status: 'Completed',
        source: 'Website'
      });
      
      await appointment.save();
      console.log(`✅ Created test appointment ${i + 1} from ${appointmentDate}`);
    }
    
    console.log('\n🎉 Test appointments created successfully!');
    console.log('The Recent Salons feature should now display data.');
    
  } catch (error) {
    console.error('❌ Error creating test appointment:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestAppointment();
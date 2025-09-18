// Debug script to check the exact response from dashboard stats API
import mongoose from 'mongoose';
import Salon from './models/Salon.js';
import Staff from './models/Staff.js';
import Customer from './models/Customer.js';
import Appointment from './models/Appointment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auracare';

async function debugDashboardStats() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Simulate the exact same query as the getDashboardStats function
    const salonFilter = { 
      isActive: true
    };
    
    const statsPromises = [
      Salon.countDocuments(salonFilter).maxTimeMS(5000),
      Staff.countDocuments({ isActive: true }).maxTimeMS(5000),
      Customer.countDocuments({ isActive: true }).maxTimeMS(5000),
      Appointment.countDocuments().maxTimeMS(5000),
      Appointment.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'In-Progress'] } }).maxTimeMS(5000),
      Appointment.countDocuments({ status: 'Completed' }).maxTimeMS(5000)
    ];

    const [
      totalSalons,
      totalStaff,
      totalCustomers,
      totalAppointments,
      activeAppointments,
      completedAppointments
    ] = await Promise.all(statsPromises);

    // Simplified revenue calculation
    let totalRevenue = 0;
    try {
      const revenueResult = await Appointment.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    } catch (revenueError) {
      console.warn('Revenue calculation error:', revenueError.message);
      totalRevenue = 0;
    }

    const response = {
      totalSalons: totalSalons || 0,
      totalStaff: totalStaff || 0,
      totalCustomers: totalCustomers || 0,
      totalAppointments: totalAppointments || 0,
      activeAppointments: activeAppointments || 0,
      completedAppointments: completedAppointments || 0,
      totalRevenue: totalRevenue || 0
    };

    console.log('\n📊 DASHBOARD STATS RESPONSE:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n🔍 DETAILED BREAKDOWN:');
    console.log(`Salons (isActive: true): ${totalSalons}`);
    console.log(`Staff (isActive: true): ${totalStaff}`);
    console.log(`Customers (isActive: true): ${totalCustomers}`);
    console.log(`Total Appointments: ${totalAppointments}`);
    console.log(`Active Appointments: ${activeAppointments}`);
    console.log(`Completed Appointments: ${completedAppointments}`);
    console.log(`Total Revenue: ${totalRevenue}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugDashboardStats();
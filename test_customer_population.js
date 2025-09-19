const mongoose = require('mongoose');
const Appointment = require('./backend/models/Appointment.js').default;
const Customer = require('./backend/models/Customer.js').default;
const Salon = require('./backend/models/Salon.js').default;
const Service = require('./backend/models/Service.js').default;

// Connect to the in-memory database
mongoose.connect('mongodb://localhost:27017/auracares', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Create a test customer
    const customer = await Customer.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      contactNumber: '1234567890'
    });
    console.log('Created customer:', customer.name, customer.email);
    
    // Create a test salon
    const salon = await Salon.create({
      salonName: 'Test Salon',
      email: 'salon@example.com',
      password: 'password123',
      contactNumber: '9876543210',
      setupCompleted: true,
      approvalStatus: 'approved'
    });
    console.log('Created salon:', salon.salonName);
    
    // Create a test service
    const service = await Service.create({
      salonId: salon._id,
      name: 'Hair Cut',
      description: 'Professional hair cutting service',
      duration: 30,
      price: 500,
      category: 'Hair'
    });
    console.log('Created service:', service.name);
    
    // Create a test appointment
    const appointment = await Appointment.create({
      salonId: salon._id,
      customerId: customer._id,
      services: [{
        serviceId: service._id,
        serviceName: service.name,
        price: service.price,
        duration: service.duration
      }],
      appointmentDate: new Date('2025-09-20'),
      appointmentTime: '10:00',
      totalAmount: 500,
      finalAmount: 500,
      status: 'Pending'
    });
    console.log('Created appointment for customer:', appointment.customerId);
    
    // Test population
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name price');
    
    console.log('\n=== POPULATED APPOINTMENT ===');
    console.log('Appointment ID:', populatedAppointment._id);
    console.log('Customer ID:', populatedAppointment.customerId);
    console.log('Customer Name:', populatedAppointment.customerId?.name || 'No name');
    console.log('Customer Email:', populatedAppointment.customerId?.email || 'No email');
    console.log('Salon Name:', populatedAppointment.salonId?.salonName || 'No salon');
    console.log('Service Name:', populatedAppointment.services[0]?.serviceName || 'No service');
    console.log('Status:', populatedAppointment.status);
    
    // Test the salon appointments API endpoint
    console.log('\n=== TESTING SALON APPOINTMENTS API ===');
    const salonAppointments = await Appointment.find({ salonId: salon._id })
      .populate('customerId', 'name email')
      .populate('staffId', 'name skills')
      .populate('services.serviceId', 'name price duration');
    
    console.log('Found', salonAppointments.length, 'appointments for salon');
    salonAppointments.forEach((apt, i) => {
      console.log(`Appointment ${i + 1}:`);
      console.log('  Customer Name:', apt.customerId?.name || 'Unknown Customer');
      console.log('  Customer Email:', apt.customerId?.email || 'No email');
      console.log('  Service:', apt.services[0]?.serviceName || 'No service');
      console.log('  Status:', apt.status);
    });
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});


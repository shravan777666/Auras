// Debug script to check appointment data structure
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

// Models
const appointmentSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  services: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      serviceName: { type: String },
      price: { type: Number },
      duration: { type: Number }
    }
  ],
  appointmentDate: { type: String },
  appointmentTime: { type: String },
  estimatedDuration: { type: Number },
  status: { type: String }
});

const serviceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  name: { type: String },
  category: { type: String },
  price: { type: Number },
  duration: { type: Number }
});

const staffSchema = new mongoose.Schema({
  name: { type: String },
  skills: [{ type: String }],
  assignedSalon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
const Service = mongoose.model('Service', serviceSchema);
const Staff = mongoose.model('Staff', staffSchema);

async function debugAppointment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get appointment ID from command line argument or use default
    const appointmentId = process.argv[2] || '68f524f7b3aa5c360d8b2fb9';
    console.log(`Debugging appointment ID: ${appointmentId}`);
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('staffId', 'name skills assignedSalon')
      .populate('customerId', 'name')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name category');
    
    if (!appointment) {
      console.log('Appointment not found');
      return;
    }
    
    console.log('\n=== Appointment Data ===');
    console.log('ID:', appointment._id);
    console.log('Status:', appointment.status);
    console.log('Date:', appointment.appointmentDate);
    console.log('Time:', appointment.appointmentTime);
    console.log('Customer:', appointment.customerId?.name);
    console.log('Salon:', appointment.salonId?.salonName);
    console.log('Staff:', appointment.staffId?.name);
    
    console.log('\n=== Services ===');
    appointment.services.forEach((service, index) => {
      console.log(`Service ${index + 1}:`);
      console.log('  ID:', service.serviceId?._id || service.serviceId);
      console.log('  Name:', service.serviceName || service.serviceId?.name);
      console.log('  Category:', service.serviceId?.category);
      console.log('  Price:', service.price);
      console.log('  Duration:', service.duration);
    });
    
    console.log('\n=== Staff Skills ===');
    console.log('Staff Name:', appointment.staffId?.name);
    console.log('Staff Skills:', appointment.staffId?.skills);
    console.log('Staff Assigned Salon:', appointment.staffId?.assignedSalon);
    
    // If we're changing to a new staff member, check their skills
    if (process.argv[3]) {
      const newStaffId = process.argv[3];
      console.log(`\n=== New Staff Member (ID: ${newStaffId}) ===`);
      
      const newStaff = await Staff.findById(newStaffId);
      if (newStaff) {
        console.log('New Staff Name:', newStaff.name);
        console.log('New Staff Skills:', newStaff.skills);
        console.log('New Staff Assigned Salon:', newStaff.assignedSalon);
        
        // Check skill requirements
        console.log('\n=== Skill Validation ===');
        const serviceIds = appointment.services.map(s => s.serviceId?._id || s.serviceId);
        const services = await Service.find({ _id: { $in: serviceIds } });
        
        console.log('Services requiring skills:');
        services.forEach(service => {
          console.log(`  ${service.name}: ${service.category}`);
        });
        
        const requiredSkills = services.map(s => s.category);
        console.log('Required Skills:', requiredSkills);
        console.log('Staff Skills:', newStaff.skills);
        
        const hasRequiredSkills = requiredSkills.every(skill => 
          newStaff.skills.includes(skill) || newStaff.skills.includes('All')
        );
        
        console.log('Has Required Skills:', hasRequiredSkills);
        
        if (!hasRequiredSkills) {
          const missingSkills = requiredSkills.filter(skill => 
            !newStaff.skills.includes(skill) && !newStaff.skills.includes('All')
          );
          console.log('Missing Skills:', missingSkills);
        }
      } else {
        console.log('New staff member not found');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

debugAppointment();
// Simple debug script to check appointment data structure
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://shravanachu7:shravanachu7@dualityaura.lbvs9zs.mongodb.net/auracare';

// Simple schemas with only the fields we need
const appointmentSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId },
  customerId: { type: mongoose.Schema.Types.ObjectId },
  staffId: { type: mongoose.Schema.Types.ObjectId },
  services: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId },
      serviceName: { type: String },
      price: { type: Number },
      duration: { type: Number }
    }
  ],
  appointmentDate: { type: String },
  appointmentTime: { type: String },
  estimatedDuration: { type: Number },
  status: { type: String }
}, { collection: 'appointments' });

const serviceSchema = new mongoose.Schema({
  salonId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  category: { type: String },
  price: { type: Number },
  duration: { type: Number }
}, { collection: 'services' });

const staffSchema = new mongoose.Schema({
  name: { type: String },
  skills: [{ type: String }],
  assignedSalon: { type: mongoose.Schema.Types.ObjectId }
}, { collection: 'staffs' });

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
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      console.log('Appointment not found');
      return;
    }
    
    console.log('\n=== Appointment Data ===');
    console.log('ID:', appointment._id);
    console.log('Status:', appointment.status);
    console.log('Date:', appointment.appointmentDate);
    console.log('Time:', appointment.appointmentTime);
    console.log('Customer ID:', appointment.customerId);
    console.log('Salon ID:', appointment.salonId);
    console.log('Staff ID:', appointment.staffId);
    
    console.log('\n=== Services ===');
    appointment.services.forEach((service, index) => {
      console.log(`Service ${index + 1}:`);
      console.log('  ID:', service.serviceId);
      console.log('  Name:', service.serviceName);
      console.log('  Price:', service.price);
      console.log('  Duration:', service.duration);
    });
    
    // Get service details
    const serviceIds = appointment.services.map(s => s.serviceId);
    console.log('\n=== Service Details ===');
    const services = await Service.find({ _id: { $in: serviceIds } });
    services.forEach(service => {
      console.log(`Service: ${service.name}`);
      console.log('  ID:', service._id);
      console.log('  Category:', service.category);
      console.log('  Price:', service.price);
      console.log('  Duration:', service.duration);
    });
    
    // Get staff details
    console.log('\n=== Current Staff Details ===');
    const currentStaff = await Staff.findById(appointment.staffId);
    if (currentStaff) {
      console.log('Staff Name:', currentStaff.name);
      console.log('Staff Skills:', currentStaff.skills);
      console.log('Staff Assigned Salon:', currentStaff.assignedSalon);
    } else {
      console.log('Current staff not found');
    }
    
    // Get all staff for this salon
    console.log('\n=== All Staff for Salon ===');
    const salonStaff = await Staff.find({ assignedSalon: appointment.salonId });
    salonStaff.forEach(staff => {
      console.log(`Staff: ${staff.name}`);
      console.log('  ID:', staff._id);
      console.log('  Skills:', staff.skills);
    });
    
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
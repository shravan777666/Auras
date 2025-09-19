import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    services: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        serviceName: { type: String },
        price: { type: Number, required: true },
        duration: { type: Number, required: true }
      }
    ],
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    estimatedDuration: { type: Number, default: 0 },
    estimatedEndTime: { type: String },
    totalAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'In-Progress', 'Completed', 'Cancelled', 'No-Show'],
      default: 'Pending'
    },
    customerNotes: { type: String },
    specialRequests: { type: String },
    salonNotes: { type: String },
    staffNotes: { type: String },
    cancellationReason: { type: String },
    isFirstVisit: { type: Boolean, default: false },
    source: { type: String, default: 'Website' },
    rating: {
      overall: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      staff: { type: Number, min: 1, max: 5 },
      ambiance: { type: Number, min: 1, max: 5 }
    },
    feedback: { type: String }
  },
  { timestamps: true }
);

AppointmentSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

AppointmentSchema.methods.canBeCancelled = function () {
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes);
  
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  
  return appointmentDateTime > twoHoursFromNow;
};

AppointmentSchema.pre('save', function(next) {
  if (this.estimatedDuration && this.appointmentTime) {
    const [hours, minutes] = this.appointmentTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + this.estimatedDuration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    this.estimatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  next();
});

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
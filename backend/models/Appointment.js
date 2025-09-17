import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    services: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        price: { type: Number },
        duration: { type: Number }
      }
    ],
    appointmentDate: { type: Date },
    appointmentTime: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'In-Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    finalAmount: { type: Number, default: 0 },
    salonNotes: { type: String }
  },
  { timestamps: true }
);

AppointmentSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
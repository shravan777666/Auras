import mongoose from 'mongoose';

const RevenueSchema = new mongoose.Schema(
  {
    service: { type: String, required: true },
    amount: { type: Number, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: false },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Freelancer', required: false },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date, default: Date.now },
    description: { type: String },
    source: { type: String, default: 'Service' }
  },
  { timestamps: true }
);

// Index for efficient queries
RevenueSchema.index({ service: 1, date: -1 });
RevenueSchema.index({ salonId: 1, date: -1 });
RevenueSchema.index({ ownerId: 1, date: -1 });
RevenueSchema.index({ source: 1, date: -1 });

export default mongoose.models.Revenue || mongoose.model('Revenue', RevenueSchema);
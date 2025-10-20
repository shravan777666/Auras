import mongoose from 'mongoose';

const AddonSalesSchema = new mongoose.Schema(
  {
    saleId: { type: String, unique: true, required: true },
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    serviceName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    adminCommissionAmount: { type: Number, required: true },
    salonEarning: { type: Number, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.AddonSales || mongoose.model('AddonSales', AddonSalesSchema);
import mongoose from 'mongoose';

const SalonSettingsSchema = new mongoose.Schema(
  {
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, unique: true },
    adminCommissionRate: { type: Number, default: 0.15 }, // 15% default commission
    dynamicAddonDiscount: { type: Number, default: 0.20 }, // 20% default discount
    minGapForOffer: { type: Number, default: 30 }, // 30 minutes minimum gap
    maxGapForOffer: { type: Number, default: 120 }, // 120 minutes maximum gap
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.SalonSettings || mongoose.model('SalonSettings', SalonSettingsSchema);
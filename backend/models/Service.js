import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  average: { type: Number, default: 0 },
  count: { type: Number, default: 0 }
}, { _id: false });

const ServiceSchema = new mongoose.Schema(
  {
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
    name: { type: String },
    category: { type: String },
    description: { type: String },
    price: { type: Number },
    type: { type: String },
    discountedPrice: { type: Number },
    duration: { type: Number },
    availableStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
    tags: [{ type: String }],
    totalBookings: { type: Number, default: 0 },
    rating: { type: RatingSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
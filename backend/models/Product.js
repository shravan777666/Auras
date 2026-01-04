import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  average: { type: Number, default: 0 },
  count: { type: Number, default: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema(
  {
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    discountedPrice: { type: Number },
    brand: { type: String },
    quantity: { type: Number, default: 0 },
    sku: { type: String },
    image: { type: String },
    tags: [{ type: String }],
    totalSales: { type: Number, default: 0 },
    rating: { type: RatingSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
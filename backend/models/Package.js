import mongoose from 'mongoose';

const PackageSchema = new mongoose.Schema(
  {
    salonId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Salon',
      required: true 
    },
    name: { 
      type: String,
      required: true,
      trim: true
    },
    description: { 
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Festival', 'Custom'],
      default: 'Custom'
    },
    occasionType: {
      type: String,
      enum: ['Wedding', 'Birthday', 'Corporate Event', 'Anniversary', 'Festival', 'Graduation', 'Baby Shower', 'Other'],
      required: true
    },
    services: [{
      serviceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service',
        required: true
      },
      serviceName: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true }, // Price for this service in the package
      isSelected: { type: Boolean, default: true }
    }],
    totalPrice: { 
      type: Number,
      required: true,
      min: 0
    },
    discountedPrice: { 
      type: Number,
      min: 0
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    duration: { 
      type: Number, // Total duration in minutes
      required: true
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    images: [{
      url: { type: String },
      publicId: { type: String }
    }],
    tags: [{ type: String }],
    targetAudience: {
      type: String,
      enum: ['Bride', 'Groom', 'Women', 'Men', 'Couples', 'Groups', 'All'],
      default: 'All'
    },
    seasonal: {
      type: Boolean,
      default: false
    },
    season: {
      type: String,
      enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'All Year'],
      default: 'All Year'
    },
    totalBookings: { 
      type: Number, 
      default: 0 
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    }
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
PackageSchema.index({ salonId: 1, isActive: 1 });
PackageSchema.index({ occasionType: 1 });
PackageSchema.index({ category: 1 });

export default mongoose.models.Package || mongoose.model('Package', PackageSchema);
import mongoose from 'mongoose';

const addOnOfferSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        // If discount type is percentage, value should be between 0-100
        if (this.discountType === 'percentage') {
          return value >= 0 && value <= 100;
        }
        // If discount type is fixed, value should not exceed base price
        return value >= 0 && value <= this.basePrice;
      },
      message: 'Invalid discount value for the selected discount type'
    }
  },
  discountedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  termsAndConditions: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
addOnOfferSchema.index({ salonId: 1, isActive: 1, startDate: 1, endDate: 1 });

// Virtual to check if offer is currently valid
addOnOfferSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Method to calculate discounted price
addOnOfferSchema.methods.calculateDiscountedPrice = function() {
  if (this.discountType === 'percentage') {
    return this.basePrice - (this.basePrice * this.discountValue / 100);
  } else {
    return this.basePrice - this.discountValue;
  }
};

// Pre-save hook to auto-calculate discounted price
addOnOfferSchema.pre('save', function(next) {
  this.discountedPrice = this.calculateDiscountedPrice();
  next();
});

const AddOnOffer = mongoose.model('AddOnOffer', addOnOfferSchema);

export default AddOnOffer;

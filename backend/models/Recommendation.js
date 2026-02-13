import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  recommendations: [{
    serviceName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    estimatedPrice: {
      type: Number,
      default: 0
    },
    estimatedDuration: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['sent', 'viewed', 'booked', 'expired'],
    default: 'sent',
    index: true
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  viewedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    // TTL index is defined below in schema.index()
  },
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    basedOnService: {
      type: String,
      default: ''
    },
    recommendationType: {
      type: String,
      enum: ['follow-up', 'seasonal', 'promotional', 'personalized'],
      default: 'personalized'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
recommendationSchema.index({ customerId: 1, status: 1, sentAt: -1 });
recommendationSchema.index({ salonId: 1, sentAt: -1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for salon information
recommendationSchema.virtual('salon', {
  ref: 'Salon',
  localField: 'salonId',
  foreignField: '_id',
  justOne: true
});

// Virtual for customer information
recommendationSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON
recommendationSchema.set('toJSON', { virtuals: true });
recommendationSchema.set('toObject', { virtuals: true });

// Method to mark as viewed
recommendationSchema.methods.markAsViewed = function() {
  if (this.status === 'sent') {
    this.status = 'viewed';
    this.viewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if expired
recommendationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Static method to get active recommendations for a customer
recommendationSchema.statics.getActiveForCustomer = function(customerId, options = {}) {
  const query = {
    customerId,
    status: { $in: ['sent', 'viewed'] },
    expiresAt: { $gt: new Date() }
  };
  
  return this.find(query)
    .populate('salonId', 'salonName salonAddress contactNumber')
    .sort({ sentAt: -1 })
    .limit(options.limit || 20);
};

// Static method to cleanup expired recommendations
recommendationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      status: { $in: ['sent', 'viewed'] }
    },
    { 
      status: 'expired' 
    }
  );
};

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;

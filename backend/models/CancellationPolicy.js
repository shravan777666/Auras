import mongoose from 'mongoose';

const CancellationPolicySchema = new mongoose.Schema(
  {
    salonId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Salon', 
      required: true,
      unique: true
    },
    // Notice period in hours (24-48)
    noticePeriod: {
      type: Number,
      required: true,
      min: 1,
      max: 168, // up to 1 week
      default: 24
    },
    // Penalty for late cancellation (percentage of service cost)
    lateCancellationPenalty: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50
    },
    // Penalty for no-show (percentage of service cost)
    noShowPenalty: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100
    },
    // Enable/disable cancellation policy
    isActive: {
      type: Boolean,
      default: true
    },
    // Message to display to customers
    policyMessage: {
      type: String,
      default: 'Please cancel your appointment at least {noticePeriod} hours in advance to avoid penalties.'
    }
  },
  { 
    timestamps: true 
  }
);

// Format timestamps
CancellationPolicySchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.createdAt = ret.createdAt ? ret.createdAt.toISOString() : null;
    ret.updatedAt = ret.updatedAt ? ret.updatedAt.toISOString() : null;
    return ret;
  }
});

export default mongoose.models.CancellationPolicy || mongoose.model('CancellationPolicy', CancellationPolicySchema);
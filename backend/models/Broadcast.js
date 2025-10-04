import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  // Sender information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderSalonName: {
    type: String,
    required: true
  },

  // Message content
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // Targeting criteria
  targetSkill: {
    type: String,
    required: true
  },
  
  // Recipients tracking
  targetStaffIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }],
  targetCount: {
    type: Number,
    required: true
  },

  // Delivery tracking
  deliveredCount: {
    type: Number,
    default: 0
  },
  readCount: {
    type: Number,
    default: 0
  },

  // Status and metadata
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  
  // Analytics
  deliveryStats: {
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalRead: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
broadcastSchema.index({ senderId: 1, sentAt: -1 });
broadcastSchema.index({ targetSkill: 1 });
broadcastSchema.index({ status: 1 });

// Virtual for delivery rate
broadcastSchema.virtual('deliveryRate').get(function() {
  return this.targetCount > 0 ? (this.deliveredCount / this.targetCount * 100).toFixed(1) : 0;
});

// Virtual for read rate
broadcastSchema.virtual('readRate').get(function() {
  return this.deliveredCount > 0 ? (this.readCount / this.deliveredCount * 100).toFixed(1) : 0;
});

// Instance method to update delivery stats
broadcastSchema.methods.updateDeliveryStats = function() {
  this.deliveryStats.totalSent = this.targetCount;
  this.deliveryStats.totalDelivered = this.deliveredCount;
  this.deliveryStats.totalRead = this.readCount;
  this.deliveryStats.failedDeliveries = this.targetCount - this.deliveredCount;
  return this.save();
};

// Static method to get broadcasts by sender
broadcastSchema.statics.getBySender = function(senderId, options = {}) {
  const { page = 1, limit = 10 } = options;
  return this.find({ senderId })
    .sort({ sentAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('senderId', 'salonName email');
};

// Static method to get broadcast analytics
broadcastSchema.statics.getAnalytics = function(senderId, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        senderId: new mongoose.Types.ObjectId(senderId),
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalBroadcasts: { $sum: 1 },
        totalStaffReached: { $sum: '$targetCount' },
        totalDelivered: { $sum: '$deliveredCount' },
        totalRead: { $sum: '$readCount' },
        avgDeliveryRate: { $avg: { $divide: ['$deliveredCount', '$targetCount'] } },
        avgReadRate: { $avg: { $divide: ['$readCount', '$deliveredCount'] } }
      }
    }
  ]);
};

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

export default Broadcast;

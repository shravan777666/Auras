import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  tokenNumber: {
    type: String,
    required: true
    // unique index is defined below in schema.index()
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'arrived', 'in-service', 'completed', 'cancelled'],
    default: 'waiting'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  queuePosition: {
    type: Number,
    required: true
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  servedAt: {
    type: Date
  },
  arrivedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
queueSchema.index({ salonId: 1, status: 1 });
queueSchema.index({ salonId: 1, createdAt: -1 });
queueSchema.index({ tokenNumber: 1 }, { unique: true });

export default mongoose.model('Queue', queueSchema);
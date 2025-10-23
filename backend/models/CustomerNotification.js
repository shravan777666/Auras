import mongoose from 'mongoose';

const customerNotificationSchema = new mongoose.Schema({
  // Recipient information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },

  // Sender information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType',
    required: true
  },
  senderType: {
    type: String,
    enum: ['Salon', 'Staff'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String
  },
  senderSalonName: {
    type: String
  },

  // Notification content
  type: {
    type: String,
    enum: ['refund', 'appointment', 'promotion', 'system', 'direct_message'],
    default: 'system'
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Refund specific fields
  refundAmount: {
    type: Number
  },
  refundProcessedAt: {
    type: Date
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // Status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },

  // Interaction tracking
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Priority and categorization
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['refund', 'appointment', 'promotion', 'general'],
    default: 'general'
  },

  // Metadata
  metadata: {
    deviceType: String,
    userAgent: String,
    ipAddress: String,
    readDuration: Number // in seconds
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
customerNotificationSchema.index({ customerId: 1, createdAt: -1 });
customerNotificationSchema.index({ status: 1 });
customerNotificationSchema.index({ isRead: 1 });
customerNotificationSchema.index({ type: 1 });

// Compound indexes
customerNotificationSchema.index({ customerId: 1, isRead: 1, createdAt: -1 });
customerNotificationSchema.index({ customerId: 1, isArchived: 1, createdAt: -1 });

// Virtual for time since sent
customerNotificationSchema.virtual('timeSinceSent').get(function() {
  const now = new Date();
  const diffMs = now - this.sentAt;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
});

// Instance method to mark as read
customerNotificationSchema.methods.markAsRead = function(metadata = {}) {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = 'read';
    this.metadata = { ...this.metadata, ...metadata };
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to mark as delivered
customerNotificationSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get notifications for a customer
customerNotificationSchema.statics.getForCustomer = function(customerId, options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    unreadOnly = false, 
    category = null,
    includeArchived = false 
  } = options;
  
  const filter = { 
    customerId,
    ...(unreadOnly && { isRead: false }),
    ...(category && { category }),
    ...(!includeArchived && { isArchived: false })
  };
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('senderId', 'salonName email contactNumber');
};

// Static method to get unread count for a customer
customerNotificationSchema.statics.getUnreadCount = function(customerId) {
  return this.countDocuments({ 
    customerId, 
    isRead: false, 
    isArchived: false 
  });
};

// Static method to mark multiple notifications as read
customerNotificationSchema.statics.markMultipleAsRead = function(customerId, notificationIds) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds }, 
      customerId,
      isRead: false 
    },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date(), 
        status: 'read' 
      } 
    }
  );
};

const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);

export default CustomerNotification;
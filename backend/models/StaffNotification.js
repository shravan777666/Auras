import mongoose from 'mongoose';

const staffNotificationSchema = new mongoose.Schema({
  // Recipient information
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  staffEmail: {
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
    type: String,
    required: true
  },

  // Broadcast reference - made optional for direct messages
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broadcast',
    required: false // Changed from true to false
  },

  // Notification content
  type: {
    type: String,
    enum: ['broadcast', 'direct_message', 'system'],
    default: 'broadcast'
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Targeting information
  targetSkill: {
    type: String,
    required: true
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
    enum: ['opportunity', 'announcement', 'training', 'event', 'general'],
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
staffNotificationSchema.index({ staffId: 1, createdAt: -1 });
staffNotificationSchema.index({ broadcastId: 1 });
staffNotificationSchema.index({ status: 1 });
staffNotificationSchema.index({ isRead: 1 });
staffNotificationSchema.index({ targetSkill: 1 });
staffNotificationSchema.index({ senderId: 1 });

// Compound indexes
staffNotificationSchema.index({ staffId: 1, isRead: 1, createdAt: -1 });
staffNotificationSchema.index({ staffId: 1, isArchived: 1, createdAt: -1 });

// Virtual for time since sent
staffNotificationSchema.virtual('timeSinceSent').get(function() {
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
staffNotificationSchema.methods.markAsRead = function(metadata = {}) {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = 'read';
    this.metadata = { ...this.metadata, ...metadata };
    
    // Update the parent broadcast's read count only if broadcastId exists
    if (this.broadcastId) {
      return Promise.all([
        this.save(),
        mongoose.model('Broadcast').findByIdAndUpdate(
          this.broadcastId,
          { $inc: { readCount: 1 } }
        )
      ]);
    } else {
      return this.save();
    }
  }
  return Promise.resolve([this]);
};

// Instance method to mark as delivered
staffNotificationSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    
    // Update the parent broadcast's delivered count only if broadcastId exists
    if (this.broadcastId) {
      return Promise.all([
        this.save(),
        mongoose.model('Broadcast').findByIdAndUpdate(
          this.broadcastId,
          { $inc: { deliveredCount: 1 } }
        )
      ]);
    } else {
      return this.save();
    }
  }
  return Promise.resolve([this]);
};

// Static method to get notifications for a staff member
staffNotificationSchema.statics.getForStaff = function(staffId, options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    unreadOnly = false, 
    category = null,
    includeArchived = false 
  } = options;
  
  const filter = { 
    staffId,
    ...(unreadOnly && { isRead: false }),
    ...(category && { category }),
    ...(!includeArchived && { isArchived: false })
  };
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('senderId', 'salonName email contactNumber')
    .populate('broadcastId', 'subject targetSkill sentAt');
};

// Static method to get unread count for a staff member
staffNotificationSchema.statics.getUnreadCount = function(staffId) {
  return this.countDocuments({ 
    staffId, 
    isRead: false, 
    isArchived: false 
  });
};

// Static method to get notifications for a salon owner
staffNotificationSchema.statics.getForSalonOwner = function(salonId, options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    unreadOnly = false, 
    category = null,
    includeArchived = false,
    type = null
  } = options;
  
  const filter = { 
    staffId: salonId, // Salon owner is the recipient of notifications
    ...(unreadOnly && { isRead: false }),
    ...(category && { category }),
    ...(!includeArchived && { isArchived: false }),
    ...(type && { type })
  };
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('staffId', 'name email position')
    .populate({
      path: 'senderId',
      select: 'name email position',
      model: 'Staff'
    })
    .populate('broadcastId', 'subject targetSkill sentAt');
};

// Static method to get unread count for a salon owner
staffNotificationSchema.statics.getUnreadCountForSalonOwner = function(salonId) {
  return this.countDocuments({ 
    staffId: salonId, // Salon owner is the recipient
    isRead: false, 
    isArchived: false 
  });
};

// Static method to mark multiple notifications as read
staffNotificationSchema.statics.markMultipleAsRead = function(staffId, notificationIds) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds }, 
      staffId,
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

// Static method to get notification statistics for a staff member
staffNotificationSchema.statics.getStaffStats = function(staffId, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        staffId: new mongoose.Types.ObjectId(staffId),
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalNotifications: { $sum: 1 },
        unreadNotifications: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        readNotifications: {
          $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
        },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        },
        bySkill: {
          $push: {
            skill: '$targetSkill',
            count: 1
          }
        }
      }
    }
  ]);
};

const StaffNotification = mongoose.model('StaffNotification', staffNotificationSchema);

export default StaffNotification;

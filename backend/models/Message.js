import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  // Conversation identification
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // Participants
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  
  // Message details
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  senderType: {
    type: String,
    enum: ['salon', 'customer', 'staff'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  
  // Message content
  messageType: {
    type: String,
    enum: ['text', 'image', 'appointment_update', 'system'],
    default: 'text'
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Message metadata
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // System message data (for appointment updates, etc.)
  systemData: {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    actionType: {
      type: String,
      enum: ['appointment_booked', 'appointment_confirmed', 'appointment_cancelled', 'appointment_rescheduled']
    },
    oldValue: String,
    newValue: String
  },
  
  // Message status
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  },
  
  // Reply/thread support
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message reactions (future enhancement)
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reaction: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ salonId: 1, customerId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ isRead: 1, customerId: 1 });

// Virtual for sender information
MessageSchema.virtual('sender', {
  ref: function() {
    return this.senderType === 'customer' ? 'Customer' : 'User';
  },
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Method to mark message as read
MessageSchema.methods.markAsRead = function(readBy) {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create conversation ID
MessageSchema.statics.createConversationId = function(salonId, customerId) {
  return `${salonId}_${customerId}`;
};

// Static method to get conversation messages
MessageSchema.statics.getConversation = function(salonId, customerId, options = {}) {
  const conversationId = this.createConversationId(salonId, customerId);
  const limit = options.limit || 50;
  const skip = options.skip || 0;
  
  return this.find({ conversationId })
    .populate('senderId', 'name email')
    .populate('replyTo', 'content senderName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread message count
MessageSchema.statics.getUnreadCount = function(salonId, customerId) {
  const conversationId = this.createConversationId(salonId, customerId);
  
  return this.countDocuments({
    conversationId,
    isRead: false,
    senderType: 'customer' // Only count unread messages from customer
  });
};

// Static method to mark all messages as read
MessageSchema.statics.markConversationAsRead = function(salonId, customerId, readBy) {
  const conversationId = this.createConversationId(salonId, customerId);
  
  return this.updateMany(
    {
      conversationId,
      isRead: false,
      senderType: 'customer' // Only mark customer messages as read
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to send message
MessageSchema.statics.sendMessage = async function(messageData) {
  const {
    salonId,
    customerId,
    senderId,
    senderType,
    senderName,
    content,
    messageType = 'text',
    systemData = null,
    replyTo = null
  } = messageData;
  
  const conversationId = this.createConversationId(salonId, customerId);
  
  const message = await this.create({
    conversationId,
    salonId,
    customerId,
    senderId,
    senderType,
    senderName,
    content,
    messageType,
    systemData,
    replyTo,
    deliveryStatus: 'sent'
  });
  
  // Update client profile messaging status
  const ClientProfile = mongoose.model('ClientProfile');
  const profile = await ClientProfile.findOne({ customerId, salonId });
  if (profile) {
    await profile.updateMessagingStatus(senderType === 'customer' ? 'received' : 'sent');
  }
  
  return message.populate('senderId', 'name email');
};

// Static method to create system message
MessageSchema.statics.createSystemMessage = async function(salonId, customerId, actionType, appointmentId, content) {
  return this.sendMessage({
    salonId,
    customerId,
    senderId: salonId, // System messages are sent by salon
    senderType: 'salon',
    senderName: 'System',
    content,
    messageType: 'system',
    systemData: {
      appointmentId,
      actionType
    }
  });
};

// Pre-save middleware to ensure conversation ID
MessageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    this.conversationId = MessageSchema.statics.createConversationId(this.salonId, this.customerId);
  }
  next();
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;

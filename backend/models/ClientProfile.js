import mongoose from 'mongoose';

const ClientProfileSchema = new mongoose.Schema({
  // Basic client identification
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

  // SECTION 1: MESSAGING STATUS
  messagingStatus: {
    platform: {
      type: String,
      enum: ['text', 'app_chat'],
      default: 'app_chat'
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    lastMessageType: {
      type: String,
      enum: ['sent', 'received'],
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },

  // SECTION 2: KEY SERVICE INFO
  serviceInfo: {
    lastVisit: {
      date: Date,
      service: String,
      stylist: String,
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
      }
    },
    upcomingAppointment: {
      date: Date,
      time: String,
      service: String,
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
      }
    },
    preferredServices: [{
      serviceName: String,
      notes: String,
      requestedProducts: [String]
    }],
    totalVisits: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },

  // SECTION 3: PRIVATE INTERNAL NOTES
  internalNotes: {
    allergies: [{
      type: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      },
      notes: String
    }],
    personalPreferences: [{
      category: {
        type: String,
        enum: ['appointment_style', 'communication', 'environment', 'products', 'other']
      },
      preference: String,
      notes: String
    }],
    rebookingStatus: {
      needsRebookBy: Date,
      reason: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      notes: String
    },
    generalNotes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      category: {
        type: String,
        enum: ['general', 'service', 'behavior', 'payment', 'scheduling', 'other'],
        default: 'general'
      }
    }]
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
ClientProfileSchema.index({ customerId: 1, salonId: 1 }, { unique: true });
ClientProfileSchema.index({ salonId: 1, 'messagingStatus.lastMessageAt': -1 });
ClientProfileSchema.index({ salonId: 1, 'serviceInfo.lastVisit.date': -1 });

// Virtual for customer information
ClientProfileSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for salon information
ClientProfileSchema.virtual('salon', {
  ref: 'Salon',
  localField: 'salonId',
  foreignField: '_id',
  justOne: true
});

// Method to update messaging status
ClientProfileSchema.methods.updateMessagingStatus = function(messageType) {
  this.messagingStatus.lastMessageAt = new Date();
  this.messagingStatus.lastMessageType = messageType;
  return this.save();
};

// Method to add internal note
ClientProfileSchema.methods.addInternalNote = function(note, category, addedBy) {
  this.internalNotes.generalNotes.push({
    note,
    category,
    addedBy,
    addedAt: new Date()
  });
  this.lastUpdatedBy = addedBy;
  return this.save();
};

// Method to update service info from appointment
ClientProfileSchema.methods.updateServiceInfo = function(appointment) {
  // Update last visit if appointment is completed
  if (appointment.status === 'Completed') {
    this.serviceInfo.lastVisit = {
      date: new Date(appointment.appointmentDate),
      service: appointment.services.map(s => s.serviceName).join(', '),
      stylist: appointment.staffId?.name || 'Unknown',
      appointmentId: appointment._id
    };
    this.serviceInfo.totalVisits += 1;
    this.serviceInfo.totalSpent += appointment.finalAmount || appointment.totalAmount || 0;
  }
  
  // Update upcoming appointment if it's approved and in the future
  if (appointment.status === 'Approved' && new Date(appointment.appointmentDate) > new Date()) {
    this.serviceInfo.upcomingAppointment = {
      date: new Date(appointment.appointmentDate),
      time: appointment.appointmentTime,
      service: appointment.services.map(s => s.serviceName).join(', '),
      appointmentId: appointment._id
    };
  }
  
  return this.save();
};

// Static method to get or create client profile
ClientProfileSchema.statics.getOrCreateProfile = async function(customerId, salonId, createdBy) {
  let profile = await this.findOne({ customerId, salonId })
    .populate('customerId', 'name email')
    .populate('salonId', 'salonName');
  
  if (!profile) {
    profile = await this.create({
      customerId,
      salonId,
      createdBy,
      messagingStatus: {
        platform: 'app_chat',
        isActive: true
      },
      serviceInfo: {
        totalVisits: 0,
        totalSpent: 0
      },
      internalNotes: {
        allergies: [],
        personalPreferences: [],
        generalNotes: []
      }
    });
    
    // Populate the created profile
    profile = await this.findById(profile._id)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName');
  }
  
  return profile;
};

// Static method to update service info from appointments
ClientProfileSchema.statics.syncWithAppointments = async function(customerId, salonId) {
  const Appointment = mongoose.model('Appointment');
  
  // Get all appointments for this customer at this salon
  const appointments = await Appointment.find({ customerId, salonId })
    .populate('staffId', 'name')
    .sort({ appointmentDate: -1 });
  
  if (appointments.length === 0) return;
  
  const profile = await this.findOne({ customerId, salonId });
  if (!profile) return;
  
  // Find last completed appointment
  const lastCompleted = appointments.find(apt => apt.status === 'Completed');
  if (lastCompleted) {
    profile.serviceInfo.lastVisit = {
      date: new Date(lastCompleted.appointmentDate),
      service: lastCompleted.services.map(s => s.serviceName).join(', '),
      stylist: lastCompleted.staffId?.name || 'Unknown',
      appointmentId: lastCompleted._id
    };
  }
  
  // Find next upcoming approved appointment
  const upcoming = appointments.find(apt => 
    apt.status === 'Approved' && new Date(apt.appointmentDate) > new Date()
  );
  if (upcoming) {
    profile.serviceInfo.upcomingAppointment = {
      date: new Date(upcoming.appointmentDate),
      time: upcoming.appointmentTime,
      service: upcoming.services.map(s => s.serviceName).join(', '),
      appointmentId: upcoming._id
    };
  }
  
  // Calculate totals
  const completedAppointments = appointments.filter(apt => apt.status === 'Completed');
  profile.serviceInfo.totalVisits = completedAppointments.length;
  profile.serviceInfo.totalSpent = completedAppointments.reduce((total, apt) => 
    total + (apt.finalAmount || apt.totalAmount || 0), 0
  );
  
  await profile.save();
  return profile;
};

const ClientProfile = mongoose.model('ClientProfile', ClientProfileSchema);

export default ClientProfile;

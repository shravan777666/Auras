import mongoose from 'mongoose';
import Revenue from './Revenue.js';
import Salon from './Salon.js';

const AppointmentSchema = new mongoose.Schema(
  {
    salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    services: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        serviceName: { type: String },
        price: { type: Number, required: true },
        duration: { type: Number, required: true }
      }
    ],
    appointmentDate: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v);
        },
        message: 'appointmentDate must be in YYYY-MM-DDTHH:mm format'
      }
    },
    appointmentTime: { type: String, required: true },
    estimatedDuration: { type: Number, default: 0 },
    estimatedEndTime: { type: String },
    actualStartTime: { type: String }, // When service actually started (In-Progress status)
    actualEndTime: { type: String }, // When service actually ended (Completed status)
    totalAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'In-Progress', 'Completed', 'Cancelled', 'No-Show', 'STAFF_BLOCKED'],
      default: 'Pending'
    },
    customerNotes: { type: String },
    specialRequests: { type: String },
    salonNotes: { type: String },
    staffNotes: { type: String },
    cancellationReason: { type: String },
    // Cancellation policy fields
    cancellationPolicyAgreed: { type: Boolean, default: false },
    cancellationFee: { type: Number, default: 0 },
    cancellationFeePaid: { type: Boolean, default: false },
    cancellationType: {
      type: String,
      enum: ['Early', 'Late', 'No-Show'],
      default: 'Early'
    },
    cancellationReminderSent: { type: Boolean, default: false },
    reason: { type: String },
    isFirstVisit: { type: Boolean, default: false },
    source: { type: String, default: 'Website' },
    rating: {
      overall: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      staff: { type: Number, min: 1, max: 5 },
      ambiance: { type: Number, min: 1, max: 5 }
    },
    feedback: { type: String },
    pointsEarned: { type: Number, default: 0 },
    pointsRedeemed: { type: Number, default: 0 },
    discountFromPoints: { type: Number, default: 0 },
    // Payment fields
    paymentStatus: { 
      type: String, 
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending'
    },
    paymentId: { type: String },
    paymentError: { type: String }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Format timestamps to YYYY-MM-DDTHH:mm format
        if (ret.createdAt) {
          ret.createdAt = new Date(ret.createdAt).toISOString().slice(0, 16);
        }
        if (ret.updatedAt) {
          ret.updatedAt = new Date(ret.updatedAt).toISOString().slice(0, 16);
        }
        return ret;
      }
    }
  }
);

// Helper function to format date to YYYY-MM-DDTHH:mm
const formatToISOString = (date) => {
  return date.toISOString().slice(0, 16);
};

// Helper function to ensure date is in correct format
const ensureCorrectDateFormat = (dateString) => {
  // If it's already in the correct format, return as is
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle different date formats
  try {
    let date;
    
    // If it's a JavaScript Date object
    if (dateString instanceof Date) {
      date = dateString;
    }
    // If it's in YYYY-MM-DD format (just date)
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Keep the date part and add default time
      return `${dateString}T00:00`;
    }
    // If it's in ISO format with seconds/milliseconds, truncate
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
      return dateString.slice(0, 16);
    }
    // Try to parse as Date
    else {
      date = new Date(dateString);
    }
    
    if (date && !isNaN(date.getTime())) {
      return formatToISOString(date);
    }
  } catch (e) {
    console.warn('Date format conversion failed:', e.message, 'for date:', dateString);
  }
  
  // If all else fails, return original (this might still fail validation)
  return dateString;
};

AppointmentSchema.methods.updateStatus = async function (newStatus) {
  const oldStatus = this.status;
  this.status = newStatus;

  // Set actual start time when status changes to In-Progress
  if (newStatus === 'In-Progress' && oldStatus !== 'In-Progress') {
    const now = new Date();
    this.actualStartTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // Set actual end time when status changes to Completed
  if (newStatus === 'Completed' && oldStatus !== 'Completed') {
    const now = new Date();
    this.actualEndTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // Ensure appointmentDate is in correct format before saving
  this.appointmentDate = ensureCorrectDateFormat(this.appointmentDate);

  // Create revenue records and handle loyalty points when appointment is completed
  if (newStatus === 'Completed' && oldStatus !== 'Completed') {
    try {
      // Get salon to find owner
      const salon = await Salon.findById(this.salonId);

      if (salon) {
        // Create revenue record for each service
        for (const service of this.services) {
          await Revenue.create({
            service: service.serviceName,
            amount: service.price,
            appointmentId: this._id,
            salonId: this.salonId,
            ownerId: salon.ownerId,
            customerId: this.customerId,
            date: formatToISOString(new Date())
          });
        }
      }

      // Calculate and award loyalty points
      const pointsEarned = Math.floor(this.finalAmount / 10);
      if (pointsEarned > 0) {
        // Update appointment with earned points
        this.pointsEarned = pointsEarned;
        
        // Update customer loyalty points
        const Customer = (await import('./Customer.js')).default;
        const customer = await Customer.findById(this.customerId);
        if (customer) {
          customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
          customer.totalPointsEarned = (customer.totalPointsEarned || 0) + pointsEarned;
          
          // Update loyalty tier based on total points earned
          if (customer.totalPointsEarned >= 5000) {
            customer.loyaltyTier = 'Platinum';
          } else if (customer.totalPointsEarned >= 2000) {
            customer.loyaltyTier = 'Gold';
          } else if (customer.totalPointsEarned >= 500) {
            customer.loyaltyTier = 'Silver';
          }
          
          await customer.save();
        }
      }
    } catch (error) {
      console.error('Error creating revenue records or awarding loyalty points:', error);
      // Don't fail the status update if revenue creation or loyalty points fails
    }
  }

  return this.save();
};

AppointmentSchema.methods.canBeCancelled = function () {
  // Parse appointment date and time
  const [datePart, timePart] = this.appointmentDate.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  
  return appointmentDateTime > twoHoursFromNow;
};

// New method to check if appointment can be cancelled under salon policy
AppointmentSchema.methods.canBeCancelledUnderPolicy = async function () {
  // Import CancellationPolicy model
  const CancellationPolicy = (await import('./CancellationPolicy.js')).default;
  
  // Get salon's cancellation policy
  const policy = await CancellationPolicy.findOne({ salonId: this.salonId });
  
  // If no policy, use default behavior
  if (!policy || !policy.isActive) {
    return this.canBeCancelled();
  }
  
  // Parse appointment date and time
  const [datePart, timePart] = this.appointmentDate.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  const noticePeriodMillis = policy.noticePeriod * 60 * 60 * 1000;
  const noticePeriodDateTime = new Date(appointmentDateTime.getTime() - noticePeriodMillis);
  
  // Check if within notice period
  return now < noticePeriodDateTime;
};

// New method to calculate cancellation fee based on policy
AppointmentSchema.methods.calculateCancellationFee = async function () {
  // Import CancellationPolicy model
  const CancellationPolicy = (await import('./CancellationPolicy.js')).default;
  
  // Get salon's cancellation policy
  const policy = await CancellationPolicy.findOne({ salonId: this.salonId });
  
  // If no policy, no fee
  if (!policy || !policy.isActive) {
    return 0;
  }
  
  // Parse appointment date and time
  const [datePart, timePart] = this.appointmentDate.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  const noticePeriodMillis = policy.noticePeriod * 60 * 60 * 1000;
  const noticePeriodDateTime = new Date(appointmentDateTime.getTime() - noticePeriodMillis);
  
  // Determine cancellation type and fee
  if (now >= appointmentDateTime) {
    // No-show
    this.cancellationType = 'No-Show';
    return (this.finalAmount || this.totalAmount) * (policy.noShowPenalty / 100);
  } else if (now >= noticePeriodDateTime) {
    // Late cancellation
    this.cancellationType = 'Late';
    return (this.finalAmount || this.totalAmount) * (policy.lateCancellationPenalty / 100);
  } else {
    // Early cancellation (no fee)
    this.cancellationType = 'Early';
    return 0;
  }
};

AppointmentSchema.pre('save', function(next) {
  // Format appointmentDate to YYYY-MM-DDTHH:mm if it's a Date object or in wrong format
  this.appointmentDate = ensureCorrectDateFormat(this.appointmentDate);
  
  // Calculate estimated duration from all services if not set
  if (this.services && this.services.length > 0 && !this.estimatedDuration) {
    this.estimatedDuration = this.services.reduce((total, service) => {
      return total + (service.duration || 0);
    }, 0);
  }
  
  // Calculate estimated end time
  if (this.estimatedDuration && this.appointmentTime) {
    const [hours, minutes] = this.appointmentTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + this.estimatedDuration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    this.estimatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  
  // Format timestamps
  if (this.isNew) {
    this.createdAt = formatToISOString(new Date());
  }
  this.updatedAt = formatToISOString(new Date());
  
  // Log staff assignment for debugging
  if (this.staffId) {
    console.log('📝 Appointment saved with staff assignment:', {
      appointmentId: this._id,
      staffId: this.staffId,
      customerId: this.customerId,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime
    });
  } else {
    console.log('⚠️ Appointment saved without staff assignment:', {
      appointmentId: this._id,
      customerId: this.customerId,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime
    });
  }
  
  next();
});

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
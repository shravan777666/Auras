import mongoose from 'mongoose';

const ScheduleRequestSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    // Add salonId for direct filtering
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: false // Correcting to be optional to maintain backward compatibility
    },
    type: {
      type: String,
      enum: ['block-time', 'leave', 'shift-swap'],
      required: true
    },
    // For block-time requests
    blockTime: {
      date: { type: String, required: false }, // YYYY-MM-DD format
      startTime: { type: String, required: false }, // HH:mm format
      endTime: { type: String, required: false }, // HH:mm format
      reason: { 
        type: String, 
        enum: ['Lunch', 'Break', 'Personal', 'Other'],
        required: false
      }
    },
    // For leave requests
    leave: {
      startDate: { type: String, required: false }, // YYYY-MM-DD format
      endDate: { type: String, required: false }, // YYYY-MM-DD format
      reason: { type: String, required: false },
      notes: { type: String, required: false }
    },
    // For shift swap requests
    shiftSwap: {
      requesterShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: false },
      targetStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: false },
      targetShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: false },
      requesterNotes: { type: String, required: false }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'peer-approved', 'completed'],
      default: 'pending'
    },
    // For peer approval in shift swaps
    peerApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
      },
      approvedAt: { type: Date }
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Salon owner/admin
    },
    approvedAt: { type: Date },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Salon owner/admin
    },
    rejectedAt: { type: Date },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.ScheduleRequest || mongoose.model('ScheduleRequest', ScheduleRequestSchema);
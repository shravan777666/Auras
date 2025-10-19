import mongoose from 'mongoose';

const internalStaffFeedbackSchema = new mongoose.Schema({
  staffMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  type: {
    type: String,
    enum: ['Suggestion', 'Complaint', 'Facility', 'Management'],
    required: true,
  },
  subject: {
    type: String,
    maxlength: 100,
  },
  content: {
    type: String,
    maxlength: 1000,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  dateSubmitted: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['New', 'Under Review', 'Resolved'],
    default: 'New',
  },
});

export default mongoose.model('InternalStaffFeedback', internalStaffFeedbackSchema);

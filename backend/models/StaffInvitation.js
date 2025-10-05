import mongoose from 'mongoose';

const staffInvitationSchema = new mongoose.Schema({
  salon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  staffUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  commission: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
}, { timestamps: true });

export default mongoose.model('StaffInvitation', staffInvitationSchema);

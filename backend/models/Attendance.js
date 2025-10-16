import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    staffId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff', 
      required: true,
      index: true
    },
    salonId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Salon', 
      required: true,
      index: true
    },
    date: { 
      type: String, 
      required: true,
      index: true,
      validate: {
        validator: function(v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Date must be in YYYY-MM-DD format'
      }
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half-Day'],
      default: 'Present'
    },
    checkInTime: { type: String }, // HH:mm format
    checkOutTime: { type: String }, // HH:mm format
    notes: { type: String },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

// Ensure unique attendance record per staff per day
AttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
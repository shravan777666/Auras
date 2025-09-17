import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    userType: {
      type: String,
      required: true,
      enum: ['customer', 'staff', 'salon', 'admin']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
OTPSchema.index({ email: 1, userType: 1 });
OTPSchema.index({ otp: 1, email: 1 });

const OTP = mongoose.model('OTP', OTPSchema);

export default OTP;

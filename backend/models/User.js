import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: function() { return !this.googleId; } }, // Password not required for Google OAuth users
    // Role of the user: admin, salon (owner), staff (beauty professional), customer
    type: { type: String, enum: ['admin', 'salon', 'staff', 'customer'], required: true },
    // For salon/staff onboarding flows
    setupCompleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Google OAuth fields
    googleId: { type: String, sparse: true, unique: true },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    avatar: { type: String }, // Google profile picture URL
  },
  { timestamps: true }
);

// Hash password before saving (only for local auth users)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
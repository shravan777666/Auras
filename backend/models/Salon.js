import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SalonSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Make this optional for now to avoid issues
    },
    // Optional link to central User doc (for OAuth-based accounts)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    salonName: {
      type: String,
      required: false // Will be collected during setup
    },
    ownerName: {
      type: String,
      required: false // Make optional to handle existing records
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    // Password is optional for OAuth-based salons (User model handles auth)
    password: { type: String },
    type: { type: String, default: 'salon' },
    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String },
    experience: { type: Number },
    salonAddress: { 
      type: mongoose.Schema.Types.Mixed // Can be string or object
    },
    contactNumber: { type: String },
    businessHours: {
      openTime: { type: String },
      closeTime: { type: String },
      workingDays: [{ type: String }]
    },
    description: { type: String },
    salonImage: { type: String },
    licenseNumber: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    setupCompleted: { type: Boolean, default: false },
    approvalStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: { type: String },
    documents: {
      businessLicense: { type: String },
      salonImages: [{ type: String }],
      salonLogo: { type: String }
    },
    staff: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }],
    services: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }]
  },
  { timestamps: true }
);

// Hash password before saving
SalonSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

SalonSchema.methods.addStaff = function (staffId) {
  if (!this.staff.includes(staffId)) this.staff.push(staffId);
  return this.save();
};

SalonSchema.methods.removeStaff = function (staffId) {
  this.staff = this.staff.filter((s) => s.toString() !== staffId.toString());
  return this.save();
};

export default mongoose.models.Salon || mongoose.model('Salon', SalonSchema);
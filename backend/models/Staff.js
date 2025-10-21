import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const StaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional reference to central User document (auth source)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Password is optional on Staff profile because authentication is handled by the User model
    password: { type: String },
    type: { type: String, default: 'staff' },
    contactNumber: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' }
    },
    position: { type: String },
    experience: {
      years: { type: Number, default: 0 },
      description: { type: String }
    },
    skills: [{ type: String }],
    specialization: { type: String },
    availability: {
      workingDays: [{ type: String }],
      workingHours: {
        startTime: { type: String },
        endTime: { type: String }
      },
      breakTime: {
        startTime: { type: String },
        endTime: { type: String }
      }
    },
    profilePicture: { type: String },
    documents: {
      governmentId: { type: String },
      certificates: [{ type: String }]
    },
    isActive: { type: Boolean, default: true },
    setupCompleted: { type: Boolean, default: false },
    // Approval workflow fields
    approvalStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: { type: String },
    isVerified: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date },
    employmentStatus: { type: String, default: 'Available' },
    assignedSalon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', default: null },
    salary: { type: Number },
    joiningDate: { type: Date },
    // Salary management fields
    baseSalary: { type: Number },
    salaryType: { type: String, enum: ['Monthly', 'Hourly', 'Commission'] },
    commissionRate: { type: Number, min: 0, max: 100 }
  },
  { timestamps: true }
);

// Hash password before saving
StaffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
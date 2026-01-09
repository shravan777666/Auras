import mongoose from 'mongoose';

const FreelancerSchema = new mongoose.Schema(
  {
    // Reference to the central User document for authentication
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      unique: true
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    phone: { 
      type: String, 
      required: true,
      trim: true 
    },
    serviceLocation: { 
      type: String, 
      required: true,
      trim: true 
    },
    yearsOfExperience: { 
      type: Number, 
      required: true,
      min: 0 
    },
    skills: [{ 
      type: String,
      required: true
    }],
    profilePicture: { 
      type: String 
    },
    documents: {
      governmentId: { type: String },
      certificates: [{ type: String }]
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    setupCompleted: { 
      type: Boolean, 
      default: false 
    },
    // Approval workflow fields if needed in the future
    approvalStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: { type: String },
    isVerified: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.Freelancer || mongoose.model('Freelancer', FreelancerSchema);
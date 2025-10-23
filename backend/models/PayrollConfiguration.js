import mongoose from 'mongoose';

const PayrollConfigurationSchema = new mongoose.Schema({
  // Reference to the salon this configuration belongs to
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  
  // Job role (e.g., Hair Specialist, Spa Therapist, Nail Technician)
  jobRole: {
    type: String,
    required: true,
    trim: true
  },
  
  // Experience level (Junior, Senior, Master)
  experienceLevel: {
    type: String,
    required: true,
    trim: true,
    enum: ['Junior', 'Senior', 'Master']
  },
  
  // Fixed salary components
  basicSalaryFixed: {
    type: Number,
    required: true,
    min: 0
  },
  
  allowancesFixed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Deduction rates
  employeeEpfRate: {
    type: Number,
    default: 0.12, // 12% as default
    min: 0,
    max: 1
  },
  
  professionalTax: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Leave policy
  leaveThresholdDays: {
    type: Number,
    default: 2,
    min: 0
  },
  
  // Product deductions
  productDeductionsMonthly: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique combination of jobRole and experienceLevel per salon
PayrollConfigurationSchema.index({ salonId: 1, jobRole: 1, experienceLevel: 1 }, { unique: true });

// Update the updatedAt field before saving
PayrollConfigurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.PayrollConfiguration || mongoose.model('PayrollConfiguration', PayrollConfigurationSchema);
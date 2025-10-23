import mongoose from 'mongoose';

const PayrollRecordSchema = new mongoose.Schema({
  // Reference to the salon this payroll record belongs to
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  
  // Reference to the staff member
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true
  },
  
  // Payroll period
  payrollMonth: {
    type: Number, // 1-12
    required: true
  },
  payrollYear: {
    type: Number,
    required: true
  },
  
  // Staff details at time of payroll processing
  staffName: {
    type: String,
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  experienceLevel: {
    type: String,
    required: true
  },
  
  // Fixed salary components from configuration
  basicSalaryFixed: {
    type: Number,
    required: true
  },
  allowancesFixed: {
    type: Number,
    required: true
  },
  
  // Dynamic data from attendance
  workingDaysInMonth: {
    type: Number,
    required: true
  },
  totalAbsentDays: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Leave policy from configuration
  leaveThresholdDays: {
    type: Number,
    required: true
  },
  
  // Deduction rates from configuration
  employeeEpfRate: {
    type: Number,
    required: true
  },
  professionalTax: {
    type: Number,
    required: true
  },
  productDeductionsMonthly: {
    type: Number,
    required: true
  },
  
  // Calculated values
  daysAbsentExceedingLimit: {
    type: Number,
    required: true,
    default: 0
  },
  perDayRate: {
    type: Number,
    required: true
  },
  attendanceDeduction: {
    type: Number,
    required: true
  },
  grossSalary: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  
  // Deduction breakdown
  epfDeduction: {
    type: Number,
    required: true
  },
  attendanceDeductionDetail: {
    type: Number,
    required: true
  },
  
  // Processing metadata
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['processed', 'paid', 'cancelled'],
    default: 'processed'
  },
  
  // Payment details
  paymentDate: {
    type: Date
  },
  paymentReference: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure unique payroll record per staff per month/year
PayrollRecordSchema.index({ staffId: 1, payrollMonth: 1, payrollYear: 1 }, { unique: true });

// Create indexes for common queries
PayrollRecordSchema.index({ salonId: 1, payrollMonth: 1, payrollYear: 1 });
PayrollRecordSchema.index({ processedAt: -1 });

export default mongoose.models.PayrollRecord || mongoose.model('PayrollRecord', PayrollRecordSchema);
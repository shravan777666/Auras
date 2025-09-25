import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Supplies', 'Rent', 'Utilities', 'Marketing', 'Salaries', 'Equipment', 'Insurance', 'Maintenance', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  receipt: {
    type: String // Path to uploaded receipt file
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
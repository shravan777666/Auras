import mongoose from 'mongoose';
import crypto from 'crypto';

const giftCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balance: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageType: {
    type: String,
    required: true,
    enum: ['ONE_TIME', 'MULTIPLE_USE', 'SERVICE_ONLY', 'PRODUCT_ONLY', 'BOTH', 'SPECIFIC_SERVICES', 'SPECIFIC_PRODUCTS']
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'REDEEMED'],
    default: 'ACTIVE'
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    unique: true,
    required: true
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: 0
  },
  redemptionCount: {
    type: Number,
    default: 0
  },
  // New fields for better tracking
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: {
    type: Date
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Metadata fields
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Fields for gift card purchases
  isPurchasedByCustomer: {
    type: Boolean,
    default: false
  },
  originalTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GiftCard'
  },
  recipientEmail: {
    type: String,
    trim: true
  },
  personalMessage: {
    type: String,
    trim: true
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
giftCardSchema.index({ salonId: 1, status: 1 });
giftCardSchema.index({ code: 1 }, { unique: true });
giftCardSchema.index({ expiryDate: 1 });
giftCardSchema.index({ createdBy: 1 });
giftCardSchema.index({ 'metadata.batchId': 1 });

// Static method to generate a unique gift card code
giftCardSchema.statics.generateUniqueCode = async function(prefix = 'AURA') {
  let isUnique = false;
  let code = '';
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    // Generate random 6-character suffix
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `${prefix}-${suffix}`; // e.g., AURA-1A2B3C
    
    // Check if code exists in database
    const existingCard = await this.findOne({ code });
    if (!existingCard) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error(`Failed to generate unique gift card code after ${maxAttempts} attempts`);
  }
  
  return code;
};

// Static method to generate batch of unique codes
giftCardSchema.statics.generateBatchUniqueCodes = async function(count = 1, prefix = 'AURA') {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const code = `${prefix}-${suffix}`;
      
      // Check if code already exists in database OR in our batch
      const existingInDb = await this.findOne({ code });
      const existingInBatch = codes.includes(code);
      
      if (!existingInDb && !existingInBatch) {
        codes.push(code);
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error(`Failed to generate unique code for card ${i + 1} after ${maxAttempts} attempts`);
    }
  }
  
  return codes;
};

// Pre-save hook to ensure code is unique and balance is set
giftCardSchema.pre('save', async function(next) {
  try {
    // Generate a unique code if not provided
    if (!this.code || this.code.trim() === '') {
      this.code = await this.constructor.generateUniqueCode();
    } else {
      // If code is provided, check if it's unique (case-insensitive)
      const existingCard = await this.constructor.findOne({ 
        code: { $regex: new RegExp(`^${this.code}$`, 'i') },
        _id: { $ne: this._id } // Exclude current document when updating
      });
      
      if (existingCard) {
        throw new Error(`Gift card code "${this.code}" already exists`);
      }
    }
    
    // Set balance equal to amount if not set (for new gift cards)
    if (this.isNew && (this.balance === undefined || this.balance === null)) {
      this.balance = this.amount;
    }
    
    // Validate that balance doesn't exceed amount
    if (this.balance > this.amount) {
      throw new Error('Balance cannot exceed the original amount');
    }
    
    // Validate that balance is not negative
    if (this.balance < 0) {
      throw new Error('Balance cannot be negative');
    }
    
    // Update status based on balance and expiry
    if (this.balance <= 0 && this.status === 'ACTIVE') {
      this.status = 'REDEEMED';
      this.isRedeemed = true;
      this.redeemedAt = new Date();
    }
    
    // Check if gift card has expired
    if (this.expiryDate && this.expiryDate < new Date() && this.status === 'ACTIVE') {
      this.status = 'EXPIRED';
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update hook to handle balance changes
giftCardSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    
    // If balance is being updated, validate it
    if (update.$set && update.$set.balance !== undefined) {
      const giftCard = await this.model.findOne(this.getQuery());
      
      if (giftCard) {
        const newBalance = update.$set.balance;
        
        // Validate new balance doesn't exceed amount
        if (newBalance > giftCard.amount) {
          throw new Error('Balance cannot exceed the original amount');
        }
        
        // Validate new balance is not negative
        if (newBalance < 0) {
          throw new Error('Balance cannot be negative');
        }
        
        // Update status if balance becomes 0
        if (newBalance <= 0 && giftCard.status === 'ACTIVE') {
          update.$set.status = 'REDEEMED';
          update.$set.isRedeemed = true;
          update.$set.redeemedAt = new Date();
        }
      }
    }
    
    // If expiryDate is being updated, check if it's expired
    if (update.$set && update.$set.expiryDate) {
      const newExpiry = new Date(update.$set.expiryDate);
      if (newExpiry < new Date() && (!update.$set.status || update.$set.status === 'ACTIVE')) {
        update.$set.status = 'EXPIRED';
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to redeem gift card
giftCardSchema.methods.redeem = async function(amount = null, redeemedBy = null) {
  try {
    if (this.status !== 'ACTIVE') {
      throw new Error(`Cannot redeem gift card with status: ${this.status}`);
    }
    
    if (this.expiryDate < new Date()) {
      this.status = 'EXPIRED';
      await this.save();
      throw new Error('Gift card has expired');
    }
    
    const redeemAmount = amount || this.balance;
    
    if (redeemAmount <= 0) {
      throw new Error('Invalid redemption amount');
    }
    
    if (redeemAmount > this.balance) {
      throw new Error(`Insufficient balance. Available: ${this.balance}`);
    }
    
    // Update balance
    this.balance -= redeemAmount;
    this.redemptionCount += 1;
    
    // Update status if fully redeemed
    if (this.balance <= 0) {
      this.status = 'REDEEMED';
      this.isRedeemed = true;
      this.redeemedAt = new Date();
      if (redeemedBy) {
        this.redeemedBy = redeemedBy;
      }
    }
    
    await this.save();
    
    return {
      success: true,
      redeemedAmount: redeemAmount,
      remainingBalance: this.balance,
      newStatus: this.status,
      giftCard: this
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Instance method to check validity
giftCardSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status === 'ACTIVE' &&
    this.balance > 0 &&
    this.expiryDate > now
  );
};

// Instance method to get remaining validity in days
giftCardSchema.methods.getRemainingDays = function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Virtual for formatted code (with spaces for readability)
giftCardSchema.virtual('formattedCode').get(function() {
  if (!this.code) return '';
  // Format as AURA-XXX-XXX or similar
  return this.code.replace(/(.{4})/g, '$1 ').trim();
});

// Set toJSON options to include virtuals
giftCardSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive/internal fields
    delete ret.__v;
    delete ret.metadata;
    return ret;
  }
});

// Set toObject options
giftCardSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.metadata;
    return ret;
  }
});

export default mongoose.models.GiftCard || mongoose.model('GiftCard', giftCardSchema);
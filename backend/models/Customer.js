import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String },
    type: { type: String, default: 'customer' },
    contactNumber: { type: String, trim: true },
    isActive: { type: Boolean, default: true },

    // Keep only one profile image field for clarity
    profilePic: { type: String, default: null },

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    dateOfBirth: { type: Date },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    preferences: {
      preferredSalons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salon' }],
      favoriteServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
      notificationSettings: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    totalBookings: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    totalPointsRedeemed: { type: Number, default: 0 },
    loyaltyTier: { type: String, default: 'Standard' },
    favoriteSalon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
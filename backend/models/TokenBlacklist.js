import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Remove the expires option to prevent duplicate index warning
  },
});

// Create TTL index explicitly to expire documents after 7 days (604800 seconds)
tokenBlacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

export default TokenBlacklist;
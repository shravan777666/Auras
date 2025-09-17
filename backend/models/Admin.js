import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String },
    role: { type: String, default: 'admin' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
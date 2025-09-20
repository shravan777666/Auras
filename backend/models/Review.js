import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    // References
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },

    // Review details
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
  },
  {
    // createdAt/updatedAt will be managed automatically
    timestamps: true,
  }
);

// Ensure a user can only leave one review per appointment
ReviewSchema.index({ appointmentId: 1, userId: 1 }, { unique: true });

// Helpful index to query by salon
ReviewSchema.index({ salonId: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
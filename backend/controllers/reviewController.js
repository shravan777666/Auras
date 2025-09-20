import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  asyncHandler
} from '../utils/responses.js';

// Create a review
// Rules:
// - Reviewer must be an authenticated customer (enforced by middleware)
// - Appointment must exist, belong to the same customer, be Completed
// - Review references appointmentId and salonId
export const createReview = asyncHandler(async (req, res) => {
  const userId = req.user.id; // User (customer) id from token
  const { appointmentId, rating, comment } = req.body;

  // Validate appointment
  const appointment = await Appointment.findById(appointmentId).select('customerId salonId status');
  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  if (String(appointment.customerId) !== String(userId)) {
    return errorResponse(res, 'You can only review your own appointment', 403);
  }

  if (appointment.status !== 'Completed') {
    return errorResponse(res, 'You can only review completed appointments', 400);
  }

  try {
    const review = await Review.create({
      appointmentId: appointment._id,
      salonId: appointment.salonId,
      userId,
      rating,
      comment
    });

    return successResponse(res, review, 'Review created successfully');
  } catch (err) {
    // Handle duplicate review (unique index)
    if (err?.code === 11000) {
      return errorResponse(res, 'You have already reviewed this appointment', 409);
    }
    throw err;
  }
});

// List reviews by salon with pagination
export const listReviewsBySalon = asyncHandler(async (req, res) => {
  const { salonId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { salonId: new mongoose.Types.ObjectId(salonId) };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('userId', 'name')
      .populate('appointmentId', 'appointmentDate appointmentTime services')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  return paginatedResponse(res, reviews, {
    page,
    limit,
    totalPages,
    totalItems: total
  });
});

// Get salon review summary (average rating and total count)
export const getSalonReviewSummary = asyncHandler(async (req, res) => {
  const { salonId } = req.params;

  const [{ averageRating = 0, totalReviews = 0 } = {}] = await Review.aggregate([
    { $match: { salonId: new mongoose.Types.ObjectId(salonId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return successResponse(res, { averageRating, totalReviews }, 'Review summary');
});

export default {
  createReview,
  listReviewsBySalon,
  getSalonReviewSummary,
};
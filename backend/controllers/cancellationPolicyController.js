import { asyncHandler, successResponse, errorResponse, notFoundResponse } from '../utils/responses.js';
import CancellationPolicy from '../models/CancellationPolicy.js';
import Salon from '../models/Salon.js';

// @desc    Get salon's cancellation policy
// @route   GET /api/cancellation-policy/:salonId
// @access  Public
export const getPolicy = asyncHandler(async (req, res) => {
  const { salonId } = req.params;

  const policy = await CancellationPolicy.findOne({ salonId });

  if (!policy) {
    // Return default policy if none exists
    return successResponse(res, {
      noticePeriod: 24,
      lateCancellationPenalty: 50,
      noShowPenalty: 100,
      isActive: false,
      policyMessage: 'Please cancel your appointment at least 24 hours in advance to avoid penalties.'
    }, 'Default cancellation policy');
  }

  return successResponse(res, policy, 'Cancellation policy retrieved successfully');
});

// @desc    Create/update salon's cancellation policy
// @route   POST /api/cancellation-policy
// @access  Private/Salon Owner
export const createOrUpdatePolicy = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const { salonId, noticePeriod, lateCancellationPenalty, noShowPenalty, isActive, policyMessage } = req.body;

  // Verify salon ownership
  const salon = await Salon.findOne({ ownerId: salonOwnerId, _id: salonId });

  if (!salon) {
    return errorResponse(res, 'Salon not found or you do not have permission to modify this salon', 403);
  }

  // Validate notice period (24-48 hours recommended)
  if (noticePeriod < 1 || noticePeriod > 168) {
    return errorResponse(res, 'Notice period must be between 1 and 168 hours', 400);
  }

  // Validate penalties (0-100%)
  if (lateCancellationPenalty < 0 || lateCancellationPenalty > 100) {
    return errorResponse(res, 'Late cancellation penalty must be between 0 and 100%', 400);
  }

  if (noShowPenalty < 0 || noShowPenalty > 100) {
    return errorResponse(res, 'No-show penalty must be between 0 and 100%', 400);
  }

  // Create or update policy
  let policy = await CancellationPolicy.findOne({ salonId });

  if (policy) {
    // Update existing policy
    policy.noticePeriod = noticePeriod;
    policy.lateCancellationPenalty = lateCancellationPenalty;
    policy.noShowPenalty = noShowPenalty;
    policy.isActive = isActive;
    policy.policyMessage = policyMessage || `Please cancel your appointment at least ${noticePeriod} hours in advance to avoid penalties.`;
    
    await policy.save();
  } else {
    // Create new policy
    policy = await CancellationPolicy.create({
      salonId,
      noticePeriod,
      lateCancellationPenalty,
      noShowPenalty,
      isActive,
      policyMessage: policyMessage || `Please cancel your appointment at least ${noticePeriod} hours in advance to avoid penalties.`
    });
  }

  return successResponse(res, policy, 'Cancellation policy saved successfully');
});

// @desc    Get all cancellation policies for salon owner
// @route   GET /api/cancellation-policy
// @access  Private/Salon Owner
export const getOwnerPolicies = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;

  // Get all salons owned by user
  const salons = await Salon.find({ ownerId: salonOwnerId });

  if (!salons || salons.length === 0) {
    return successResponse(res, [], 'No salons found');
  }

  const salonIds = salons.map(salon => salon._id);

  // Get policies for all salons
  const policies = await CancellationPolicy.find({ salonId: { $in: salonIds } })
    .populate('salonId', 'salonName');

  return successResponse(res, policies, 'Cancellation policies retrieved successfully');
});

export default {
  getPolicy,
  createOrUpdatePolicy,
  getOwnerPolicies
};
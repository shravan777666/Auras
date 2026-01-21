import GiftCard from '../models/GiftCard.js';
import Salon from '../models/Salon.js';
import { sendGiftCardNotificationEmail } from '../utils/email.js';
import crypto from 'crypto';
import { 
  successResponse, 
  errorResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';
import { validationResult } from 'express-validator';

// Helper function to generate unique gift card code
const generateGiftCardCode = () => {
  // Generate 8-character alphanumeric code in format: AURA-XXXX
  const prefix = 'AURA';
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${randomChars}`; // e.g., AURA-1A2B3C4D
};

// Helper to generate a unique code with retry logic
const generateUniqueGiftCardCode = async () => {
  let isUnique = false;
  let attempts = 0;
  let code = '';
  
  while (!isUnique && attempts < 10) {
    code = generateGiftCardCode();
    
    // Check if code already exists
    const existingGiftCard = await GiftCard.findOne({ code });
    if (!existingGiftCard) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique gift card code after multiple attempts');
  }
  
  return code;
};

// Create a new gift card
export const createGiftCard = asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { name, amount, expiryDate, usageType, description, termsAndConditions } = req.body;

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // First, try to find salon by ownerId (more reliable association)
    let salon = await Salon.findOne({ ownerId: user._id });
    
    // If not found by ownerId, try to find by email as fallback
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Check if expiry date is in the future
    const expiry = new Date(expiryDate);
    if (expiry < new Date()) {
      return errorResponse(res, 'Expiry date must be in the future', 400);
    }

    // Generate unique gift card code
    const code = await generateUniqueGiftCardCode();
    
    // Validate required fields
    if (!name || !amount) {
      return errorResponse(res, 'Name and amount are required fields', 400);
    }

    // Create the gift card
    const giftCard = new GiftCard({
      code, // Add the generated code
      name,
      amount,
      expiryDate: expiry,
      usageType: usageType || 'ONE_TIME', // Default to ONE_TIME if not specified
      description: description || '',
      termsAndConditions: termsAndConditions || '',
      salonId: salon._id,
      createdBy: req.user.id,
      status: 'ACTIVE',
      balance: amount, // Initial balance equals the amount
      redemptionCount: 0
    });

    await giftCard.save();

    return successResponse(res, giftCard, 'Gift card created successfully');
  } catch (error) {
    console.error('Error creating gift card:', error);
    
    // Handle specific errors
    if (error.message.includes('unique gift card code')) {
      return errorResponse(res, 'Failed to generate unique gift card code. Please try again.', 500);
    }
    
    if (error.code === 11000) {
      return errorResponse(res, 'Gift card code already exists. Please try again.', 400);
    }
    
    if (error.name === 'ValidationError') {
      return errorResponse(res, `Validation error: ${error.message}`, 400);
    }
    
    return errorResponse(res, 'Failed to create gift card', 500);
  }
});

// Get all gift cards for a salon
export const getGiftCards = asyncHandler(async (req, res) => {
  try {
    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // First, try to find salon by ownerId (more reliable association)
    let salon = await Salon.findOne({ ownerId: user._id });
    
    // If not found by ownerId, try to find by email as fallback
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Build query
    let query = { salonId: salon._id };
    
    // Add status filter if provided
    const { status, search } = req.query;
    if (status) {
      query.status = status;
    } else {
      // By default, only return active cards
      query.status = 'ACTIVE';
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const giftCards = await GiftCard.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GiftCard.countDocuments(query);

    return successResponse(res, {
      giftCards,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: skip + giftCards.length < total,
        hasPrev: parseInt(page) > 1
      }
    }, 'Gift cards retrieved successfully');
  } catch (error) {
    console.error('Error fetching gift cards:', error);
    return errorResponse(res, 'Failed to fetch gift cards', 500);
  }
});

// Get a specific gift card by ID (for salon owners)
export const getGiftCardById = asyncHandler(async (req, res) => {
  try {
    const { giftCardId } = req.params;

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // First, try to find salon by ownerId (more reliable association)
    let salon = await Salon.findOne({ ownerId: user._id });
    
    // If not found by ownerId, try to find by email as fallback
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const giftCard = await GiftCard.findOne({ 
      _id: giftCardId, 
      salonId: salon._id 
    }).populate('createdBy', 'name email');

    if (!giftCard) {
      return notFoundResponse(res, 'Gift card');
    }

    return successResponse(res, giftCard, 'Gift card retrieved successfully');
  } catch (error) {
    console.error('Error fetching gift card:', error);
    return errorResponse(res, 'Failed to fetch gift card', 500);
  }
});

// Get a specific gift card template by ID (for customers)
export const getGiftCardTemplateById = asyncHandler(async (req, res) => {
  try {
    const { giftCardId } = req.params;

    // For customers - get any active gift card template
    const giftCard = await GiftCard.findOne({ 
      _id: giftCardId,
      status: 'ACTIVE',
      expiryDate: { $gte: new Date() } // Only include cards that haven't expired
    }).select('name amount description usageType code expiryDate occasionType');

    if (!giftCard) {
      return notFoundResponse(res, 'Gift card template');
    }

    return successResponse(res, giftCard, 'Gift card template retrieved successfully');
  } catch (error) {
    console.error('Error fetching gift card template:', error);
    return errorResponse(res, 'Failed to fetch gift card template', 500);
  }
});

// Update a gift card
export const updateGiftCard = asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { giftCardId } = req.params;
    const updateData = req.body;

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // First, try to find salon by ownerId (more reliable association)
    let salon = await Salon.findOne({ ownerId: user._id });
    
    // If not found by ownerId, try to find by email as fallback
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Check if expiry date is in the future when updating
    if (updateData.expiryDate) {
      const expiry = new Date(updateData.expiryDate);
      if (expiry < new Date()) {
        return errorResponse(res, 'Expiry date must be in the future', 400);
      }
    }

    // Prevent updating the code through this endpoint
    if (updateData.code) {
      return errorResponse(res, 'Gift card code cannot be changed', 400);
    }

    // Find the gift card to update
    const giftCard = await GiftCard.findOne({ _id: giftCardId, salonId: salon._id });
    
    if (!giftCard) {
      return notFoundResponse(res, 'Gift card');
    }
    
    // Update the fields (excluding immutable fields)
    const allowedFields = ['name', 'amount', 'expiryDate', 'usageType', 'description', 'termsAndConditions', 'status', 'balance'];
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        giftCard[key] = updateData[key];
      }
    });
    
    // Save the updated gift card
    await giftCard.save();
    
    // Populate the updated gift card
    const populatedGiftCard = await GiftCard.populate(giftCard, { path: 'createdBy', select: 'name email' });

    return successResponse(res, populatedGiftCard, 'Gift card updated successfully');
  } catch (error) {
    console.error('Error updating gift card:', error);
    
    if (error.name === 'ValidationError') {
      return errorResponse(res, `Validation error: ${error.message}`, 400);
    }
    
    return errorResponse(res, 'Failed to update gift card', 500);
  }
});

// Delete a gift card (soft delete by changing status to INACTIVE)
export const deleteGiftCard = asyncHandler(async (req, res) => {
  try {
    const { giftCardId } = req.params;

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // First, try to find salon by ownerId (more reliable association)
    let salon = await Salon.findOne({ ownerId: user._id });
    
    // If not found by ownerId, try to find by email as fallback
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const giftCard = await GiftCard.findOneAndUpdate(
      { _id: giftCardId, salonId: salon._id },
      { status: 'INACTIVE' },
      { new: true }
    );

    if (!giftCard) {
      return notFoundResponse(res, 'Gift card');
    }

    return successResponse(res, giftCard, 'Gift card deactivated successfully');
  } catch (error) {
    console.error('Error deactivating gift card:', error);
    return errorResponse(res, 'Failed to deactivate gift card', 500);
  }
});

// Get active gift cards for customers to purchase
export const getActiveGiftCards = asyncHandler(async (req, res) => {
  try {
    const { salonId } = req.params;

    // Verify salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    const giftCards = await GiftCard.find({
      salonId: salon._id,
      status: 'ACTIVE',
      expiryDate: { $gte: new Date() }, // Only include cards that haven't expired
      $or: [
        { recipientUser: null }, // Gift card templates that anyone can buy
        { recipientUser: req.user.id } // Gift cards assigned to this user
      ]
    }).select('name amount description usageType code expiryDate occasionType'); // Don't expose internal fields

    return successResponse(res, giftCards, 'Active gift cards retrieved successfully');
  } catch (error) {
    console.error('Error fetching active gift cards:', error);
    return errorResponse(res, 'Failed to fetch active gift cards', 500);
  }
});

// Redeem a gift card
export const redeemGiftCard = asyncHandler(async (req, res) => {
  try {
    const { code, salonId } = req.body;

    // Validate input
    if (!code || !salonId) {
      return errorResponse(res, 'Gift card code and salon ID are required', 400);
    }

    // Verify the gift card exists and is valid
    const giftCard = await GiftCard.findOne({
      code: code.toUpperCase(),
      salonId: salonId,
      status: 'ACTIVE',
      expiryDate: { $gte: new Date() }
    });

    if (!giftCard) {
      return errorResponse(res, 'Invalid or expired gift card code', 400);
    }

    // Check if gift card has balance
    if (giftCard.balance <= 0) {
      return errorResponse(res, 'Gift card has no remaining balance', 400);
    }

    // Update redemption count
    giftCard.redemptionCount += 1;
    await giftCard.save();

    return successResponse(res, {
      id: giftCard._id,
      name: giftCard.name,
      amount: giftCard.amount,
      balance: giftCard.balance,
      usageType: giftCard.usageType,
      expiryDate: giftCard.expiryDate,
      code: giftCard.code
    }, 'Gift card redeemed successfully');
  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return errorResponse(res, 'Failed to redeem gift card', 500);
  }
});

// Purchase a gift card (for customers) - LEGACY ROUTE
export const purchaseGiftCard = asyncHandler(async (req, res) => {
  return errorResponse(res, 'Direct gift card purchases are not allowed. Please use the payment gateway for purchases.', 400);
});

// Get gift cards owned by the authenticated customer
export const getMyGiftCards = asyncHandler(async (req, res) => {
  try {
    const giftCards = await GiftCard.find({
      recipientUser: req.user.id, // Get gift cards assigned to this user
      status: { $in: ['ACTIVE', 'INACTIVE', 'EXPIRED'] } // Include all statuses
    }).select('name amount balance description usageType code expiryDate status occasionType personalMessage');

    return successResponse(res, giftCards, 'My gift cards retrieved successfully');
  } catch (error) {
    console.error('Error fetching my gift cards:', error);
    return errorResponse(res, 'Failed to fetch my gift cards', 500);
  }
});



// Verify gift card by code (Salon Owner)
export const verifyGiftCardByCode = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return errorResponse(res, 'Gift card code is required', 400);
    }

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // Find salon
    let salon = await Salon.findOne({ ownerId: user._id });
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Find the gift card
    const giftCard = await GiftCard.findOne({
      code: code.toUpperCase().trim(),
      salonId: salon._id
    }).populate('recipientUser', 'firstName lastName email')
      .populate('purchasedBy', 'firstName lastName email');

    if (!giftCard) {
      return errorResponse(res, 'Gift card not found for your salon', 404);
    }

    // Check if expired
    const isExpired = giftCard.expiryDate < new Date();
    
    // Check if valid for redemption
    const isValid = giftCard.status === 'ACTIVE' && !isExpired && giftCard.balance > 0;

    return successResponse(res, {
      id: giftCard._id,
      code: giftCard.code,
      name: giftCard.name,
      amount: giftCard.amount,
      balance: giftCard.balance,
      usageType: giftCard.usageType,
      status: giftCard.status,
      expiryDate: giftCard.expiryDate,
      isExpired,
      isValid,
      redemptionCount: giftCard.redemptionCount,
      isRedeemed: giftCard.isRedeemed,
      redeemedAt: giftCard.redeemedAt,
      recipientEmail: giftCard.recipientEmail,
      recipientUser: giftCard.recipientUser,
      purchasedBy: giftCard.purchasedBy,
      personalMessage: giftCard.personalMessage,
      termsAndConditions: giftCard.termsAndConditions
    }, isValid ? 'Gift card is valid and ready for redemption' : 'Gift card verification complete');

  } catch (error) {
    console.error('Error verifying gift card:', error);
    return errorResponse(res, 'Failed to verify gift card', 500);
  }
});

// Redeem gift card by code (Salon Owner)
export const redeemGiftCardByCode = asyncHandler(async (req, res) => {
  try {
    const { code, amount, notes } = req.body;

    if (!code) {
      return errorResponse(res, 'Gift card code is required', 400);
    }

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // Find salon
    let salon = await Salon.findOne({ ownerId: user._id });
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Find the gift card
    const giftCard = await GiftCard.findOne({
      code: code.toUpperCase().trim(),
      salonId: salon._id
    });

    if (!giftCard) {
      return errorResponse(res, 'Gift card not found for your salon', 404);
    }

    // Validate redemption
    if (giftCard.status !== 'ACTIVE') {
      return errorResponse(res, `Cannot redeem gift card with status: ${giftCard.status}`, 400);
    }

    if (giftCard.expiryDate < new Date()) {
      giftCard.status = 'EXPIRED';
      await giftCard.save();
      return errorResponse(res, 'Gift card has expired', 400);
    }

    if (giftCard.balance <= 0) {
      return errorResponse(res, 'Gift card has no remaining balance', 400);
    }

    // Determine redemption amount
    const redeemAmount = amount && amount > 0 ? parseFloat(amount) : giftCard.balance;

    if (redeemAmount > giftCard.balance) {
      return errorResponse(res, `Insufficient balance. Available: ₹${giftCard.balance}`, 400);
    }

    // Perform redemption
    const previousBalance = giftCard.balance;
    giftCard.balance -= redeemAmount;
    giftCard.redemptionCount += 1;

    // Update status if fully redeemed
    if (giftCard.balance <= 0) {
      giftCard.status = 'REDEEMED';
      giftCard.isRedeemed = true;
      giftCard.redeemedAt = new Date();
      giftCard.redeemedBy = req.user.id;
    }

    // Add notes to metadata if provided
    if (notes) {
      if (!giftCard.metadata) {
        giftCard.metadata = {};
      }
      if (!giftCard.metadata.redemptionHistory) {
        giftCard.metadata.redemptionHistory = [];
      }
      giftCard.metadata.redemptionHistory.push({
        date: new Date(),
        amount: redeemAmount,
        previousBalance,
        newBalance: giftCard.balance,
        redeemedBy: req.user.id,
        notes
      });
    }

    await giftCard.save();

    return successResponse(res, {
      id: giftCard._id,
      code: giftCard.code,
      name: giftCard.name,
      redeemedAmount: redeemAmount,
      previousBalance,
      remainingBalance: giftCard.balance,
      status: giftCard.status,
      isFullyRedeemed: giftCard.balance <= 0,
      redemptionCount: giftCard.redemptionCount
    }, giftCard.balance <= 0 ? 'Gift card fully redeemed successfully' : 'Gift card partially redeemed successfully');

  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return errorResponse(res, 'Failed to redeem gift card', 500);
  }
});

// Generate multiple gift cards at once (bulk creation)
export const bulkCreateGiftCards = asyncHandler(async (req, res) => {
  try {
    const { count = 1, amount, expiryDate, usageType, namePrefix = 'Gift Card' } = req.body;

    // Verify salon exists and belongs to the user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied', 403);
    }

    // Find salon
    let salon = await Salon.findOne({ ownerId: user._id });
    if (!salon) {
      salon = await Salon.findOne({ email: user.email });
    }
    
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    if (count > 50) {
      return errorResponse(res, 'Cannot create more than 50 gift cards at once', 400);
    }

    const giftCards = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        const code = await generateUniqueGiftCardCode();
        const giftCard = new GiftCard({
          code,
          name: `${namePrefix} ${i + 1}`,
          amount,
          expiryDate: new Date(expiryDate),
          usageType: usageType || 'ONE_TIME',
          salonId: salon._id,
          createdBy: req.user.id,
          status: 'ACTIVE',
          balance: amount
        });

        await giftCard.save();
        giftCards.push(giftCard);
      } catch (error) {
        errors.push(`Card ${i + 1}: ${error.message}`);
      }
    }

    return successResponse(res, {
      created: giftCards,
      failed: errors,
      totalCreated: giftCards.length,
      totalFailed: errors.length
    }, `Successfully created ${giftCards.length} gift cards`);

  } catch (error) {
    console.error('Error in bulk gift card creation:', error);
    return errorResponse(res, 'Failed to create gift cards in bulk', 500);
  }
});
import express from 'express';
import { 
  createGiftCard, 
  getGiftCards, 
  getGiftCardById, 
  updateGiftCard, 
  deleteGiftCard,
  getActiveGiftCards,
  redeemGiftCard,
  bulkCreateGiftCards,  // Added bulk creation
  purchaseGiftCard,  // Added customer purchase function
  getGiftCardTemplateById,  // Added for customer template access
  getMyGiftCards,  // Added for retrieving recipient's gift cards
  verifyGiftCardByCode,  // Added for salon owner verification
  redeemGiftCardByCode  // Added for salon owner redemption
} from '../controllers/giftCardController.js';

import {
  createGiftCardPaymentOrder,
  verifyGiftCardPayment
} from '../controllers/giftCardPaymentController.js';
import { requireSalonOwner, requireCustomer } from '../middleware/roleAuth.js';
import { validateObjectId } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation middleware for gift card creation
const validateGiftCard = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .toDate(),
  body('usageType')
    .isIn(['ONE_TIME', 'MULTIPLE_USE', 'SERVICE_ONLY', 'PRODUCT_ONLY', 'BOTH', 'SPECIFIC_SERVICES', 'SPECIFIC_PRODUCTS'])  // Updated enum values
    .withMessage('Usage type must be one of the allowed values'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('termsAndConditions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Terms and conditions must not exceed 2000 characters'),
  body('code')
    .optional()  // Made optional since it will be auto-generated
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Code can only contain uppercase letters, numbers, and hyphens')
    .isLength({ min: 6, max: 20 })
    .withMessage('Code must be between 6 and 20 characters')
];

// Validation middleware for gift card updates
const validateGiftCardUpdate = [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Balance must be a positive number'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .toDate(),
  body('usageType')
    .optional()
    .isIn(['ONE_TIME', 'MULTIPLE_USE', 'SERVICE_ONLY', 'PRODUCT_ONLY', 'BOTH', 'SPECIFIC_SERVICES', 'SPECIFIC_PRODUCTS'])  // Updated enum values
    .withMessage('Usage type must be one of the allowed values'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'REDEEMED'])
    .withMessage('Status must be one of the allowed values'),
  body('termsAndConditions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Terms and conditions must not exceed 2000 characters'),
  body('code')
    .optional()
    .custom((value, { req }) => {
      if (req.method === 'PUT' && value) {
        throw new Error('Gift card code cannot be changed');
      }
      return true;
    })
];

// Validation middleware for bulk creation
const validateBulkGiftCard = [
  body('count')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Count must be between 1 and 50'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .toDate(),
  body('usageType')
    .optional()
    .isIn(['ONE_TIME', 'MULTIPLE_USE', 'SERVICE_ONLY', 'PRODUCT_ONLY', 'BOTH', 'SPECIFIC_SERVICES', 'SPECIFIC_PRODUCTS'])
    .withMessage('Usage type must be one of the allowed values'),
  body('namePrefix')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Name prefix must not exceed 50 characters')
];

// Validation middleware for redemption
const validateRedemption = [
  body('code')
    .notEmpty()
    .withMessage('Gift card code is required')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Code must be between 4 and 20 characters'),
  body('salonId')
    .notEmpty()
    .withMessage('Salon ID is required')
    .isMongoId()
    .withMessage('Invalid salon ID format'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number if provided')
];

// Salon owner routes
router.use('/salon', requireSalonOwner);

// Create a new gift card
router.post('/salon', validateGiftCard, createGiftCard);

// Bulk create gift cards
router.post('/salon/bulk', validateBulkGiftCard, bulkCreateGiftCards);

// Get all gift cards for a salon with filters
router.get('/salon', [
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'REDEEMED', 'ALL'])
    .withMessage('Status must be one of the allowed values'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['name', 'amount', 'expiryDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
], getGiftCards);

// Get a specific gift card by ID
router.get('/salon/:giftCardId', validateObjectId('giftCardId'), getGiftCardById);

// Update a gift card
router.put('/salon/:giftCardId', validateObjectId('giftCardId'), validateGiftCardUpdate, updateGiftCard);

// Delete (deactivate) a gift card
router.delete('/salon/:giftCardId', validateObjectId('giftCardId'), deleteGiftCard);

// Verify gift card by code (Salon Owner)
router.post('/salon/verify-code', [
  requireSalonOwner,
  body('code')
    .notEmpty()
    .withMessage('Gift card code is required')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Code must be between 4 and 20 characters')
], verifyGiftCardByCode);

// Redeem gift card by code (Salon Owner)
router.post('/salon/redeem-code', [
  requireSalonOwner,
  body('code')
    .notEmpty()
    .withMessage('Gift card code is required')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Code must be between 4 and 20 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Redemption amount must be a positive number'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], redeemGiftCardByCode);

// Public routes (no authentication required)
// Get active gift cards for a specific salon (public endpoint)
router.get('/public/salon/:salonId', validateObjectId('salonId'), getActiveGiftCards);

// Customer routes
router.use('/customer', requireCustomer);

// Get active gift cards for a specific salon
router.get('/customer/salon/:salonId', validateObjectId('salonId'), getActiveGiftCards);

// Get a specific gift card template by ID (for customers)
router.get('/customer/template/:giftCardId', validateObjectId('giftCardId'), getGiftCardTemplateById);

// Get gift cards owned by the authenticated customer
router.get('/customer/my-gift-cards', requireCustomer, getMyGiftCards);

// Redeem a gift card
router.post('/customer/redeem', validateRedemption, redeemGiftCard);

// Create payment order for gift card purchase
router.post('/customer/payment-order', [
  body('giftCardId')
    .notEmpty()
    .withMessage('Gift card ID is required')
    .isMongoId()
    .withMessage('Invalid gift card ID format'),
  body('recipientEmail')
    .notEmpty()
    .withMessage('Recipient email is required')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('salonId')
    .notEmpty()
    .withMessage('Salon ID is required')
    .isMongoId()
    .withMessage('Invalid salon ID format'),
  body('personalMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Personal message must not exceed 500 characters'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .toDate(),
], createGiftCardPaymentOrder);

// Verify payment and complete gift card purchase
router.post('/customer/verify-payment', [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
], verifyGiftCardPayment);

// Legacy route - kept for backward compatibility
router.post('/customer/purchase', [
  body('giftCardId')
    .notEmpty()
    .withMessage('Gift card ID is required')
    .isMongoId()
    .withMessage('Invalid gift card ID format'),
  body('recipientEmail')
    .notEmpty()
    .withMessage('Recipient email is required')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('salonId')
    .notEmpty()
    .withMessage('Salon ID is required')
    .isMongoId()
    .withMessage('Invalid salon ID format'),
  body('personalMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Personal message must not exceed 500 characters'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .toDate(),
], purchaseGiftCard);

// Validate a gift card (check if valid without redeeming)
router.post('/customer/validate', [
  body('code')
    .notEmpty()
    .withMessage('Gift card code is required')
    .trim(),
  body('salonId')
    .notEmpty()
    .withMessage('Salon ID is required')
    .isMongoId()
    .withMessage('Invalid salon ID format')
], async (req, res) => {
  // This endpoint can be added to the controller if needed
  // For now, using redeem endpoint with a validation flag
  const { code, salonId } = req.body;
  
  try {
    // Import the GiftCard model
    const GiftCard = (await import('../models/GiftCard.js')).default;
    
    const giftCard = await GiftCard.findOne({
      code: code.toUpperCase(),
      salonId: salonId,
      status: 'ACTIVE',
      expiryDate: { $gte: new Date() },
      balance: { $gt: 0 }
    }).select('name amount balance expiryDate usageType code');
    
    if (!giftCard) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or insufficient balance gift card'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: giftCard,
      message: 'Gift card is valid'
    });
    
  } catch (error) {
    console.error('Error validating gift card:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate gift card'
    });
  }
});

// Get gift card by code (for verification)
router.get('/code/:code', [
  param('code')
    .notEmpty()
    .withMessage('Gift card code is required')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Code must be between 4 and 20 characters')
], async (req, res) => {
  const { code } = req.params;
  
  try {
    // Import the GiftCard model
    const GiftCard = (await import('../models/GiftCard.js')).default;
    
    const giftCard = await GiftCard.findOne({
      code: code.toUpperCase()
    })
    .populate('salonId', 'name email phone')
    .populate('createdBy', 'name email')
    .select('-__v -metadata');
    
    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: 'Gift card not found'
      });
    }
    
    // Check permissions (salon owner can see their own cards)
    if (req.user && req.user.type === 'salon') {
      const salon = await (await import('../models/Salon.js')).default.findOne({ ownerId: req.user.id });
      if (salon && giftCard.salonId._id.toString() === salon._id.toString()) {
        return res.status(200).json({
          success: true,
          data: giftCard,
          message: 'Gift card retrieved successfully'
        });
      }
    }
    
    // For public access, return limited info
    const publicInfo = {
      id: giftCard._id,
      name: giftCard.name,
      amount: giftCard.amount,
      balance: giftCard.balance,
      code: giftCard.code,
      expiryDate: giftCard.expiryDate,
      usageType: giftCard.usageType,
      status: giftCard.status,
      salonName: giftCard.salonId?.name,
      isValid: giftCard.isValid(),
      remainingDays: giftCard.getRemainingDays()
    };
    
    return res.status(200).json({
      success: true,
      data: publicInfo,
      message: 'Gift card retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching gift card by code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch gift card'
    });
  }
});

export default router;
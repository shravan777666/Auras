import Razorpay from 'razorpay';
import GiftCard from '../models/GiftCard.js';
import Salon from '../models/Salon.js';
import Revenue from '../models/Revenue.js';
import crypto from 'crypto';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Create payment order for gift card purchase
export const createGiftCardPaymentOrder = asyncHandler(async (req, res) => {
  try {
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials are not configured in environment variables');
      return errorResponse(res, 'Payment gateway is not configured. Please contact administrator.', 500);
    }
    
    // Initialize Razorpay instance inside the function to ensure env vars are loaded
    try {
      var razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    } catch (error) {
      console.error('Error initializing Razorpay:', error.message);
      return errorResponse(res, 'Payment gateway configuration error. Please contact administrator.', 500);
    }

    const { giftCardId, recipientEmail, personalMessage, expiryDate, salonId } = req.body;
    const userId = req.user.id;

    // Find the gift card template
    const giftCardTemplate = await GiftCard.findById(giftCardId);
    if (!giftCardTemplate) {
      return notFoundResponse(res, 'Gift card template');
    }

    // Verify that the gift card belongs to the specified salon
    if (giftCardTemplate.salonId.toString() !== salonId) {
      return errorResponse(res, 'Gift card does not belong to the specified salon', 400);
    }

    // Verify the salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    // Create Razorpay order for gift card
    const options = {
      amount: Math.round(giftCardTemplate.amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `gc_${giftCardId.substring(0, 8)}_${Date.now().toString().substring(0, 8)}`,
      payment_capture: 1,
      notes: {
        transaction_type: 'GIFT_CARD_PAYMENT',
        gift_card_id: giftCardId,
        recipient_email: recipientEmail,
        purchaser_id: userId,
        salon_id: salonId
      }
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error('Error creating Razorpay order:', razorpayError);
      return errorResponse(res, 'Failed to create payment order with payment gateway', 500);
    }

    // Store temporary order info in session
    req.session.tempGiftCardOrder = {
      orderId: order.id,
      giftCardTemplateId: giftCardTemplate._id,
      recipientEmail,
      personalMessage,
      expiryDate,
      salonId,
      amount: giftCardTemplate.amount,
      userId: req.user.id,
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // Order expires in 30 minutes
    };

    return successResponse(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      giftCardId: giftCardTemplate._id,
      giftCardName: giftCardTemplate.name,
      giftCardAmount: giftCardTemplate.amount,
      recipientEmail: recipientEmail,
      salonName: salon.salonName || salon.name,
      transactionType: 'GIFT_CARD_PAYMENT'
    }, 'Gift card payment order created successfully');
  } catch (error) {
    console.error('Error creating gift card payment order:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(res, 'Failed to create gift card payment order', 500);
  }
});

// Verify gift card payment and complete purchase
export const verifyGiftCardPayment = asyncHandler(async (req, res) => {
  try {
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials are not configured in environment variables');
      return errorResponse(res, 'Payment gateway is not configured. Please contact administrator.', 500);
    }
    
    // Initialize Razorpay instance inside the function to ensure env vars are loaded
    try {
      var razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    } catch (error) {
      console.error('Error initializing Razorpay:', error.message);
      return errorResponse(res, 'Payment gateway configuration error. Please contact administrator.', 500);
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    console.log('Gift card payment verification request:', {
      razorpay_order_id,
      razorpay_payment_id,
      orderId
    });

    // Check if required environment variables are present
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET is not set in environment variables');
      return errorResponse(res, 'Payment configuration error', 500);
    }

    // Skip signature verification in development mode with mock data
    const isDevelopmentMode = process.env.NODE_ENV === 'development';
    const isMockSignature = razorpay_signature === 'mock_signature_for_dev';
    
    if (!(isDevelopmentMode && isMockSignature)) {
      // Verify payment signature
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpay_signature) {
        console.log('Gift card payment signature verification failed:', {
          generated: digest,
          received: razorpay_signature
        });
        return errorResponse(res, 'Gift card payment verification failed', 400);
      }
    } else {
      console.log('Skipping signature verification for development mock payment');
    }

    console.log('Gift card payment signature verified successfully');

    // Get the temporary order from session
    const tempOrder = req.session.tempGiftCardOrder;
    
    if (!tempOrder || tempOrder.orderId !== orderId) {
      return errorResponse(res, 'Invalid or expired order', 400);
    }

    if (tempOrder.expiresAt < new Date()) {
      return errorResponse(res, 'Order has expired', 400);
    }

    // Find the gift card template
    const giftCardTemplate = await GiftCard.findById(tempOrder.giftCardTemplateId);
    if (!giftCardTemplate) {
      return notFoundResponse(res, 'Gift card template');
    }

    // Import User model for recipient lookup
    const User = (await import('../models/User.js')).default;
    const recipientUser = await User.findOne({ email: tempOrder.recipientEmail });
    
    // Generate unique gift card code for the purchased card
    const code = await generateUniqueGiftCardCode();
    
    // Create the purchased gift card
    const purchasedGiftCard = new GiftCard({
      code,
      name: giftCardTemplate.name,
      amount: giftCardTemplate.amount,
      expiryDate: tempOrder.expiryDate ? new Date(tempOrder.expiryDate) : giftCardTemplate.expiryDate,
      usageType: giftCardTemplate.usageType,
      description: giftCardTemplate.description,
      termsAndConditions: giftCardTemplate.termsAndConditions,
      salonId: giftCardTemplate.salonId,
      createdBy: req.user.id, // The customer who purchased it
      purchasedBy: req.user.id, // The person who purchased the gift card
      recipientUser: recipientUser ? recipientUser._id : null, // Assign to recipient if user exists
      status: 'ACTIVE',
      balance: giftCardTemplate.amount, // Full balance initially
      redemptionCount: 0,
      recipientEmail: tempOrder.recipientEmail, // Store recipient email
      personalMessage: tempOrder.personalMessage, // Store personal message if provided
      isPurchasedByCustomer: true, // Mark as purchased by customer
      originalTemplateId: giftCardTemplate._id, // Reference to the original template
      paymentId: razorpay_payment_id, // Store payment ID for reference
      orderId: tempOrder.orderId, // Store order ID for reference
      transactionType: 'GIFT_CARD_PAYMENT' // Tag this as a gift card transaction
    });

    await purchasedGiftCard.save();

    // Get the sender's name for the email
    const sender = await User.findById(req.user.id);
    const senderName = sender ? sender.name || sender.email : 'Someone';

    // Get the salon name for the email
    const emailSalon = await Salon.findById(giftCardTemplate.salonId);
    const salonName = emailSalon ? emailSalon.salonName || emailSalon.name : 'our salon';

    // Import email service and send notification
    const { sendGiftCardNotificationEmail } = await import('../utils/email.js');
    const emailResult = await sendGiftCardNotificationEmail(
      tempOrder.recipientEmail,
      tempOrder.recipientEmail.split('@')[0], // Use email prefix as name
      {
        name: purchasedGiftCard.name,
        amount: purchasedGiftCard.amount,
        code: purchasedGiftCard.code,
        expiryDate: purchasedGiftCard.expiryDate,
        usageType: purchasedGiftCard.usageType,
        personalMessage: purchasedGiftCard.personalMessage,
        senderName: senderName,
        salonName: salonName,
        salonId: tempOrder.salonId
      }
    );

    if (!emailResult.success) {
      console.error('Failed to send gift card notification email:', emailResult.error);
    }

    // Create revenue record for the gift card purchase
    const revenueRecord = new Revenue({
      service: `Gift Card: ${giftCardTemplate.name}`,
      amount: giftCardTemplate.amount,
      appointmentId: null, // No appointment for gift card
      giftCardId: purchasedGiftCard._id, // Link to gift card
      salonId: giftCardTemplate.salonId,
      ownerId: null, // Need to find the salon owner
      customerId: req.user.id, // Purchaser
      date: new Date(),
      description: `Gift card purchase for ${tempOrder.recipientEmail} - ${giftCardTemplate.name}`,
      source: 'Gift Card Payment',
      transactionType: 'GIFT_CARD_PAYMENT' // Tag as gift card transaction
    });

    // Find the salon owner to set ownerId
    const salon = await Salon.findById(giftCardTemplate.salonId);
    if (salon && salon.ownerId) {
      revenueRecord.ownerId = salon.ownerId;
    }

    await revenueRecord.save();

    // Clear the temporary order from session
    req.session.tempGiftCardOrder = null;

    return successResponse(res, {
      giftCard: {
        id: purchasedGiftCard._id,
        code: purchasedGiftCard.code,
        name: purchasedGiftCard.name,
        amount: purchasedGiftCard.amount,
        recipientEmail: purchasedGiftCard.recipientEmail
      },
      paymentId: razorpay_payment_id,
      orderId: tempOrder.orderId
    }, 'Gift card purchased successfully');

  } catch (error) {
    console.error('Error verifying gift card payment:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(res, 'Failed to verify gift card payment', 500);
  }
});

// Helper function to generate unique gift card code
const generateUniqueGiftCardCode = async () => {
  let isUnique = false;
  let attempts = 0;
  let code = '';
  
  while (!isUnique && attempts < 10) {
    // Generate 8-character alphanumeric code in format: GC-XXXX
    const prefix = 'GC';
    const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
    code = `${prefix}-${randomChars}`;
    
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

// Handle gift card payment failure
export const handleGiftCardPaymentFailure = asyncHandler(async (req, res) => {
  try {
    const { orderId, error } = req.body;

    // Get the temporary order from session
    const tempOrder = req.session.tempGiftCardOrder;
    
    if (!tempOrder || tempOrder.orderId !== orderId) {
      return errorResponse(res, 'Invalid or expired order', 400);
    }

    // Clear the temporary order from session
    req.session.tempGiftCardOrder = null;

    return successResponse(res, {
      orderId: orderId
    }, 'Gift card payment failure recorded');
  } catch (error) {
    console.error('Error handling gift card payment failure:', error);
    return errorResponse(res, 'Failed to record gift card payment failure', 500);
  }
});

export default {
  createGiftCardPaymentOrder,
  verifyGiftCardPayment,
  handleGiftCardPaymentFailure
};
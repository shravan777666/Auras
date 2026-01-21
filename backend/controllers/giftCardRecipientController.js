import GiftCard from '../models/GiftCard.js';
import Salon from '../models/Salon.js';
import { 
  successResponse, 
  errorResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Get all gift card recipients for a salon
export const getGiftCardRecipients = asyncHandler(async (req, res) => {
  try {
    const salonId = req.user.id; // Assuming req.user.id is the salon owner's ID
    
    // Find the salon to ensure it exists and get the salon ID
    const salon = await Salon.findOne({ ownerId: salonId });
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    // Find all gift cards associated with this salon
    const giftCards = await GiftCard.find({
      salonId: salon._id
    })
    .populate('createdBy', 'name email') // Sender/user who purchased
    .populate('recipientUser', 'name email') // Recipient user if exists
    .sort({ createdAt: -1 }); // Sort by newest first

    // Format the response data
    const recipientsData = giftCards.map(gc => ({
      id: gc._id,
      code: gc.code,
      name: gc.name,
      amount: gc.amount,
      balance: gc.balance,
      sender: gc.createdBy ? {
        name: gc.createdBy.name,
        email: gc.createdBy.email
      } : null,
      receiver: gc.recipientUser ? {
        name: gc.recipientUser.name,
        email: gc.recipientUser.email
      } : {
        email: gc.recipientEmail // Use stored email if user doesn't exist yet
      },
      status: gc.status,
      occasionType: gc.occasionType,
      personalMessage: gc.personalMessage,
      createdAt: gc.createdAt,
      expiryDate: gc.expiryDate,
      isRedeemed: gc.balance === 0
    }));

    return successResponse(res, recipientsData, 'Gift card recipients retrieved successfully');
  } catch (error) {
    console.error('Error fetching gift card recipients:', error);
    return errorResponse(res, 'Failed to fetch gift card recipients', 500);
  }
});

// Get gift card recipients with filters
export const getFilteredGiftCardRecipients = asyncHandler(async (req, res) => {
  try {
    const salonId = req.user.id;
    const { status, startDate, endDate, occasionType } = req.query;

    // Find the salon
    const salon = await Salon.findOne({ ownerId: salonId });
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    // Build filter object
    const filter = { salonId: salon._id };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    if (occasionType) {
      filter.occasionType = occasionType;
    }

    // Find gift cards with filters
    const giftCards = await GiftCard.find(filter)
      .populate('createdBy', 'name email')
      .populate('recipientUser', 'name email')
      .sort({ createdAt: -1 });

    const recipientsData = giftCards.map(gc => ({
      id: gc._id,
      code: gc.code,
      name: gc.name,
      amount: gc.amount,
      balance: gc.balance,
      sender: gc.createdBy ? {
        name: gc.createdBy.name,
        email: gc.createdBy.email
      } : null,
      receiver: gc.recipientUser ? {
        name: gc.recipientUser.name,
        email: gc.recipientUser.email
      } : {
        email: gc.recipientEmail
      },
      status: gc.status,
      occasionType: gc.occasionType,
      personalMessage: gc.personalMessage,
      createdAt: gc.createdAt,
      expiryDate: gc.expiryDate,
      isRedeemed: gc.balance === 0
    }));

    return successResponse(res, recipientsData, 'Filtered gift card recipients retrieved successfully');
  } catch (error) {
    console.error('Error fetching filtered gift card recipients:', error);
    return errorResponse(res, 'Failed to fetch filtered gift card recipients', 500);
  }
});

// Get gift card recipients statistics
export const getGiftCardRecipientsStats = asyncHandler(async (req, res) => {
  try {
    const salonId = req.user.id;

    // Find the salon
    const salon = await Salon.findOne({ ownerId: salonId });
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    // Get stats
    const totalGiftCards = await GiftCard.countDocuments({ salonId: salon._id });
    const activeGiftCards = await GiftCard.countDocuments({ 
      salonId: salon._id, 
      status: 'ACTIVE',
      balance: { $gt: 0 }
    });
    const redeemedGiftCards = await GiftCard.countDocuments({ 
      salonId: salon._id, 
      balance: 0 
    });
    const expiredGiftCards = await GiftCard.countDocuments({ 
      salonId: salon._id, 
      status: 'EXPIRED' 
    });

    const totalAmount = await GiftCard.aggregate([
      { $match: { salonId: salon._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const remainingBalance = await GiftCard.aggregate([
      { $match: { salonId: salon._id } },
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);

    const stats = {
      totalGiftCards,
      activeGiftCards,
      redeemedGiftCards,
      expiredGiftCards,
      totalAmount: totalAmount[0]?.total || 0,
      remainingBalance: remainingBalance[0]?.total || 0
    };

    return successResponse(res, stats, 'Gift card recipients statistics retrieved successfully');
  } catch (error) {
    console.error('Error fetching gift card recipients stats:', error);
    return errorResponse(res, 'Failed to fetch gift card recipients statistics', 500);
  }
});

export default {
  getGiftCardRecipients,
  getFilteredGiftCardRecipients,
  getGiftCardRecipientsStats
};
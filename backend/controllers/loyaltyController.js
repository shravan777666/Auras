import Customer from '../models/Customer.js';
import Appointment from '../models/Appointment.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Redeem loyalty points for an appointment
export const redeemPoints = asyncHandler(async (req, res) => {
  try {
    const { customerId, pointsToRedeem, appointmentId } = req.body;
    
    // Validate input
    if (!customerId || !pointsToRedeem || !appointmentId) {
      return errorResponse(res, 'Missing required fields: customerId, pointsToRedeem, appointmentId', 400);
    }
    
    if (pointsToRedeem < 100) {
      return errorResponse(res, 'Minimum redemption is 100 points', 400);
    }
    
    if (pointsToRedeem % 100 !== 0) {
      return errorResponse(res, 'Points must be redeemed in multiples of 100', 400);
    }
    
    // Find customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return notFoundResponse(res, 'Customer');
    }
    
    // Check if customer has enough points
    if (customer.loyaltyPoints < pointsToRedeem) {
      return errorResponse(res, `Insufficient points. You have ${customer.loyaltyPoints} points available.`, 400);
    }
    
    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return notFoundResponse(res, 'Appointment');
    }
    
    // Check if appointment belongs to the customer
    if (appointment.customerId.toString() !== customerId) {
      return errorResponse(res, 'Appointment does not belong to this customer', 403);
    }
    
    // Calculate discount amount (100 points = ₹100 discount)
    const discountAmount = pointsToRedeem;
    
    // Update customer points
    customer.loyaltyPoints = customer.loyaltyPoints - pointsToRedeem;
    customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + pointsToRedeem;
    await customer.save();
    
    // Update appointment with redeemed points and discount
    appointment.pointsRedeemed = pointsToRedeem;
    appointment.discountFromPoints = discountAmount;
    appointment.finalAmount = Math.max(0, appointment.finalAmount - discountAmount);
    await appointment.save();
    
    return successResponse(res, {
      customer: {
        loyaltyPoints: customer.loyaltyPoints,
        totalPointsEarned: customer.totalPointsEarned,
        totalPointsRedeemed: customer.totalPointsRedeemed,
        loyaltyTier: customer.loyaltyTier
      },
      appointment: {
        pointsRedeemed: appointment.pointsRedeemed,
        discountFromPoints: appointment.discountFromPoints,
        finalAmount: appointment.finalAmount
      }
    }, 'Points redeemed successfully');
  } catch (error) {
    console.error('Error redeeming points:', error);
    return errorResponse(res, 'Failed to redeem points', 500);
  }
});

// Get customer loyalty details
export const getCustomerLoyaltyDetails = asyncHandler(async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return notFoundResponse(res, 'Customer');
    }
    
    return successResponse(res, {
      loyaltyPoints: customer.loyaltyPoints || 0,
      totalPointsEarned: customer.totalPointsEarned || 0,
      totalPointsRedeemed: customer.totalPointsRedeemed || 0,
      loyaltyTier: customer.loyaltyTier || 'Standard',
      pointsValue: customer.loyaltyPoints || 0 // 1 point = ₹1
    }, 'Customer loyalty details retrieved successfully');
  } catch (error) {
    console.error('Error fetching customer loyalty details:', error);
    return errorResponse(res, 'Failed to fetch customer loyalty details', 500);
  }
});

// Get loyalty dashboard metrics for salon owners
export const getLoyaltyDashboardMetrics = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Get salon ID from user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view loyalty metrics', 403);
    }
    
    const Salon = (await import('../models/Salon.js')).default;
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }
    
    const salonId = salon._id;
    
    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Get total points issued this month
    const appointmentsWithPoints = await Appointment.find({
      salonId: salonId,
      status: 'Completed',
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const totalPointsIssued = appointmentsWithPoints.reduce((total, appointment) => {
      return total + (appointment.pointsEarned || 0);
    }, 0);
    
    // Get total points redeemed this month
    const appointmentsWithRedeemedPoints = await Appointment.find({
      salonId: salonId,
      pointsRedeemed: { $gt: 0 },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const totalPointsRedeemed = appointmentsWithRedeemedPoints.reduce((total, appointment) => {
      return total + (appointment.pointsRedeemed || 0);
    }, 0);
    
    // Calculate redemption ratio
    const redemptionRatio = totalPointsIssued > 0 
      ? Math.round((totalPointsRedeemed / totalPointsIssued) * 100) 
      : 0;
    
    return successResponse(res, {
      totalPointsIssued: totalPointsIssued,
      totalPointsRedeemed: totalPointsRedeemed,
      redemptionRatio: redemptionRatio,
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthName: now.toLocaleString('default', { month: 'long' })
      }
    }, 'Loyalty dashboard metrics retrieved successfully');
  } catch (error) {
    console.error('Error fetching loyalty dashboard metrics:', error);
    return errorResponse(res, 'Failed to fetch loyalty dashboard metrics', 500);
  }
});

// Get top loyalty customers
export const getTopLoyaltyCustomers = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 5 } = req.query;
    
    // Get salon ID from user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view top customers', 403);
    }
    
    const Salon = (await import('../models/Salon.js')).default;
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }
    
    const salonId = salon._id;
    
    // Get customers who have appointments at this salon, sorted by loyalty points
    const customers = await Customer.find({
      _id: {
        $in: await Appointment.distinct('customerId', { salonId: salonId })
      }
    })
    .sort({ loyaltyPoints: -1 })
    .limit(parseInt(limit))
    .select('name email loyaltyPoints loyaltyTier totalPointsEarned totalPointsRedeemed');
    
    return successResponse(res, customers, 'Top loyalty customers retrieved successfully');
  } catch (error) {
    console.error('Error fetching top loyalty customers:', error);
    return errorResponse(res, 'Failed to fetch top loyalty customers', 500);
  }
});

export default {
  redeemPoints,
  getCustomerLoyaltyDetails,
  getLoyaltyDashboardMetrics,
  getTopLoyaltyCustomers
};
import { successResponse, errorResponse, notFoundResponse } from '../utils/responses.js';
import Revenue from '../models/Revenue.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

// Get comprehensive revenue data for financial dashboard with trend analysis
export const getRevenueData = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view revenue data', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const salonId = salon._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Previous month dates for comparison
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = startOfMonth;

    // Get total revenue (all time)
    const totalRevenueResult = await Revenue.aggregate([
      { $match: { salonId: salonId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get this month's revenue
    const monthlyRevenueResult = await Revenue.aggregate([
      { 
        $match: { 
          salonId: salonId, 
          date: { $gte: startOfMonth, $lt: endOfMonth } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get previous month's revenue for comparison
    const previousMonthlyRevenueResult = await Revenue.aggregate([
      { 
        $match: { 
          salonId: salonId, 
          date: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // If no Revenue records exist, calculate from completed appointments
    let totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    let monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;
    let previousMonthlyRevenue = previousMonthlyRevenueResult.length > 0 ? previousMonthlyRevenueResult[0].total : 0;

    // Fallback to appointments if no revenue records
    if (totalRevenue === 0) {
      const appointmentTotalResult = await Appointment.aggregate([
        { 
          $match: { 
            salonId: salonId, 
            status: 'Completed' 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      totalRevenue = appointmentTotalResult.length > 0 ? appointmentTotalResult[0].total : 0;
    }

    if (monthlyRevenue === 0) {
      const appointmentMonthlyResult = await Appointment.aggregate([
        { 
          $match: { 
            salonId: salonId, 
            status: 'Completed',
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      monthlyRevenue = appointmentMonthlyResult.length > 0 ? appointmentMonthlyResult[0].total : 0;
    }

    if (previousMonthlyRevenue === 0) {
      const appointmentPreviousMonthlyResult = await Appointment.aggregate([
        { 
          $match: { 
            salonId: salonId, 
            status: 'Completed',
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      previousMonthlyRevenue = appointmentPreviousMonthlyResult.length > 0 ? appointmentPreviousMonthlyResult[0].total : 0;
    }

    // Calculate percentage change for monthly revenue
    let monthlyRevenueChange = 0;
    let monthlyRevenueChangeStatus = "N/A";
    if (previousMonthlyRevenue > 0) {
      monthlyRevenueChange = ((monthlyRevenue - previousMonthlyRevenue) / previousMonthlyRevenue) * 100;
      monthlyRevenueChangeStatus = monthlyRevenueChange >= 0 ? "positive" : "negative";
    } else if (previousMonthlyRevenue === 0 && monthlyRevenue > 0) {
      monthlyRevenueChange = "N/A"; // No previous data to compare
      monthlyRevenueChangeStatus = "positive";
    }

    // Get 12-month historical trend data for total revenue
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const revenueTrendData = await Revenue.aggregate([
      { 
        $match: { 
          salonId: salonId, 
          date: { $gte: twelveMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format trend data for sparkline
    const revenueTrend = revenueTrendData.map(item => item.total);

    return successResponse(res, {
      totalRevenue,
      monthlyRevenue,
      previousMonthlyRevenue,
      monthlyRevenueChange,
      monthlyRevenueChangeStatus,
      revenueTrend,
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthName: now.toLocaleString('default', { month: 'long' })
      }
    }, 'Revenue data retrieved successfully');

  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return errorResponse(res, 'Failed to retrieve revenue data', 500);
  }
};

// Get detailed revenue records for the table
export const getRevenueRecords = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, startDate, endDate, search } = req.query;
    
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view revenue records', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const salonId = salon._id;
    let matchQuery = { salonId: salonId };

    // Add date filter if provided
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // First try to get from Revenue collection
    let revenueRecords = await Revenue.find(matchQuery)
      .populate('customerId', 'name email phone')
      .populate('appointmentId', 'appointmentDate appointmentTime services')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // If no Revenue records, get from completed appointments
    if (revenueRecords.length === 0) {
      const appointmentMatchQuery = {
        salonId: salonId,
        status: 'Completed'
      };

      if (startDate && endDate) {
        appointmentMatchQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const appointments = await Appointment.find(appointmentMatchQuery)
        .populate('customerId', 'name email phone')
        .populate('services.serviceId', 'name category')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Transform appointments to revenue record format
      revenueRecords = appointments.map(appointment => ({
        _id: appointment._id,
        date: appointment.createdAt,
        customer: appointment.customerId,
        service: appointment.services.map(s => s.serviceId?.name || s.serviceName).join(', '),
        amount: appointment.totalAmount || appointment.finalAmount || 0,
        appointmentId: appointment._id,
        source: 'appointment'
      }));
    } else {
      // Format revenue records
      revenueRecords = revenueRecords.map(record => ({
        _id: record._id,
        date: record.date,
        customer: record.customerId,
        service: record.service,
        amount: record.amount,
        appointmentId: record.appointmentId,
        source: 'revenue'
      }));
    }

    // Apply search filter if provided
    if (search) {
      revenueRecords = revenueRecords.filter(record => 
        record.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        record.service?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get total count for pagination
    const totalRecords = await Revenue.countDocuments(matchQuery) || 
                        await Appointment.countDocuments({
                          salonId: salonId,
                          status: 'Completed',
                          ...(startDate && endDate && {
                            createdAt: {
                              $gte: new Date(startDate),
                              $lte: new Date(endDate)
                            }
                          })
                        });

    return successResponse(res, {
      records: revenueRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / parseInt(limit))
      }
    }, 'Revenue records retrieved successfully');

  } catch (error) {
    console.error('Error fetching revenue records:', error);
    return errorResponse(res, 'Failed to retrieve revenue records', 500);
  }
};

// Get revenue analytics for charts and insights
export const getRevenueAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view revenue analytics', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const salonId = salon._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get revenue by service for current month
    const revenueByService = await Revenue.aggregate([
      { 
        $match: { 
          salonId: salonId, 
          date: { $gte: startOfMonth, $lt: endOfMonth } 
        } 
      },
      { 
        $group: { 
          _id: '$service', 
          total: { $sum: '$amount' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { total: -1 } }
    ]);

    // Get daily revenue for current month
    const dailyRevenue = await Revenue.aggregate([
      { 
        $match: { 
          salonId: salonId, 
          date: { $gte: startOfMonth, $lt: endOfMonth } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return successResponse(res, {
      revenueByService,
      dailyRevenue,
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthName: now.toLocaleString('default', { month: 'long' })
      }
    }, 'Revenue analytics retrieved successfully');

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return errorResponse(res, 'Failed to retrieve revenue analytics', 500);
  }
};

export default {
  getRevenueData,
  getRevenueRecords,
  getRevenueAnalytics
};
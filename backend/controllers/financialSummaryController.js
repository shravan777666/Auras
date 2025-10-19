import { successResponse, errorResponse } from '../utils/responses.js';
import Salon from '../models/Salon.js';
import Appointment from '../models/Appointment.js';
import Expense from '../models/Expense.js';
import Revenue from '../models/Revenue.js';

/**
 * Get comprehensive financial summary for admin dashboard
 */
export const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date range
    let start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    
    let end = endDate ? new Date(endDate) : new Date();
    
    // Ensure end date is not before start date
    if (end < start) {
      return errorResponse(res, 'End date cannot be before start date', 400);
    }
    
    // Get all approved salons
    const salons = await Salon.find({ approvalStatus: 'approved' });
    const salonIds = salons.map(salon => salon._id);
    
    // Calculate total revenue
    const revenueResult = await Revenue.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Calculate total expenses
    const expenseResult = await Expense.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
    
    // Calculate profit/loss
    const totalProfit = totalRevenue - totalExpenses;
    
    // Calculate profit margin
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Calculate average revenue per salon
    const avgRevenuePerSalon = salons.length > 0 ? totalRevenue / salons.length : 0;
    
    // For comparison, get data from previous period
    const prevStart = new Date(start);
    const prevEnd = new Date(end);
    const periodDiff = end - start;
    prevStart.setTime(prevStart.getTime() - periodDiff);
    prevEnd.setTime(prevEnd.getTime() - periodDiff);
    
    // Previous period revenue
    const prevRevenueResult = await Revenue.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: prevStart, $lte: prevEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const prevTotalRevenue = prevRevenueResult.length > 0 ? prevRevenueResult[0].total : 0;
    
    // Previous period expenses
    const prevExpenseResult = await Expense.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: prevStart, $lte: prevEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const prevTotalExpenses = prevExpenseResult.length > 0 ? prevExpenseResult[0].total : 0;
    
    // Calculate changes
    const revenueChange = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
      : (totalRevenue > 0 ? 100 : 0);
      
    const profitChange = (prevTotalRevenue - prevTotalExpenses) > 0 
      ? ((totalProfit - (prevTotalRevenue - prevTotalExpenses)) / (prevTotalRevenue - prevTotalExpenses)) * 100 
      : (totalProfit > 0 ? 100 : 0);
      
    const marginChange = prevTotalRevenue > 0 
      ? (((totalProfit / totalRevenue) - ((prevTotalRevenue - prevTotalExpenses) / prevTotalRevenue)) * 100)
      : (profitMargin > 0 ? profitMargin : 0);

    return successResponse(res, {
      totalRevenue,
      totalExpenses,
      totalProfit,
      profitMargin,
      avgRevenuePerSalon,
      revenueChange,
      profitChange,
      marginChange
    }, 'Financial summary retrieved successfully');
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return errorResponse(res, 'Failed to retrieve financial summary', 500);
  }
};

/**
 * Get salon performance data
 */
export const getSalonPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date range
    let start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    
    let end = endDate ? new Date(endDate) : new Date();
    
    // Ensure end date is not before start date
    if (end < start) {
      return errorResponse(res, 'End date cannot be before start date', 400);
    }
    
    // Get all approved salons with contact information
    const salons = await Salon.find({ approvalStatus: 'approved' }).select('salonName email contactNumber');
    
    // Get revenue data for each salon
    const salonPerformance = await Promise.all(salons.map(async (salon) => {
      // Get revenue for this salon
      const revenueResult = await Revenue.aggregate([
        {
          $match: {
            salonId: salon._id,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
      
      // Get expenses for this salon (simplified - in a real system, this would be more complex)
      const expenseResult = await Expense.aggregate([
        {
          $match: {
            salonId: salon._id,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const expenses = expenseResult.length > 0 ? expenseResult[0].total : 0;
      
      // Calculate profit and margin
      const profit = revenue - expenses;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // For simplicity, we'll use fixed values for service costs and operating costs
      // In a real implementation, these would be calculated from actual data
      const serviceCosts = revenue * 0.4; // 40% of revenue as service costs
      const operatingCosts = revenue * 0.2; // 20% of revenue as operating costs
      
      return {
        id: salon._id,
        name: salon.salonName,
        contactEmail: salon.email,
        contactPhone: salon.contactNumber,
        revenue,
        serviceCosts,
        operatingCosts,
        profit,
        margin: parseFloat(margin.toFixed(1))
      };
    }));
    
    // Sort by revenue descending
    salonPerformance.sort((a, b) => b.revenue - a.revenue);
    
    return successResponse(res, salonPerformance, 'Salon performance data retrieved successfully');
  } catch (error) {
    console.error('Error fetching salon performance:', error);
    return errorResponse(res, 'Failed to retrieve salon performance data', 500);
  }
};

/**
 * Get revenue trend data
 */
export const getRevenueTrend = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    
    // Validate date range
    let start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 180); // Default to last 6 months
    
    let end = endDate ? new Date(endDate) : new Date();
    
    // Ensure end date is not before start date
    if (end < start) {
      return errorResponse(res, 'End date cannot be before start date', 400);
    }
    
    // Get all approved salons
    const salons = await Salon.find({ approvalStatus: 'approved' });
    const salonIds = salons.map(salon => salon._id);
    
    let groupBy, dateFormat;
    
    switch (period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = { 
          $dateToString: { 
            format: '%Y-%U', 
            date: '$date' 
          } 
        };
        dateFormat = '%Y-%U';
        break;
      case 'monthly':
      default:
        groupBy = { $dateToString: { format: '%Y-%m', date: '$date' } };
        dateFormat = '%Y-%m';
        break;
    }
    
    // Get revenue trend data
    const revenueTrend = await Revenue.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);
    
    // Get expense trend data
    const expenseTrend = await Expense.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy,
          expenses: { $sum: '$amount' }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);
    
    // Combine revenue and expense data
    const trendData = revenueTrend.map(revenueItem => {
      const expenseItem = expenseTrend.find(e => e._id === revenueItem._id);
      return {
        period: revenueItem._id,
        revenue: revenueItem.revenue,
        costs: expenseItem ? expenseItem.expenses : 0,
        profit: revenueItem.revenue - (expenseItem ? expenseItem.expenses : 0)
      };
    });
    
    return successResponse(res, trendData, 'Revenue trend data retrieved successfully');
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    return errorResponse(res, 'Failed to retrieve revenue trend data', 500);
  }
};

/**
 * Get expense breakdown data
 */
export const getExpenseBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date range
    let start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    
    let end = endDate ? new Date(endDate) : new Date();
    
    // Ensure end date is not before start date
    if (end < start) {
      return errorResponse(res, 'End date cannot be before start date', 400);
    }
    
    // Get all approved salons
    const salons = await Salon.find({ approvalStatus: 'approved' });
    const salonIds = salons.map(salon => salon._id);
    
    // Get expense data grouped by category
    const expenseData = await Expense.aggregate([
      {
        $match: {
          salonId: { $in: salonIds },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: {
          amount: -1
        }
      }
    ]);
    
    // Format the data for the frontend
    const formattedData = expenseData.map(item => ({
      category: item._id,
      amount: item.amount
    }));
    
    return successResponse(res, formattedData, 'Expense breakdown data retrieved successfully');
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    return errorResponse(res, 'Failed to retrieve expense breakdown data', 500);
  }
};

export default {
  getFinancialSummary,
  getSalonPerformance,
  getRevenueTrend,
  getExpenseBreakdown
};
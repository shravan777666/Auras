import AddonSales from '../models/AddonSales.js';
import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import { 
  successResponse, 
  errorResponse,
  asyncHandler 
} from '../utils/responses.js';

// Get salon dashboard data
export const getSalonDashboard = asyncHandler(async (req, res) => {
  try {
    let salonId;
    
    // For salon owners, get their own data
    if (req.user.type === 'salon') {
      // Find salon by user email
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user.id);
      if (!user || user.type !== 'salon') {
        return errorResponse(res, 'Access denied', 403);
      }
      
      const salon = await Salon.findOne({ email: user.email });
      if (!salon) {
        return errorResponse(res, 'Salon profile not found', 404);
      }
      
      salonId = salon._id;
    } else if (req.user.type === 'admin' && req.query.salonId) {
      // Admin can specify a salon
      salonId = req.query.salonId;
    } else {
      return errorResponse(res, 'Salon ID required', 400);
    }
    
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get add-on sales for this salon
    const addonSales = await AddonSales.find({
      salonId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // Calculate metrics
    const totalAddonSales = addonSales.length;
    const totalRevenue = addonSales.reduce((sum, sale) => sum + sale.discountedPrice, 0);
    const totalAdminCommission = addonSales.reduce((sum, sale) => sum + sale.adminCommissionAmount, 0);
    const totalSalonEarnings = addonSales.reduce((sum, sale) => sum + sale.salonEarning, 0);
    
    // Group by service
    const serviceStats = {};
    addonSales.forEach(sale => {
      if (!serviceStats[sale.serviceName]) {
        serviceStats[sale.serviceName] = {
          name: sale.serviceName,
          count: 0,
          revenue: 0,
          commission: 0,
          earnings: 0
        };
      }
      serviceStats[sale.serviceName].count++;
      serviceStats[sale.serviceName].revenue += sale.discountedPrice;
      serviceStats[sale.serviceName].commission += sale.adminCommissionAmount;
      serviceStats[sale.serviceName].earnings += sale.salonEarning;
    });
    
    // Top services
    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const dashboardData = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalAddonSales,
        totalRevenue,
        totalAdminCommission,
        totalSalonEarnings
      },
      topServices,
      recentSales: addonSales
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };
    
    return successResponse(res, dashboardData, 'Salon dashboard data retrieved successfully');
  } catch (error) {
    console.error('Error getting salon dashboard:', error);
    return errorResponse(res, 'Failed to retrieve salon dashboard data', 500);
  }
});

// Get admin dashboard data
export const getAdminDashboard = asyncHandler(async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }
    
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get all add-on sales
    const addonSales = await AddonSales.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('salonId', 'salonName');
    
    // Calculate metrics
    const totalAddonSales = addonSales.length;
    const totalRevenue = addonSales.reduce((sum, sale) => sum + sale.discountedPrice, 0);
    const totalAdminCommission = addonSales.reduce((sum, sale) => sum + sale.adminCommissionAmount, 0);
    const totalSalonEarnings = addonSales.reduce((sum, sale) => sum + sale.salonEarning, 0);
    
    // Group by salon
    const salonStats = {};
    addonSales.forEach(sale => {
      // Skip sales with missing salon data
      if (!sale.salonId) return;
      
      const salonId = sale.salonId._id.toString();
      if (!salonStats[salonId]) {
        salonStats[salonId] = {
          salonId: salonId,
          salonName: sale.salonId.salonName,
          count: 0,
          revenue: 0,
          commission: 0
        };
      }
      salonStats[salonId].count++;
      salonStats[salonId].revenue += sale.discountedPrice;
      salonStats[salonId].commission += sale.adminCommissionAmount;
    });
    
    // Top salons
    const topSalons = Object.values(salonStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Group by service
    const serviceStats = {};
    addonSales.forEach(sale => {
      if (!serviceStats[sale.serviceName]) {
        serviceStats[sale.serviceName] = {
          name: sale.serviceName,
          count: 0,
          revenue: 0,
          commission: 0
        };
      }
      serviceStats[sale.serviceName].count++;
      serviceStats[sale.serviceName].revenue += sale.discountedPrice;
      serviceStats[sale.serviceName].commission += sale.adminCommissionAmount;
    });
    
    // Top services
    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const dashboardData = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalAddonSales,
        totalRevenue,
        totalAdminCommission,
        totalSalonEarnings
      },
      topSalons,
      topServices,
      recentSales: addonSales
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };
    
    return successResponse(res, dashboardData, 'Admin dashboard data retrieved successfully');
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    return errorResponse(res, 'Failed to retrieve admin dashboard data', 500);
  }
});

// Get staff performance data
export const getStaffPerformance = asyncHandler(async (req, res) => {
  try {
    let salonId;
    
    // For salon owners, get their own data
    if (req.user.type === 'salon') {
      // Find salon by user email
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user.id);
      if (!user || user.type !== 'salon') {
        return errorResponse(res, 'Access denied', 403);
      }
      
      const salon = await Salon.findOne({ email: user.email });
      if (!salon) {
        return errorResponse(res, 'Salon profile not found', 404);
      }
      
      salonId = salon._id;
    } else if (req.user.type === 'admin' && req.query.salonId) {
      // Admin can specify a salon
      salonId = req.query.salonId;
    } else {
      return errorResponse(res, 'Salon ID required', 400);
    }
    
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get add-on sales for this salon
    const addonSales = await AddonSales.find({
      salonId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('staffId', 'name');
    
    // Group by staff
    const staffStats = {};
    addonSales.forEach(sale => {
      // Skip sales with missing staff data
      if (!sale.staffId) {
        // Use a placeholder for missing staff data
        const placeholderStaffId = 'unknown_staff';
        if (!staffStats[placeholderStaffId]) {
          staffStats[placeholderStaffId] = {
            staffId: placeholderStaffId,
            staffName: 'Unknown Staff',
            count: 0,
            revenue: 0,
            commission: 0,
            earnings: 0
          };
        }
        staffStats[placeholderStaffId].count++;
        staffStats[placeholderStaffId].revenue += sale.discountedPrice;
        staffStats[placeholderStaffId].commission += sale.adminCommissionAmount;
        staffStats[placeholderStaffId].earnings += sale.salonEarning;
      } else {
        const staffId = sale.staffId._id.toString();
        if (!staffStats[staffId]) {
          staffStats[staffId] = {
            staffId: staffId,
            staffName: sale.staffId.name,
            count: 0,
            revenue: 0,
            commission: 0,
            earnings: 0
          };
        }
        staffStats[staffId].count++;
        staffStats[staffId].revenue += sale.discountedPrice;
        staffStats[staffId].commission += sale.adminCommissionAmount;
        staffStats[staffId].earnings += sale.salonEarning;
      }
    });
    
    // Convert to array and sort by count
    const staffPerformance = Object.values(staffStats)
      .sort((a, b) => b.count - a.count);
    
    return successResponse(res, staffPerformance, 'Staff performance data retrieved successfully');
  } catch (error) {
    console.error('Error getting staff performance:', error);
    return errorResponse(res, 'Failed to retrieve staff performance data', 500);
  }
});

export default {
  getSalonDashboard,
  getAdminDashboard,
  getStaffPerformance
};
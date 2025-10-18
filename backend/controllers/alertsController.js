import { successResponse, errorResponse } from '../utils/responses.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

// Get needs attention alerts for salon owner dashboard
export const getNeedsAttentionAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user record to find salon
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view alerts', 403);
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return errorResponse(res, 'Salon profile not found', 404);
    }

    const salonId = salon._id;
    
    // Initialize alerts array
    const alerts = [];
    
    // 1. PENDING APPOINTMENT APPROVALS (URGENT - Red)
    const pendingAppointments = await Appointment.countDocuments({
      salonId: salonId,
      status: 'Pending'
    });
    
    if (pendingAppointments > 0) {
      alerts.push({
        id: 'pending-appointments',
        type: 'urgent',
        title: 'Pending Appointment Approvals',
        message: `${pendingAppointments} client${pendingAppointments > 1 ? 's' : ''} waiting for appointment approval`,
        icon: 'calendar',
        action: {
          text: 'Review Bookings',
          link: '/salon/appointments'
        }
      });
    }
    
    // 2. UNRESOLVED FEEDBACK (IMPORTANT - Yellow)
    // Count appointments with low ratings (1-2 stars) and no feedback resolved
    const unresolvedFeedback = await Appointment.countDocuments({
      salonId: salonId,
      'rating.overall': { $in: [1, 2] },
      feedback: { $exists: true, $ne: '' }
    });
    
    if (unresolvedFeedback > 0) {
      alerts.push({
        id: 'unresolved-feedback',
        type: 'important',
        title: 'Unresolved Feedback',
        message: `${unresolvedFeedback} client${unresolvedFeedback > 1 ? 's' : ''} left unresolved feedback`,
        icon: 'feedback',
        action: {
          text: 'Review Feedback',
          link: '/salon/reviews'
        }
      });
    }
    
    // 3. STAFF ROSTER GAPS (IMPORTANT - Yellow)
    // This would typically check staff leave requests vs schedule
    // For now, we'll check for staff with no assigned shifts
    const staffWithoutSchedule = await Staff.countDocuments({
      assignedSalon: salonId,
      availability: { $exists: false }
    });
    
    if (staffWithoutSchedule > 0) {
      alerts.push({
        id: 'staff-gaps',
        type: 'important',
        title: 'Staff Roster Gaps',
        message: `${staffWithoutSchedule} staff member${staffWithoutSchedule > 1 ? 's' : ''} without schedule`,
        icon: 'staff',
        action: {
          text: 'Manage Schedule',
          link: '/salon/staff-availability'
        }
      });
    }
    
    // 4. LOW STOCK ALERTS (URGENT - Red)
    // Since there's no inventory model, we'll simulate this with services
    // that have low total bookings (as a proxy for needing reorder)
    const lowStockServices = await Service.find({
      salonId: salonId,
      totalBookings: { $lt: 5 },
      isActive: true  // Only count active services to match the services page filter
    });
    
    if (lowStockServices.length > 0) {
      alerts.push({
        id: 'low-stock',
        type: 'urgent',
        title: 'Low Bookings Alert',
        message: `${lowStockServices.length} service${lowStockServices.length > 1 ? 's' : ''} with low bookings`,
        icon: 'inventory',
        action: {
          text: 'Review Services',
          link: '/salon/services?filter=low_bookings'
        }
      });
    }
    
    return successResponse(res, {
      alerts,
      count: alerts.length
    }, 'Alerts retrieved successfully');
  } catch (error) {
    console.error('Error fetching needs attention alerts:', error);
    return errorResponse(res, 'Failed to retrieve alerts: ' + error.message, 500);
  }
};

export default {
  getNeedsAttentionAlerts
};
import ScheduleRequest from '../models/ScheduleRequest.js';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import StaffNotification from '../models/StaffNotification.js';
import Appointment from '../models/Appointment.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Helper function to calculate duration in minutes
const calculateDurationInMinutes = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Handle case where end time is next day (e.g., 23:00 to 01:00)
  if (endTotalMinutes < startTotalMinutes) {
    return (24 * 60 - startTotalMinutes) + endTotalMinutes;
  }
  
  return endTotalMinutes - startTotalMinutes;
};

// Create a block time request (immediate)
export const createBlockTimeRequest = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, reason } = req.body;
  const staffId = req.user.id;

  // Validate required fields
  if (!date || !startTime || !endTime || !reason) {
    return errorResponse(res, 'Date, start time, end time, and reason are required', 400);
  }

  try {
    // Get staff member to retrieve salonId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return errorResponse(res, 'Staff member not found', 404);
    }

    // Ensure staff has an assigned salon
    if (!staff.assignedSalon) {
      return errorResponse(res, 'Staff member is not assigned to a salon', 400);
    }

    // Create the schedule request with salonId
    const scheduleRequest = await ScheduleRequest.create({
      staffId,
      salonId: staff.assignedSalon, // Add salonId for direct filtering
      type: 'block-time',
      blockTime: {
        date,
        startTime,
        endTime,
        reason
      },
      status: 'approved' // Immediate approval for block time
    });

    // Create a STAFF_BLOCKED appointment to prevent double-booking
    if (staff && staff.assignedSalon) {
      // Create a blocked time appointment
      const blockedAppointment = await Appointment.create({
        salonId: staff.assignedSalon,
        staffId: staff._id,
        customerId: null, // No customer for blocked time
        services: [{
          serviceId: null,
          serviceName: `Blocked Time - ${reason}`,
          price: 0,
          duration: calculateDurationInMinutes(startTime, endTime)
        }],
        appointmentDate: `${date}T${startTime}`,
        appointmentTime: startTime,
        estimatedDuration: calculateDurationInMinutes(startTime, endTime),
        estimatedEndTime: endTime,
        totalAmount: 0,
        finalAmount: 0,
        status: 'STAFF_BLOCKED',
        customerNotes: `Staff blocked time for ${reason}`,
        specialRequests: reason
      });

      console.log('Created STAFF_BLOCKED appointment:', blockedAppointment._id);
    }

    // Send notification to salon owner
    if (staff && staff.assignedSalon) {
      const salon = await Salon.findById(staff.assignedSalon);
      if (salon) {
        await StaffNotification.create({
          staffId: salon.ownerId, // Salon owner as recipient
          staffName: salon.ownerName || 'Salon Owner',
          staffEmail: salon.email,
          senderId: staff._id,
          senderType: 'Staff',
          senderName: staff.name,
          senderEmail: staff.email,
          senderSalonName: salon.salonName,
          type: 'broadcast',
          subject: 'Break/Lunch Time Blocked',
          message: `${staff.name} has blocked ${startTime}-${endTime} for ${reason.toLowerCase()} on ${date}`,
          targetSkill: 'All Staff',
          category: 'schedule',
          priority: 'medium'
        });
      }
    }

    return successResponse(res, scheduleRequest, 'Time blocked successfully');
  } catch (error) {
    console.error('Error creating block time request:', error);
    return errorResponse(res, 'Failed to block time', 500);
  }
});

// Create a leave request
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason, notes } = req.body;
  const staffId = req.user.id;

  // Validate required fields
  if (!startDate || !endDate || !reason) {
    return errorResponse(res, 'Start date, end date, and reason are required', 400);
  }

  try {
    // Get staff member to retrieve salonId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return errorResponse(res, 'Staff member not found', 404);
    }

    // Ensure staff has an assigned salon
    if (!staff.assignedSalon) {
      return errorResponse(res, 'Staff member is not assigned to a salon', 400);
    }

    // Create the schedule request with salonId
    const scheduleRequest = await ScheduleRequest.create({
      staffId,
      salonId: staff.assignedSalon, // Add salonId for direct filtering
      type: 'leave',
      leave: {
        startDate,
        endDate,
        reason,
        notes
      },
      status: 'pending'
    });

    // Send notification to salon owner
    if (staff && staff.assignedSalon) {
      const salon = await Salon.findById(staff.assignedSalon);
      if (salon) {
        await StaffNotification.create({
          staffId: salon.ownerId, // Salon owner as recipient
          staffName: salon.ownerName || 'Salon Owner',
          staffEmail: salon.email,
          senderId: staff._id,
          senderType: 'Staff',
          senderName: staff.name,
          senderEmail: staff.email,
          senderSalonName: salon.salonName,
          type: 'broadcast',
          subject: 'New Leave Request',
          message: `${staff.name} has requested time off from ${startDate} to ${endDate} for ${reason}`,
          targetSkill: 'All Staff',
          category: 'schedule',
          priority: 'medium'
        });
      }
    }

    return successResponse(res, scheduleRequest, 'Leave request submitted successfully');
  } catch (error) {
    console.error('Error creating leave request:', error);
    return errorResponse(res, 'Failed to submit leave request', 500);
  }
});

// Create a shift swap request
export const createShiftSwapRequest = asyncHandler(async (req, res) => {
  const { requesterShiftId, targetStaffId, targetShiftId, requesterNotes } = req.body;
  const staffId = req.user.id;

  // Validate required fields
  if (!requesterShiftId || !targetStaffId || !targetShiftId) {
    return errorResponse(res, 'Requester shift, target staff, and target shift are required', 400);
  }

  try {
    // Get staff member to retrieve salonId
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return errorResponse(res, 'Staff member not found', 404);
    }

    // Ensure staff has an assigned salon
    if (!staff.assignedSalon) {
      return errorResponse(res, 'Staff member is not assigned to a salon', 400);
    }

    // Create the schedule request with salonId
    const scheduleRequest = await ScheduleRequest.create({
      staffId,
      salonId: staff.assignedSalon, // Add salonId for direct filtering
      type: 'shift-swap',
      shiftSwap: {
        requesterShiftId,
        targetStaffId,
        targetShiftId,
        requesterNotes
      },
      status: 'pending'
    });

    // Send notification to target staff member
    const requester = await Staff.findById(staffId);
    const targetStaff = await Staff.findById(targetStaffId);
    
    if (targetStaff && targetStaff.user) {
      // Get salon information for the notification
      let salonName = 'Your Salon';
      if (requester && requester.assignedSalon) {
        const salon = await Salon.findById(requester.assignedSalon);
        if (salon) {
          salonName = salon.salonName;
        }
      }
      
      await StaffNotification.create({
        staffId: targetStaff._id,
        staffName: targetStaff.name,
        staffEmail: targetStaff.email,
        senderId: staffId,
        senderType: 'Staff',
        senderName: requester.name,
        senderEmail: requester.email,
        senderSalonName: salonName,
        type: 'broadcast',
        subject: 'Shift Swap Request',
        message: `${requester.name} wants to swap shifts with you. Please review the request.`,
        targetSkill: 'All Staff',
        category: 'schedule',
        priority: 'medium'
      });
    }

    return successResponse(res, scheduleRequest, 'Shift swap request submitted successfully');
  } catch (error) {
    console.error('Error creating shift swap request:', error);
    return errorResponse(res, 'Failed to submit shift swap request', 500);
  }
});

// Get my requests (for staff)
export const getMyRequests = asyncHandler(async (req, res) => {
  const staffId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [requests, totalRequests] = await Promise.all([
      ScheduleRequest.find({ staffId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ScheduleRequest.countDocuments({ staffId })
    ]);

    return paginatedResponse(res, requests, {
      page,
      limit,
      totalPages: Math.ceil(totalRequests / limit),
      totalItems: totalRequests
    });
  } catch (error) {
    console.error('Error fetching schedule requests:', error);
    return errorResponse(res, 'Failed to fetch schedule requests', 500);
  }
});

// Get pending requests for salon owner
export const getPendingRequestsForOwner = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Ensure req.user is available and has an ID
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Authentication required: User ID not found in token.', 401);
    }

    // Find the salon owned by this user
    const salon = await Salon.findOne({ ownerId: salonOwnerId });
    if (!salon) {
      return errorResponse(res, 'Salon profile not found for this owner.', 404);
    }

    // Find all staff members for this salon
    const staffMembers = await Staff.find({ assignedSalon: salon._id }).select('_id');
    const staffIds = staffMembers.map(staff => staff._id);

    // If there are no staff members, there can be no requests
    if (staffIds.length === 0) {
      return paginatedResponse(res, [], { page, limit, totalPages: 0, totalItems: 0 });
    }

    // Find all pending schedule requests for these staff members
    // Updated query to handle both cases: requests with salonId and without
    const query = {
      status: 'pending',
      $or: [
        { staffId: { $in: staffIds } },
        { salonId: salon._id }
      ]
    };

    const requestsQuery = ScheduleRequest.find(query)
      .populate({
        path: 'staffId',
        select: 'name position profilePicture'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const countQuery = ScheduleRequest.countDocuments(query);

    const [requests, totalRequests] = await Promise.all([
      requestsQuery,
      countQuery
    ]);

    // Helper function to convert file path to full URL
    const getFileUrl = (filePath) => {
      if (!filePath) return null;
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5002}`;
      return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
    };

    // Format the response to match frontend expectations
    const formattedRequests = requests.map(request => ({
      _id: request._id,
      type: request.type,
      status: request.status,
      createdAt: request.createdAt,
      staffId: request.staffId ? {
        _id: request.staffId._id,
        name: request.staffId.name,
        position: request.staffId.position,
        profilePicture: request.staffId.profilePicture ? getFileUrl(request.staffId.profilePicture) : null
      } : null,
      blockTime: request.blockTime,
      leave: request.leave,
      shiftSwap: request.shiftSwap
    }));

    return paginatedResponse(res, formattedRequests, {
      page,
      limit,
      totalPages: Math.ceil(totalRequests / limit),
      totalItems: totalRequests
    });
  } catch (error) {
    console.error('Error fetching pending schedule requests:', error);
    return errorResponse(res, 'Failed to fetch pending schedule requests', 500);
  }
});

// Approve a request
export const approveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const approverId = req.user.id;

  try {
    const scheduleRequest = await ScheduleRequest.findById(id);
    if (!scheduleRequest) {
      return notFoundResponse(res, 'Schedule request');
    }

    // Check if request is already approved
    if (scheduleRequest.status === 'approved') {
      return errorResponse(res, 'Request is already approved', 400);
    }

    // Update request status
    scheduleRequest.status = 'approved';
    scheduleRequest.approvedBy = approverId;
    scheduleRequest.approvedAt = new Date();
    await scheduleRequest.save();

    // TODO: Implement actual schedule updates based on request type
    // For example, update staff availability, swap shifts, etc.

    // Send notification to staff
    const staff = await Staff.findById(scheduleRequest.staffId);
    if (staff && staff.user) {
      try {
        // Get salon information for the notification
        let salonName = 'Your Salon';
        let salonOwnerName = 'Salon Owner';
        if (staff.assignedSalon) {
          const salon = await Salon.findById(staff.assignedSalon);
          if (salon) {
            salonName = salon.salonName || 'Your Salon';
            salonOwnerName = salon.ownerName || 'Salon Owner';
          }
        }
        
        await StaffNotification.create({
          staffId: staff._id,
          staffName: staff.name,
          staffEmail: staff.email,
          senderId: approverId,
          senderType: 'Salon',
          senderName: salonOwnerName,
          senderEmail: staff.email, // This would be the salon owner's email
          senderSalonName: salonName,
          type: 'broadcast',
          subject: 'Request Approved',
          message: `Your ${scheduleRequest.type} request has been approved.`,
          targetSkill: 'All Staff',
          category: 'announcement', // Changed from 'schedule' to valid category
          priority: 'medium'
        });
      } catch (notificationError) {
        console.error('Error creating staff notification:', notificationError);
        // Don't fail the entire request if notification fails
      }
    }

    return successResponse(res, scheduleRequest, 'Request approved successfully');
  } catch (error) {
    console.error('Error approving schedule request:', error);
    return errorResponse(res, 'Failed to approve request', 500);
  }
});

// Reject a request
export const rejectRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const rejectorId = req.user.id;

  try {
    const scheduleRequest = await ScheduleRequest.findById(id);
    if (!scheduleRequest) {
      return notFoundResponse(res, 'Schedule request');
    }

    // Check if request is already rejected
    if (scheduleRequest.status === 'rejected') {
      return errorResponse(res, 'Request is already rejected', 400);
    }

    // Update request status
    scheduleRequest.status = 'rejected';
    scheduleRequest.rejectedBy = rejectorId;
    scheduleRequest.rejectedAt = new Date();
    scheduleRequest.rejectionReason = rejectionReason || 'No reason provided';
    await scheduleRequest.save();

    // Send notification to staff
    const staff = await Staff.findById(scheduleRequest.staffId);
    if (staff && staff.user) {
      try {
        // Get salon information for the notification
        let salonName = 'Your Salon';
        let salonOwnerName = 'Salon Owner';
        if (staff.assignedSalon) {
          const salon = await Salon.findById(staff.assignedSalon);
          if (salon) {
            salonName = salon.salonName || 'Your Salon';
            salonOwnerName = salon.ownerName || 'Salon Owner';
          }
        }
        
        await StaffNotification.create({
          staffId: staff._id,
          staffName: staff.name,
          staffEmail: staff.email,
          senderId: rejectorId,
          senderType: 'Salon',
          senderName: salonOwnerName,
          senderEmail: staff.email, // This would be the salon owner's email
          senderSalonName: salonName,
          type: 'broadcast',
          subject: 'Request Rejected',
          message: `Your ${scheduleRequest.type} request has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
          targetSkill: 'All Staff',
          category: 'announcement', // Changed from 'schedule' to valid category
          priority: 'medium'
        });
      } catch (notificationError) {
        console.error('Error creating staff notification:', notificationError);
        // Don't fail the entire request if notification fails
      }
    }

    return successResponse(res, scheduleRequest, 'Request rejected successfully');
  } catch (error) {
    console.error('Error rejecting schedule request:', error);
    return errorResponse(res, 'Failed to reject request', 500);
  }
});

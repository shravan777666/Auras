import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import Broadcast from '../models/Broadcast.js';
import StaffNotification from '../models/StaffNotification.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  asyncHandler 
} from '../utils/responses.js';

// Get all unique skills from staff profiles
export const getAllSkills = asyncHandler(async (req, res) => {
  try {
    // Aggregate all unique skills from staff collection
    const skillsAggregation = await Staff.aggregate([
      {
        $match: {
          approvalStatus: 'approved',
          isActive: true,
          skills: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$skills'
      },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1, _id: 1 }
      }
    ]);

    const skills = skillsAggregation.map(item => ({
      skill: item._id,
      staffCount: item.count
    }));

    console.log(`📊 Found ${skills.length} unique skills across ${skillsAggregation.reduce((sum, item) => sum + item.count, 0)} staff members`);

    successResponse(res, {
      skills,
      totalSkills: skills.length,
      totalStaffWithSkills: skillsAggregation.reduce((sum, item) => sum + item.count, 0)
    }, 'Skills retrieved successfully');

  } catch (error) {
    console.error('Error fetching skills:', error);
    errorResponse(res, 'Failed to fetch skills', 500);
  }
});

// Get target count for a specific skill
export const getTargetCount = asyncHandler(async (req, res) => {
  try {
    const { skill } = req.query;

    if (!skill) {
      return errorResponse(res, 'Skill parameter is required', 400);
    }

    // Count staff members with the specified skill
    const targetCount = await Staff.countDocuments({
      approvalStatus: 'approved',
      isActive: true,
      skills: { $in: [skill] }
    });

    // Get sample staff for preview (first 5)
    const sampleStaff = await Staff.find({
      approvalStatus: 'approved',
      isActive: true,
      skills: { $in: [skill] }
    })
    .select('name email position experience')
    .limit(5)
    .lean();

    console.log(`🎯 Skill "${skill}" targets ${targetCount} staff members`);

    successResponse(res, {
      skill,
      targetCount,
      sampleStaff,
      message: `This broadcast will reach ${targetCount} staff member${targetCount !== 1 ? 's' : ''} with "${skill}" skill`
    }, 'Target count retrieved successfully');

  } catch (error) {
    console.error('Error getting target count:', error);
    errorResponse(res, 'Failed to get target count', 500);
  }
});

// Send broadcast to staff with specific skill
export const sendBroadcast = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message, targetSkill, category = 'general', priority = 'medium' } = req.body;

    // Validation
    if (!subject || !message || !targetSkill) {
      return errorResponse(res, 'Subject, message, and target skill are required', 400);
    }

    if (subject.length > 200) {
      return errorResponse(res, 'Subject must be 200 characters or less', 400);
    }

    if (message.length > 2000) {
      return errorResponse(res, 'Message must be 2000 characters or less', 400);
    }

    // Get sender salon information
    let User;
    try {
      User = (await import('../models/User.js')).default;
    } catch (importError) {
      console.error('Failed to import User model:', importError);
      return errorResponse(res, 'Internal server error - failed to load user model', 500);
    }
    
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can send broadcasts', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return errorResponse(res, 'Salon profile not found', 404);
    }

    // Find target staff members
    const targetStaff = await Staff.find({
      approvalStatus: 'approved',
      isActive: true,
      skills: { $in: [targetSkill] }
    }).select('_id name email position skills experience').lean();

    if (targetStaff.length === 0) {
      return errorResponse(res, `No active staff members found with "${targetSkill}" skill`, 404);
    }

    console.log(`📢 Preparing broadcast from ${salon.salonName} to ${targetStaff.length} staff members with "${targetSkill}" skill`);

    // Create broadcast record
    const broadcast = new Broadcast({
      senderId: salon._id,
      senderName: salon.ownerName || user.name,
      senderSalonName: salon.salonName,
      subject,
      message,
      targetSkill,
      targetStaffIds: targetStaff.map(staff => staff._id),
      targetCount: targetStaff.length,
      status: 'sent'
    });

    await broadcast.save();

    // Create individual notifications for each target staff member
    const notifications = targetStaff.map(staff => ({
      staffId: staff._id,
      staffName: staff.name,
      staffEmail: staff.email,
      senderId: salon._id,
      senderType: 'Salon', // Add the required senderType field
      senderName: salon.ownerName || user.name,
      senderEmail: user.email, // Add sender email
      senderSalonName: salon.salonName,
      broadcastId: broadcast._id,
      subject,
      message,
      targetSkill,
      category,
      priority,
      status: 'delivered', // Mark as delivered immediately for now
      type: 'broadcast' // Add the required type field
    }));

    // Bulk insert notifications
    const createdNotifications = await StaffNotification.insertMany(notifications);

    // Update broadcast with delivery count
    broadcast.deliveredCount = createdNotifications.length;
    broadcast.status = 'delivered';
    await broadcast.save();

    console.log(`✅ Broadcast sent successfully: ${createdNotifications.length} notifications created`);

    // Prepare response with broadcast summary
    const response = {
      broadcastId: broadcast._id,
      subject: broadcast.subject,
      targetSkill: broadcast.targetSkill,
      targetCount: broadcast.targetCount,
      deliveredCount: broadcast.deliveredCount,
      sentAt: broadcast.sentAt,
      status: broadcast.status,
      targetStaffSample: targetStaff.slice(0, 5).map(staff => ({
        name: staff.name,
        position: staff.position,
        experience: staff.experience?.years || 0
      }))
    };

    successResponse(res, response, `Broadcast sent successfully to ${broadcast.deliveredCount} staff members`);

  } catch (error) {
    console.error('Error sending broadcast:', error);
    errorResponse(res, 'Failed to send broadcast: ' + error.message, 500);
  }
});

// Get broadcast history for a salon
export const getBroadcastHistory = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get sender salon information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view broadcast history', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return errorResponse(res, 'Salon profile not found', 404);
    }

    // Get broadcasts with pagination
    const broadcasts = await Broadcast.find({ senderId: salon._id })
      .sort({ sentAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalBroadcasts = await Broadcast.countDocuments({ senderId: salon._id });

    // Format broadcasts for response
    const formattedBroadcasts = broadcasts.map(broadcast => ({
      id: broadcast._id,
      subject: broadcast.subject,
      targetSkill: broadcast.targetSkill,
      targetCount: broadcast.targetCount,
      deliveredCount: broadcast.deliveredCount,
      readCount: broadcast.readCount,
      deliveryRate: broadcast.targetCount > 0 ? ((broadcast.deliveredCount / broadcast.targetCount) * 100).toFixed(1) : 0,
      readRate: broadcast.deliveredCount > 0 ? ((broadcast.readCount / broadcast.deliveredCount) * 100).toFixed(1) : 0,
      status: broadcast.status,
      sentAt: broadcast.sentAt,
      createdAt: broadcast.createdAt
    }));

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalBroadcasts,
      pages: Math.ceil(totalBroadcasts / parseInt(limit))
    };

    paginatedResponse(res, {
      broadcasts: formattedBroadcasts,
      pagination
    }, 'Broadcast history retrieved successfully');

  } catch (error) {
    console.error('Error fetching broadcast history:', error);
    errorResponse(res, 'Failed to fetch broadcast history', 500);
  }
});

// Get broadcast analytics for a salon
export const getBroadcastAnalytics = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = 30 } = req.query; // days

    // Get sender salon information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view analytics', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return errorResponse(res, 'Salon profile not found', 404);
    }

    // Get analytics using the static method
    const analytics = await Broadcast.getAnalytics(salon._id, parseInt(timeframe));

    const analyticsData = analytics.length > 0 ? analytics[0] : {
      totalBroadcasts: 0,
      totalStaffReached: 0,
      totalDelivered: 0,
      totalRead: 0,
      avgDeliveryRate: 0,
      avgReadRate: 0
    };

    // Get top performing skills
    const topSkills = await Broadcast.aggregate([
      {
        $match: {
          senderId: salon._id,
          sentAt: { $gte: new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$targetSkill',
          broadcasts: { $sum: 1 },
          totalReached: { $sum: '$targetCount' },
          totalDelivered: { $sum: '$deliveredCount' },
          totalRead: { $sum: '$readCount' }
        }
      },
      {
        $sort: { broadcasts: -1 }
      },
      {
        $limit: 5
      }
    ]);

    successResponse(res, {
      timeframe: parseInt(timeframe),
      summary: analyticsData,
      topSkills,
      salonName: salon.salonName
    }, 'Broadcast analytics retrieved successfully');

  } catch (error) {
    console.error('Error fetching broadcast analytics:', error);
    errorResponse(res, 'Failed to fetch broadcast analytics', 500);
  }
});

// Get detailed broadcast information
export const getBroadcastDetails = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { broadcastId } = req.params;

    // Get sender salon information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can view broadcast details', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return errorResponse(res, 'Salon profile not found', 404);
    }

    // Get broadcast details
    const broadcast = await Broadcast.findOne({ 
      _id: broadcastId, 
      senderId: salon._id 
    }).lean();

    if (!broadcast) {
      return errorResponse(res, 'Broadcast not found', 404);
    }

    // Get notification details
    const notifications = await StaffNotification.find({ broadcastId })
      .populate('staffId', 'name email position experience')
      .sort({ createdAt: -1 })
      .lean();

    const response = {
      broadcast: {
        ...broadcast,
        deliveryRate: broadcast.targetCount > 0 ? ((broadcast.deliveredCount / broadcast.targetCount) * 100).toFixed(1) : 0,
        readRate: broadcast.deliveredCount > 0 ? ((broadcast.readCount / broadcast.deliveredCount) * 100).toFixed(1) : 0
      },
      notifications: notifications.map(notification => ({
        id: notification._id,
        staffName: notification.staffId?.name || notification.staffName,
        staffEmail: notification.staffId?.email || notification.staffEmail,
        staffPosition: notification.staffId?.position,
        status: notification.status,
        isRead: notification.isRead,
        sentAt: notification.sentAt,
        deliveredAt: notification.deliveredAt,
        readAt: notification.readAt
      }))
    };

    successResponse(res, response, 'Broadcast details retrieved successfully');

  } catch (error) {
    console.error('Error fetching broadcast details:', error);
    errorResponse(res, 'Failed to fetch broadcast details', 500);
  }
});

export default {
  getAllSkills,
  getTargetCount,
  sendBroadcast,
  getBroadcastHistory,
  getBroadcastAnalytics,
  getBroadcastDetails
};

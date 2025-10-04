import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import StaffNotification from '../models/StaffNotification.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  asyncHandler 
} from '../utils/responses.js';

// Get notifications for the logged-in staff member
export const getStaffNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false, 
      category = null,
      includeArchived = false 
    } = req.query;

    // Get staff information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User account not found. Please log in again.', 401);
    }

    if (user.type !== 'staff') {
      return errorResponse(res, 'Access denied: Only staff members can view notifications', 403);
    }

    const staff = await Staff.findOne({ email: user.email });
    if (!staff) {
      console.warn('Staff profile missing for user', { userId, email: user.email });
      return errorResponse(res, 'Staff profile not found. Please complete staff onboarding.', 404);
    }

    console.log(`📬 Fetching notifications for staff: ${staff.name} (${staff.email})`);

    // Build filter options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      category: category || null,
      includeArchived: includeArchived === 'true'
    };

    // Get notifications using the static method
    const notifications = await StaffNotification.getForStaff(staff._id, options);
    
    // Get total count for pagination
    const totalFilter = { 
      staffId: staff._id,
      ...(options.unreadOnly && { isRead: false }),
      ...(options.category && { category: options.category }),
      ...(!options.includeArchived && { isArchived: false })
    };
    
    const totalNotifications = await StaffNotification.countDocuments(totalFilter);

    // Get unread count
    const unreadCount = await StaffNotification.getUnreadCount(staff._id);

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => {
      const senderDocument = notification.senderId;
      const senderId = senderDocument?._id ? senderDocument._id.toString() : senderDocument?.toString?.() || notification.senderId;

      return {
        id: notification._id,
        subject: notification.subject,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        targetSkill: notification.targetSkill,
        isRead: notification.isRead,
        isArchived: notification.isArchived,
        sentAt: notification.sentAt,
        readAt: notification.readAt,
        deliveredAt: notification.deliveredAt,
        timeSinceSent: notification.timeSinceSent,
        sender: {
          name: notification.senderName,
          salonName: notification.senderSalonName,
          salonId: senderId
        },
        broadcast: notification.broadcastId ? {
          id: notification.broadcastId._id,
          subject: notification.broadcastId.subject,
          targetSkill: notification.broadcastId.targetSkill,
          sentAt: notification.broadcastId.sentAt
        } : null
      };
    });

    console.log(`✅ Retrieved ${formattedNotifications.length} notifications for ${staff.name}`);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalNotifications,
      pages: Math.ceil(totalNotifications / parseInt(limit))
    };

    paginatedResponse(res, {
      notifications: formattedNotifications,
      pagination,
      unreadCount,
      staffInfo: {
        name: staff.name,
        email: staff.email,
        position: staff.position
      }
    }, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Error fetching staff notifications:', error);
    errorResponse(res, 'Failed to fetch notifications', 500);
  }
});

// Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    // Get staff information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'staff') {
      return errorResponse(res, 'Access denied: Only staff members can mark notifications as read', 403);
    }

    const staff = await Staff.findOne({ email: user.email });
    if (!staff) {
      return errorResponse(res, 'Staff profile not found', 404);
    }

    // Find the notification
    const notification = await StaffNotification.findOne({
      _id: notificationId,
      staffId: staff._id
    });

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      const metadata = {
        readAt: new Date(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      };

      await notification.markAsRead(metadata);
      console.log(`📖 Notification marked as read: ${notification.subject} for ${staff.name}`);
    }

    successResponse(res, {
      notificationId: notification._id,
      isRead: true,
      readAt: notification.readAt
    }, 'Notification marked as read');

  } catch (error) {
    console.error('Error marking notification as read:', error);
    errorResponse(res, 'Failed to mark notification as read', 500);
  }
});

// Mark multiple notifications as read
export const markMultipleAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return errorResponse(res, 'Notification IDs array is required', 400);
    }

    // Get staff information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'staff') {
      return errorResponse(res, 'Access denied: Only staff members can mark notifications as read', 403);
    }

    const staff = await Staff.findOne({ email: user.email });
    if (!staff) {
      return errorResponse(res, 'Staff profile not found', 404);
    }

    // Mark multiple notifications as read
    const result = await StaffNotification.markMultipleAsRead(staff._id, notificationIds);

    console.log(`📖 Marked ${result.modifiedCount} notifications as read for ${staff.name}`);

    successResponse(res, {
      markedCount: result.modifiedCount,
      notificationIds
    }, `${result.modifiedCount} notifications marked as read`);

  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    errorResponse(res, 'Failed to mark notifications as read', 500);
  }
});

// Archive notification
export const archiveNotification = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    // Get staff information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'staff') {
      return errorResponse(res, 'Access denied: Only staff members can archive notifications', 403);
    }

    const staff = await Staff.findOne({ email: user.email });
    if (!staff) {
      return errorResponse(res, 'Staff profile not found', 404);
    }

    // Find and archive the notification
    const notification = await StaffNotification.findOneAndUpdate(
      {
        _id: notificationId,
        staffId: staff._id
      },
      {
        isArchived: true,
        archivedAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    console.log(`🗄️ Notification archived: ${notification.subject} for ${staff.name}`);

    successResponse(res, {
      notificationId: notification._id,
      isArchived: true,
      archivedAt: notification.archivedAt
    }, 'Notification archived successfully');

  } catch (error) {
    console.error('Error archiving notification:', error);
    errorResponse(res, 'Failed to archive notification', 500);
  }
});

// Send reply to notification
export const sendReply = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, recipient, originalMessageId } = req.body;

    console.log('📨 Processing reply request:', { userId, message, recipient, originalMessageId });

    // Get staff information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'staff') {
      console.log('❌ Access denied - User is not staff:', { userId, userType: user?.type });
      return errorResponse(res, 'Access denied: Only staff members can send replies', 403);
    }

    const staff = await Staff.findOne({ email: user.email });
    if (!staff) {
      console.log('❌ Staff profile not found for user:', { userId, email: user.email });
      return errorResponse(res, 'Staff profile not found', 404);
    }

    console.log('👤 Staff profile found:', { staffId: staff._id, name: staff.name });

    // Find the original notification
    const originalNotification = await StaffNotification.findById(originalMessageId);
    if (!originalNotification) {
      console.log('❌ Original notification not found:', { originalMessageId });
      return errorResponse(res, 'Original notification not found', 404);
    }

    console.log('📄 Original notification found:', { 
      notificationId: originalNotification._id,
      staffId: originalNotification.staffId,
      senderId: originalNotification.senderId
    });

    // Verify the notification belongs to this staff member
    if (originalNotification.staffId.toString() !== staff._id.toString()) {
      console.log('❌ Access denied - Notification does not belong to staff:', {
        notificationStaffId: originalNotification.staffId.toString(),
        staffId: staff._id.toString()
      });
      return errorResponse(res, 'Access denied: You can only reply to your own notifications', 403);
    }

    // Validate recipient ID
    if (!recipient || typeof recipient !== 'string') {
      console.log('❌ Invalid recipient ID:', { recipient });
      return errorResponse(res, 'Invalid recipient ID', 400);
    }

    // Get salon information for the sender
    let senderSalonName = 'Staff Member';
    if (staff.assignedSalon) {
      const salon = await Salon.findById(staff.assignedSalon);
      if (salon) {
        senderSalonName = salon.salonName || 'Staff Member';
      }
      console.log('🏢 Salon info for sender:', { assignedSalon: staff.assignedSalon, senderSalonName });
    }

    // Create a new notification for the salon owner
    const replyNotification = new StaffNotification({
      staffId: originalNotification.senderId, // The original sender (salon) becomes the recipient
      staffName: originalNotification.senderName || 'Salon Owner',
      staffEmail: originalNotification.senderEmail || 'salon-owner@auracare.com',
      senderId: staff._id, // The current staff becomes the sender
      senderType: 'Staff', // Specify that the sender is a staff member
      senderName: staff.name,
      senderEmail: staff.email,
      senderSalonName: senderSalonName,
      broadcastId: originalNotification.broadcastId,
      type: 'direct_message',
      subject: `Re: ${originalNotification.subject}`,
      message: message,
      targetSkill: originalNotification.targetSkill,
      status: 'sent',
      priority: 'medium',
      category: 'general'
    });

    console.log('📤 Creating reply notification:', {
      staffId: replyNotification.staffId,
      senderId: replyNotification.senderId,
      subject: replyNotification.subject
    });

    await replyNotification.save();

    console.log(`✅ Reply sent from ${staff.name} to ${originalNotification.senderName}`);

    successResponse(res, {
      replyId: replyNotification._id,
      message: 'Reply sent successfully'
    }, 'Reply sent successfully');

  } catch (error) {
    console.error('❌ Error sending reply:', error);
    errorResponse(res, 'Failed to send reply', 500);
  }
});

// Get notification statistics for staff
export const getNotificationStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = 30 } = req.query;

    // Get staff information
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'staff') {
      return errorResponse(res, 'Access denied: Only staff members can view notification stats', 403);
    }

    const staff = await Staff.findOne({ email: user.email });
    if (!staff) {
      return errorResponse(res, 'Staff profile not found', 404);
    }

    // Get statistics using the static method
    const stats = await StaffNotification.getStaffStats(staff._id, parseInt(timeframe));

    const statsData = stats.length > 0 ? stats[0] : {
      totalNotifications: 0,
      unreadNotifications: 0,
      readNotifications: 0,
      byCategory: [],
      bySkill: []
    };

    // Process category and skill statistics
    const categoryStats = {};
    const skillStats = {};

    if (statsData.byCategory) {
      statsData.byCategory.forEach(item => {
        categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
      });
    }

    if (statsData.bySkill) {
      statsData.bySkill.forEach(item => {
        skillStats[item.skill] = (skillStats[item.skill] || 0) + 1;
      });
    }

    successResponse(res, {
      timeframe: parseInt(timeframe),
      summary: {
        total: statsData.totalNotifications,
        unread: statsData.unreadNotifications,
        read: statsData.readNotifications,
        readRate: statsData.totalNotifications > 0 ? 
          ((statsData.readNotifications / statsData.totalNotifications) * 100).toFixed(1) : 0
      },
      byCategory: categoryStats,
      bySkill: skillStats,
      staffInfo: {
        name: staff.name,
        email: staff.email,
        position: staff.position
      }
    }, 'Notification statistics retrieved successfully');

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    errorResponse(res, 'Failed to fetch notification statistics', 500);
  }
});

export default {
  getStaffNotifications,
  markNotificationAsRead,
  markMultipleAsRead,
  archiveNotification,
  sendReply,
  getNotificationStats
};
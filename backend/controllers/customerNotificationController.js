import { asyncHandler, successResponse, errorResponse, notFoundResponse } from '../utils/responses.js';
import CustomerNotification from '../models/CustomerNotification.js';

// @desc    Get customer notifications
// @route   GET /api/customer/notifications
// @access  Private/Customer
export const getCustomerNotifications = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false, category = null, includeArchived = false } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      category,
      includeArchived: includeArchived === 'true'
    };

    // Get notifications using the static method
    const notifications = await CustomerNotification.getForCustomer(customerId, options);

    // Get total count for pagination
    const filter = {
      customerId,
      ...(unreadOnly === 'true' && { isRead: false }),
      ...(category && { category }),
      ...(!includeArchived === 'true' && { isArchived: false })
    };

    const totalNotifications = await CustomerNotification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / parseInt(limit));

    // Get unread count
    const unreadCount = await CustomerNotification.getUnreadCount(customerId);

    return successResponse(res, {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalNotifications,
        pages: totalPages
      },
      unreadCount
    }, 'Notifications retrieved successfully');
  } catch (error) {
    console.error('Error fetching customer notifications:', error);
    return errorResponse(res, 'Failed to fetch notifications: ' + error.message, 500);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/customer/notifications/:notificationId/read
// @access  Private/Customer
export const markCustomerNotificationAsRead = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    const { notificationId } = req.params;

    // Find and update notification
    const notification = await CustomerNotification.findOneAndUpdate(
      { _id: notificationId, customerId },
      { 
        isRead: true,
        readAt: new Date(),
        status: 'read'
      },
      { new: true }
    );

    if (!notification) {
      return notFoundResponse(res, 'Notification');
    }

    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return errorResponse(res, 'Failed to mark notification as read: ' + error.message, 500);
  }
});

// @desc    Mark multiple notifications as read
// @route   PUT /api/customer/notifications/read
// @access  Private/Customer
export const markMultipleCustomerNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return errorResponse(res, 'Notification IDs are required', 400);
    }

    // Mark multiple notifications as read
    const result = await CustomerNotification.markMultipleAsRead(customerId, notificationIds);

    return successResponse(res, {
      modifiedCount: result.modifiedCount
    }, `${result.modifiedCount} notifications marked as read`);
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    return errorResponse(res, 'Failed to mark notifications as read: ' + error.message, 500);
  }
});

export default {
  getCustomerNotifications,
  markCustomerNotificationAsRead,
  markMultipleCustomerNotificationsAsRead
};
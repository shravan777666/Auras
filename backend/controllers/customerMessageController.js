import { successResponse, errorResponse, notFoundResponse } from '../utils/responses.js';
import Message from '../models/Message.js';
import ClientProfile from '../models/ClientProfile.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';

// Get all conversations for a customer
export const getCustomerConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get customer from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'customer') {
      return errorResponse(res, 'Access denied: Only customers can access conversations', 403);
    }

    const customer = await Customer.findOne({ email: user.email });
    if (!customer) {
      return notFoundResponse(res, 'Customer profile');
    }

    // Get all conversations for this customer
    const conversations = await Message.aggregate([
      {
        $match: { customerId: customer._id }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$salonId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isRead', false] }, { $eq: ['$senderType', 'salon'] }] },
                1,
                0
              ]
            }
          },
          totalMessages: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'salons',
          localField: '_id',
          foreignField: '_id',
          as: 'salon'
        }
      },
      {
        $unwind: '$salon'
      },
      {
        $project: {
          salonId: '$_id',
          salonName: '$salon.salonName',
          salonEmail: '$salon.email',
          salonPhone: '$salon.contactNumber',
          salonAddress: '$salon.address',
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            senderType: '$lastMessage.senderType',
            isRead: '$lastMessage.isRead'
          },
          unreadCount: 1,
          totalMessages: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    return successResponse(res, {
      conversations,
      totalConversations: conversations.length
    }, 'Conversations retrieved successfully');

  } catch (error) {
    console.error('Error getting customer conversations:', error);
    return errorResponse(res, 'Failed to retrieve conversations', 500);
  }
};

// Get specific conversation messages
export const getConversationMessages = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Get customer from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'customer') {
      return errorResponse(res, 'Access denied: Only customers can access conversations', 403);
    }

    const customer = await Customer.findOne({ email: user.email });
    if (!customer) {
      return notFoundResponse(res, 'Customer profile');
    }

    // Verify salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    const skip = (page - 1) * limit;
    
    // Get conversation messages
    const messages = await Message.find({
      salonId,
      customerId: customer._id
    })
    .populate('senderId', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    // Mark salon messages as read
    await Message.updateMany(
      {
        salonId,
        customerId: customer._id,
        senderType: 'salon',
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Get total message count for pagination
    const conversationId = Message.createConversationId(salonId, customer._id);
    const totalMessages = await Message.countDocuments({ conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    return successResponse(res, {
      messages: messages.reverse(), // Reverse to show oldest first
      salon: {
        id: salon._id,
        name: salon.salonName,
        email: salon.email,
        phone: salon.contactNumber,
        address: salon.address
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalMessages
      }
    }, 'Conversation messages retrieved successfully');

  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return errorResponse(res, 'Failed to retrieve conversation messages', 500);
  }
};

// Send message to salon
export const sendMessageToSalon = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { content, messageType = 'text', replyTo } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return errorResponse(res, 'Message content is required', 400);
    }

    // Get customer from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'customer') {
      return errorResponse(res, 'Access denied: Only customers can send messages', 403);
    }

    const customer = await Customer.findOne({ email: user.email });
    if (!customer) {
      return notFoundResponse(res, 'Customer profile');
    }

    // Verify salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }

    // Send message
    const message = await Message.sendMessage({
      salonId,
      customerId: customer._id,
      senderId: customer._id,
      senderType: 'customer',
      senderName: customer.name,
      content: content.trim(),
      messageType,
      replyTo
    });

    return successResponse(res, message, 'Message sent successfully');

  } catch (error) {
    console.error('Error sending message to salon:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

// Mark specific message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Get customer from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'customer') {
      return errorResponse(res, 'Access denied: Only customers can mark messages as read', 403);
    }

    const customer = await Customer.findOne({ email: user.email });
    if (!customer) {
      return notFoundResponse(res, 'Customer profile');
    }

    // Find and update message
    const message = await Message.findOne({
      _id: messageId,
      customerId: customer._id,
      senderType: 'salon' // Only mark salon messages as read
    });

    if (!message) {
      return notFoundResponse(res, 'Message');
    }

    await message.markAsRead();

    return successResponse(res, message, 'Message marked as read');

  } catch (error) {
    console.error('Error marking message as read:', error);
    return errorResponse(res, 'Failed to mark message as read', 500);
  }
};

// Get unread message count for customer
export const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get customer from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'customer') {
      return errorResponse(res, 'Access denied: Only customers can access message counts', 403);
    }

    const customer = await Customer.findOne({ email: user.email });
    if (!customer) {
      return notFoundResponse(res, 'Customer profile');
    }

    // Count unread messages from salons
    const unreadCount = await Message.countDocuments({
      customerId: customer._id,
      senderType: 'salon',
      isRead: false
    });

    // Get unread count by salon
    const unreadBySalon = await Message.aggregate([
      {
        $match: {
          customerId: customer._id,
          senderType: 'salon',
          isRead: false
        }
      },
      {
        $group: {
          _id: '$salonId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'salons',
          localField: '_id',
          foreignField: '_id',
          as: 'salon'
        }
      },
      {
        $unwind: '$salon'
      },
      {
        $project: {
          salonId: '$_id',
          salonName: '$salon.salonName',
          unreadCount: '$count'
        }
      }
    ]);

    return successResponse(res, {
      totalUnreadCount: unreadCount,
      unreadBySalon
    }, 'Unread message count retrieved successfully');

  } catch (error) {
    console.error('Error getting unread message count:', error);
    return errorResponse(res, 'Failed to retrieve unread message count', 500);
  }
};

// Get customer's message notifications
export const getMessageNotifications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    // Get customer from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'customer') {
      return errorResponse(res, 'Access denied: Only customers can access notifications', 403);
    }

    const customer = await Customer.findOne({ email: user.email });
    if (!customer) {
      return notFoundResponse(res, 'Customer profile');
    }

    // Get recent messages from salons (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const notifications = await Message.find({
      customerId: customer._id,
      senderType: 'salon',
      createdAt: { $gte: oneDayAgo }
    })
    .populate('salonId', 'salonName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    return successResponse(res, {
      notifications: notifications.map(msg => ({
        id: msg._id,
        salonName: msg.salonId?.salonName,
        salonId: msg.salonId?._id,
        content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
        createdAt: msg.createdAt,
        isRead: msg.isRead
      }))
    }, 'Message notifications retrieved successfully');

  } catch (error) {
    console.error('Error getting message notifications:', error);
    return errorResponse(res, 'Failed to retrieve message notifications', 500);
  }
};

export default {
  getCustomerConversations,
  getConversationMessages,
  sendMessageToSalon,
  markMessageAsRead,
  getUnreadMessageCount,
  getMessageNotifications
};
